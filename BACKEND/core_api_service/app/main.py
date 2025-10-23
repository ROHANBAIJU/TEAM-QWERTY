
# File: BACKEND/core_api_service/app/main.py

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

# Import our application modules
from .config import settings
from .comms.websocket_manager import ConnectionManager
from .comms.manager import frontend_manager
from .comms.firestore_client import (
    get_firestore_db, 
    save_sensor_data, 
    save_alert
)
from .models.schemas import DeviceData, Alert, ProcessedData
from .services.ai_processor import process_data_with_ai
from .services.rag_agent import generate_contextual_alert
from .routes.auth import router as auth_router
from .routes import ingest as ingest_router_module
from .routes import consent as consent_router_module

# --- Globals & Setup ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="StanceSense Core API",
    description="Handles data processing, AI, RAG, and frontend communication.",
    version="1.0.0"
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(ingest_router_module.router, prefix="/ingest", tags=["ingest"])
app.include_router(consent_router_module.router, prefix="/user", tags=["consent"])

# --- CORS Middleware ---
# Allow all origins for the hackathon
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- WebSocket Manager for Frontend ---
# Use the shared frontend_manager singleton so other modules can broadcast
# (e.g. background tasks in routes/ingest.py)
# frontend_manager is imported from app.comms.manager

# --- Firestore DB Dependency ---
# This uses the dependency injection system of FastAPI
# We will use __app_id and __firebase_config here
# We'll also handle auth
# Note: For a real app, you'd get db in routes, but for simplicity:
db = get_firestore_db()
app_id = settings.APP_ID # Get app_id from config
user_id = "temp_user_id" # This would come from Firebase Auth

# --- Routes ---

@app.get("/")
def read_root():
    return {"message": "StanceSense Core API is running."}

# --- Internal Ingestion Route ---
# This is the endpoint the Node.js service sends data to.
@app.post("/ingest/data", status_code=202)
async def http_ingest_data(data: DeviceData):
    """
    Receives raw data from the Node.js ingestion service,
    processes it, and broadcasts it to the frontend.
    """
    try:
        logger.info(f"CoreAPI: Received data packet: {data.timestamp}")
        
        # 1. Save raw data to Firestore
        await save_sensor_data(db, app_id, user_id, data)

        # 2. Process data with internal AI models (await async processor)
        processed_data: ProcessedData = await process_data_with_ai(data)

        # 3. Check for critical events (Fall or High Rigidity)
        # Use the processor's computed decision if available, otherwise fallback
        critical_event = getattr(processed_data, "critical_event", None)
        if critical_event is None:
            if processed_data.safety.fall_detected:
                critical_event = "fall"
            elif processed_data.analysis.is_rigid:
                critical_event = "rigidity_spike"

        if critical_event:
            # 4. If critical, trigger RAG agent for a rich alert
            logger.info(f"Critical event detected: {critical_event}. Triggering RAG.")
            alert_message = await generate_contextual_alert(processed_data, critical_event)

            alert = Alert(
                timestamp=processed_data.timestamp,
                event_type=critical_event,
                message=alert_message,
                data_snapshot=processed_data.model_dump()
            )

            # 5. Save the rich alert to Firestore
            await save_alert(db, app_id, user_id, alert)

            # 6. Broadcast the ALERT to the frontend
            await frontend_manager.broadcast(alert.model_dump_json())

        else:
            # 6b. Broadcast the regular PROCESSED DATA to the frontend
            await frontend_manager.broadcast(processed_data.model_dump_json())

        return {"status": "accepted"}

    except Exception as e:
        logger.error(f"Error in ingestion pipeline: {e}")
        return {"status": "error", "detail": str(e)}


# --- Frontend WebSocket Endpoint ---
# The web dashboard connects here to get real-time processed data
@app.websocket("/ws/frontend-data")
async def websocket_frontend_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for the frontend to receive real-time
    processed data and alerts.
    """
    await frontend_manager.connect(websocket)
    logger.info("Frontend client connected to WebSocket.")
    try:
        while True:
            # Keep the connection alive, listening for any messages
            data = await websocket.receive_text()
            # We don't expect messages from frontend, but can handle them
            logger.info(f"Received message from frontend: {data}")
    except WebSocketDisconnect:
        frontend_manager.disconnect(websocket)
        logger.info("Frontend client disconnected.")

# --- Main entry point for uvicorn ---
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)


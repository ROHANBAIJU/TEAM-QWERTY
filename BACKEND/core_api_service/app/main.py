
# File: BACKEND/core_api_service/app/main.py

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.responses import JSONResponse
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
    save_alert,
    initialize_firestore,
)
from .models.schemas import DeviceData, Alert, ProcessedData
from .services.ai_processor import process_data_with_ai
from .services.rag_agent import generate_contextual_alert
from .routes.auth import router as auth_router
from .routes import ingest as ingest_router_module
from .routes import consent as consent_router_module
from .routes import frontend as frontend_router_module
from .routes import aggregated as aggregated_router_module

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
app.include_router(frontend_router_module.router, prefix="/api", tags=["analytics"])
app.include_router(aggregated_router_module.router)  # Already has /ingest prefix

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
# We'll initialize Firebase/Admin and the Firestore client at application startup
db = None
app_id = settings.APP_ID # Get app_id from config
user_id = "temp_user_id" # This would come from Firebase Auth


@app.on_event("startup")
async def startup_event():
    """Application startup: initialize firebase_admin and Firestore client."""
    try:
        initialize_firestore()
        global db
        db = get_firestore_db()
        logger.info("Firebase / Firestore initialized on startup.")
    except Exception as e:
        logger.error(f"Error initializing Firebase on startup: {e}")

# --- Routes ---

@app.get("/")
def read_root():
    return {"message": "StanceSense Core API is running."}


@app.get("/health")
async def health():
    """Health endpoint: checks Firestore connectivity."""
    try:
        db_local = get_firestore_db()
        firestore_ok = db_local is not None
        if firestore_ok:
            return {"status": "ok", "firestore": True}
        return JSONResponse(status_code=503, content={"status": "unhealthy", "firestore": False})
    except Exception as e:
        return JSONResponse(status_code=503, content={"status": "unhealthy", "detail": str(e)})

# Note: the canonical ingest endpoints are implemented in `app.routes.ingest`.
# The duplicate inline /ingest/data handler was removed to avoid route conflicts.


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


# File: BACKEND/core_api_service/app/comms/websocket_manager.py

from fastapi import WebSocket
import logging
from typing import List

logger = logging.getLogger(__name__)

class ConnectionManager:
    """
    Manages active WebSocket connections for the frontend.
    """
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Accepts a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New frontend connection. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Removes a WebSocket connection."""
        self.active_connections.remove(websocket)
        logger.info(f"Frontend disconnected. Total: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Sends a message to a single WebSocket."""
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        """Broadcasts a message to all connected clients."""
        if not self.active_connections:
            logger.warning("Broadcast called, but no clients are connected.")
            return

        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Failed to send message to client: {e}")
                # Optional: remove dead connections
                # self.active_connections.remove(connection)
        
        logger.debug(f"Broadcasted message to {len(self.active_connections)} clients.")


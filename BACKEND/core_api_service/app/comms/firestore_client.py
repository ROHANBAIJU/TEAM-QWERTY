# File: BACKEND/core_api_service/app/comms/firestore_client.py
#
# UPDATED: Removed 'await' from doc_ref.set() calls.

import logging
from google.cloud import firestore
from ..models.schemas import DeviceData, Alert
from ..config import settings
import google.cloud.firestore
import json
import os
import asyncio

# --- Firebase Config ---
if "GOOGLE_APPLICATION_CREDENTIALS" not in os.environ:
    try:
        firebase_config = json.loads(settings.FIREBASE_CONFIG)
        logging.info("Attempting to use Application Default Credentials for Firestore.")
    except Exception:
        logging.warning("Could not parse __firebase_config. Using default credentials.")

logger = logging.getLogger(__name__)

def get_firestore_db():
    """
    Initializes and returns the Firestore client.
    """
    try:
        db = firestore.Client()
        logger.info("Firestore DB client initialized successfully.")
        return db
    except Exception as e:
        logger.error(f"Failed to initialize Firestore: {e}")
        return None 

async def save_sensor_data(db: firestore.Client, app_id: str, user_id: str, data: DeviceData):
    """
    Saves a raw sensor data packet to Firestore.
    """
    if not db:
        logger.warning("Firestore not initialized. Skipping save_sensor_data.")
        return

    try:
        # Path: /artifacts/{appId}/users/{userId}/sensor_data/{timestamp}
        doc_ref = db.collection(
            "artifacts", app_id, "users", user_id, "sensor_data"
        ).document(data.timestamp)

        # Run the blocking Firestore set in a thread to avoid blocking the event loop
        await asyncio.to_thread(doc_ref.set, data.model_dump())
        logger.info(f"Saved sensor data for {data.timestamp}")
    except Exception as e:
        logger.error(f"Error saving sensor data: {e}")

async def save_alert(db: firestore.Client, app_id: str, user_id: str, alert: Alert):
    """
    Saves a critical alert to its own collection in Firestore.
    """
    if not db:
        logger.warning("Firestore not initialized. Skipping save_alert.")
        return
        
    try:
        # Path: /artifacts/{appId}/users/{userId}/alerts/{timestamp}
        doc_ref = db.collection(
            "artifacts", app_id, "users", user_id, "alerts"
        ).document(alert.timestamp)

        # Run the blocking Firestore set in a thread
        await asyncio.to_thread(doc_ref.set, alert.model_dump())
        logger.info(f"Saved CRITICAL ALERT: {alert.event_type}")
    except Exception as e:
        logger.error(f"Error saving alert: {e}")


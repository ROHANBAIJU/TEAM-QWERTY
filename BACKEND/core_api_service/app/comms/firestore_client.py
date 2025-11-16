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
import firebase_admin
from firebase_admin import credentials

# --- Firebase Config ---
if "GOOGLE_APPLICATION_CREDENTIALS" not in os.environ:
    try:
        firebase_config = json.loads(settings.FIREBASE_CONFIG)
        logging.info("Attempting to use Application Default Credentials for Firestore.")
    except Exception:
        logging.warning("Could not parse __firebase_config. Using default credentials.")

logger = logging.getLogger(__name__)

# Module-level Firestore client (initialized on app startup)
_db: firestore.Client | None = None

def initialize_firestore():
    """Initializes firebase_admin (if not already) and creates a Firestore client.

    This should be called once at application startup to centralize credentials and
    ensure firebase_admin is ready for auth operations used elsewhere.
    """
    global _db
    
    # FORCE DEMO MODE - Firestore completely disabled
    logger.warning("="*70)
    logger.warning("🎮 DEMO MODE ENABLED - Firestore completely disabled")
    logger.warning("="*70)
    logger.info("✅ AI Analysis will work perfectly without database")
    logger.info("💡 To enable Firestore: Download fresh key from Firebase Console")
    logger.info("   https://console.firebase.google.com/project/stance-sense-qwerty/settings/serviceaccounts/adminsdk")
    logger.warning("="*70)
    
    # Uninitialize firebase_admin if it was already initialized with bad credentials
    try:
        import firebase_admin
        if firebase_admin._apps:
            logger.info("🧹 Cleaning up existing firebase_admin initialization...")
            for app_name in list(firebase_admin._apps.keys()):
                firebase_admin.delete_app(firebase_admin._apps[app_name])
            logger.info("✅ Firebase admin uninitialized successfully")
    except Exception as e:
        logger.warning(f"⚠️ Could not uninitialize firebase_admin: {e}")
    
    _db = None
    return
    
    # The code below is disabled for demo mode
    try:
        # Initialize firebase_admin if not already
        if not firebase_admin._apps:
            # Use absolute path to the new service account key
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            cred_path = os.path.join(base_dir, "stance-sense-qwerty-firebase-adminsdk-fbsvc-ec07a3108e.json")
            
            logger.info(f"🔑 Looking for Firebase credentials at: {cred_path}")
            
            if not os.path.exists(cred_path):
                logger.error(f"❌ Firebase credentials file not found at: {cred_path}")
                logger.warning("🎮 Running in DEMO MODE without Firestore - skipping database writes")
                _db = None
                return
            
            # Validate the JSON structure before using it
            try:
                with open(cred_path, 'r') as f:
                    import json
                    key_data = json.load(f)
                    if not key_data.get('private_key') or not key_data.get('client_email'):
                        raise ValueError("Invalid service account key structure")
                logger.info(f"✅ Service account key validated: {key_data.get('client_email')}")
            except Exception as key_error:
                logger.error(f"❌ Invalid service account key file: {key_error}")
                logger.warning("🎮 Running in DEMO MODE without Firestore - key validation failed")
                _db = None
                return
            
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            logger.info("✅ Initialized firebase_admin with certificate.")

        # Create Firestore client
        _db = firestore.Client()
        logger.info("✅ Firestore DB client initialized successfully (startup).")
    except Exception as e:
        logger.error(f"❌ Failed to initialize Firestore during startup: {e}")
        logger.error(f"💡 Error type: {type(e).__name__}")
        if "Invalid JWT Signature" in str(e):
            logger.error("🔴 INVALID SERVICE ACCOUNT KEY - The private key has been revoked or regenerated")
            logger.error("💡 Solution: Download a fresh key from Firebase Console:")
            logger.error("   https://console.firebase.google.com/project/stance-sense-qwerty/settings/serviceaccounts/adminsdk")
        logger.warning("🎮 Running in DEMO MODE without Firestore - AI analysis will still work!")
        _db = None

def get_firestore_db():
    """Return the initialized Firestore client, or attempt to create one.

    Prefer calling `initialize_firestore()` at startup so this returns a ready client.
    """
    global _db
    # DEMO MODE - Always return None, never create Firestore client
    if _db is None:
        logger.warning("🎮 DEMO MODE - Firestore disabled, returning None")
    return None

async def save_sensor_data(db: firestore.Client, app_id: str, user_id: str, data: DeviceData):
    """
    Saves a raw sensor data packet to Firestore.
    """
    if not db:
        logger.warning("🎮 DEMO MODE - Skipping Firestore save_sensor_data")
        return

    try:
        # Path: /artifacts/{appId}/users/{userId}/sensor_data/{timestamp}
        doc_ref = db.collection(
            "artifacts", app_id, "users", user_id, "sensor_data"
        ).document(data.timestamp)

        # Run the blocking Firestore set in a thread to avoid blocking the event loop
        await asyncio.to_thread(doc_ref.set, data.model_dump())
        logger.info(f"💾 Saved sensor data to Firestore: {data.timestamp}")
    except Exception as e:
        error_msg = str(e)
        if "Invalid JWT Signature" in error_msg or "invalid_grant" in error_msg:
            logger.error(f"🔴 FIRESTORE WRITE FAILED - Invalid service account key")
            logger.error(f"💡 Download fresh key from: https://console.firebase.google.com/project/stance-sense-qwerty/settings/serviceaccounts/adminsdk")
            logger.warning(f"🎮 Continuing in DEMO MODE - AI analysis still works!")
            # Disable future Firestore operations
            global _db
            _db = None
        else:
            logger.error(f"❌ Error saving sensor data: {e}")

async def save_alert(db: firestore.Client, app_id: str, user_id: str, alert: Alert):
    """
    Saves a critical alert to its own collection in Firestore.
    """
    if not db:
        logger.warning("🎮 DEMO MODE - Skipping Firestore save_alert")
        return
        
    try:
        # Path: /artifacts/{appId}/users/{userId}/alerts/{timestamp}
        doc_ref = db.collection(
            "artifacts", app_id, "users", user_id, "alerts"
        ).document(alert.timestamp)

        # Run the blocking Firestore set in a thread
        await asyncio.to_thread(doc_ref.set, alert.model_dump())
        logger.info(f"🚨 Saved CRITICAL ALERT to Firestore: {alert.event_type}")
    except Exception as e:
        error_msg = str(e)
        if "Invalid JWT Signature" in error_msg or "invalid_grant" in error_msg:
            logger.error(f"🔴 FIRESTORE WRITE FAILED - Invalid service account key")
            logger.error(f"💡 Download fresh key from: https://console.firebase.google.com/project/stance-sense-qwerty/settings/serviceaccounts/adminsdk")
            logger.warning(f"🎮 Continuing in DEMO MODE - AI analysis still works!")
            # Disable future Firestore operations
            global _db
            _db = None
        else:
            logger.error(f"❌ Error saving alert: {e}")


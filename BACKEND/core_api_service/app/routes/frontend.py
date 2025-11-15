"""Frontend-facing analytics endpoints for historical data retrieval."""

from fastapi import APIRouter, HTTPException, Header, Query, Body
from typing import Optional, List, Dict
import logging
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import auth as fb_auth
from ..comms.firestore_client import get_firestore_db
from ..config import settings
from ..models.schemas import MedicationLog, PatientNote

logger = logging.getLogger(__name__)
router = APIRouter()


def _verify_token(authorization: Optional[str]) -> str:
    """Verify Firebase ID token and return user ID."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    
    try:
        if authorization.lower().startswith("bearer "):
            id_token = authorization.split(" ", 1)[1]
        else:
            id_token = authorization
        
        # Allow simulator bypass
        if id_token in ["simulator_test_token", "simulator_mode_bypass"]:
            return "simulator_user_test_123"
        
        decoded = fb_auth.verify_id_token(id_token)
        uid = decoded.get("uid")
        if not uid:
            raise HTTPException(status_code=401, detail="Invalid token: no uid")
        return uid
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


@router.get("/analytics/trends")
async def get_symptom_trends(
    hours: int = Query(default=24, ge=1, le=168),
    authorization: Optional[str] = Header(default=None)
):
    """
    Get symptom trends over the specified time period (default 24 hours).
    Returns time-series data of AI scores for charting.
    """
    uid = _verify_token(authorization)
    db = get_firestore_db()
    if not db:
        raise HTTPException(status_code=500, detail="Firestore not initialized")
    
    try:
        # Calculate time range
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)
        
        # Query processed_data collection
        coll = (
            db.collection("artifacts")
            .document(settings.APP_ID)
            .collection("users")
            .document(uid)
            .collection("processed_data")
        )
        
        # Firestore timestamp filtering
        docs = coll.where("timestamp", ">=", start_time.isoformat()).where("timestamp", "<=", end_time.isoformat()).order_by("timestamp").stream()
        
        data_points = []
        for doc in docs:
            doc_data = doc.to_dict()
            if doc_data and "scores" in doc_data:
                data_points.append({
                    "timestamp": doc_data.get("timestamp"),
                    "scores": doc_data.get("scores"),
                    "analysis": doc_data.get("analysis"),
                    "critical_event": doc_data.get("critical_event")
                })
        
        logger.info(f"GET /analytics/trends returned {len(data_points)} points for user {uid}")
        return {
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "hours": hours,
            "data_points": data_points
        }
    except Exception as e:
        logger.error(f"Error fetching trends: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/history")
async def get_processed_history(
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    authorization: Optional[str] = Header(default=None)
):
    """
    Get paginated processed sensor data history.
    Returns most recent entries first.
    """
    uid = _verify_token(authorization)
    db = get_firestore_db()
    if not db:
        raise HTTPException(status_code=500, detail="Firestore not initialized")
    
    try:
        coll = (
            db.collection("artifacts")
            .document(settings.APP_ID)
            .collection("users")
            .document(uid)
            .collection("processed_data")
        )
        
        # Get total count (expensive, but useful for pagination)
        docs = coll.order_by("timestamp", direction="DESCENDING").limit(limit).offset(offset).stream()
        
        items = []
        for doc in docs:
            doc_data = doc.to_dict()
            if doc_data:
                items.append({
                    "id": doc.id,
                    **doc_data
                })
        
        logger.info(f"GET /analytics/history returned {len(items)} items for user {uid}")
        return {
            "items": items,
            "limit": limit,
            "offset": offset,
            "count": len(items)
        }
    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/summary")
async def get_analytics_summary(
    days: int = Query(default=7, ge=1, le=90),
    authorization: Optional[str] = Header(default=None)
):
    """
    Get summary statistics for the specified time period.
    Includes averages, peaks, fall count, critical events.
    """
    uid = _verify_token(authorization)
    db = get_firestore_db()
    if not db:
        raise HTTPException(status_code=500, detail="Firestore not initialized")
    
    try:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=days)
        
        coll = (
            db.collection("artifacts")
            .document(settings.APP_ID)
            .collection("users")
            .document(uid)
            .collection("processed_data")
        )
        
        docs = coll.where("timestamp", ">=", start_time.isoformat()).where("timestamp", "<=", end_time.isoformat()).stream()
        
        # Aggregate statistics
        tremor_scores = []
        rigidity_scores = []
        gait_scores = []
        slowness_scores = []
        fall_count = 0
        critical_events = []
        
        for doc in docs:
            doc_data = doc.to_dict()
            if doc_data:
                scores = doc_data.get("scores", {})
                tremor_scores.append(scores.get("tremor", 0))
                rigidity_scores.append(scores.get("rigidity", 0))
                gait_scores.append(scores.get("gait", 0))
                slowness_scores.append(scores.get("slowness", 0))
                
                if doc_data.get("safety", {}).get("fall_detected"):
                    fall_count += 1
                
                if doc_data.get("critical_event"):
                    critical_events.append({
                        "timestamp": doc_data.get("timestamp"),
                        "event": doc_data.get("critical_event")
                    })
        
        def safe_avg(lst):
            return sum(lst) / len(lst) if lst else 0
        
        summary = {
            "period_days": days,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "data_points_count": len(tremor_scores),
            "averages": {
                "tremor": round(safe_avg(tremor_scores), 3),
                "rigidity": round(safe_avg(rigidity_scores), 3),
                "gait": round(safe_avg(gait_scores), 3),
                "slowness": round(safe_avg(slowness_scores), 3)
            },
            "peaks": {
                "tremor": round(max(tremor_scores) if tremor_scores else 0, 3),
                "rigidity": round(max(rigidity_scores) if rigidity_scores else 0, 3),
                "gait": round(max(gait_scores) if gait_scores else 0, 3),
                "slowness": round(max(slowness_scores) if slowness_scores else 0, 3)
            },
            "fall_count": fall_count,
            "critical_events_count": len(critical_events),
            "recent_critical_events": critical_events[-5:]  # Last 5 events
        }
        
        logger.info(f"GET /analytics/summary returned stats for user {uid}")
        return summary
    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/hardware/status")
async def get_hardware_status(authorization: Optional[str] = Header(default=None)):
    """
    Get hardware device status including battery, signal strength, firmware version.
    Returns mock data for simulator mode, real device data when connected.
    """
    uid = _verify_token(authorization)
    
    # For simulator mode, return mock hardware status
    if uid == "simulator_user_test_123":
        return {
            "devices": [
                {
                    "device_id": "wrist_unit_001",
                    "name": "Wrist Unit",
                    "battery_percent": 82.0,
                    "signal_strength_dbm": -58,
                    "connection_quality": "strong",
                    "firmware_version": "v1.9.4",
                    "last_ping": datetime.utcnow().isoformat(),
                    "packet_loss_percent": 0.3,
                    "latency_ms": 42,
                    "uptime_seconds": 94680,
                    "status": "operational",
                    "location": "Left wrist"
                },
                {
                    "device_id": "arm_patch_002",
                    "name": "Arm Patch",
                    "battery_percent": 15.0,
                    "signal_strength_dbm": -67,
                    "connection_quality": "moderate",
                    "firmware_version": "v1.4.1",
                    "last_ping": datetime.utcnow().isoformat(),
                    "packet_loss_percent": 1.2,
                    "latency_ms": 67,
                    "uptime_seconds": 94680,
                    "status": "warning",
                    "location": "Right forearm"
                }
            ],
            "gateway": {
                "connection_type": "Ethernet",
                "packet_loss_percent": 0.3,
                "latency_median_ms": 37,
                "jitter_ms": 4,
                "uptime_seconds": 94680,
                "last_reboot": (datetime.utcnow() - timedelta(hours=26, minutes=18)).isoformat()
            }
        }
    
    # For real users, query device status from Firestore
    # TODO: Implement real device status retrieval
    return {
        "devices": [],
        "message": "No devices connected"
    }


@router.post("/medications/log")
async def log_medication(
    medication: MedicationLog,
    authorization: Optional[str] = Header(default=None)
):
    """
    Log medication intake with timestamp, name, dosage, and optional notes.
    """
    uid = _verify_token(authorization)
    db = get_firestore_db()
    if not db:
        raise HTTPException(status_code=500, detail="Firestore not initialized")
    
    try:
        # Save to medications collection
        coll = (
            db.collection("artifacts")
            .document(settings.APP_ID)
            .collection("users")
            .document(uid)
            .collection("medications")
        )
        
        doc_ref = coll.add(medication.model_dump())
        
        logger.info(f"POST /medications/log saved medication for user {uid}")
        return {
            "success": True,
            "message": "Medication logged successfully",
            "id": doc_ref[1].id,
            "medication": medication.model_dump()
        }
    except Exception as e:
        logger.error(f"Error logging medication: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/medications/history")
async def get_medication_history(
    limit: int = Query(default=50, ge=1, le=500),
    days: int = Query(default=30, ge=1, le=365),
    authorization: Optional[str] = Header(default=None)
):
    """
    Retrieve medication log history for the specified time period.
    Returns most recent entries first.
    """
    uid = _verify_token(authorization)
    db = get_firestore_db()
    if not db:
        raise HTTPException(status_code=500, detail="Firestore not initialized")
    
    try:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=days)
        
        coll = (
            db.collection("artifacts")
            .document(settings.APP_ID)
            .collection("users")
            .document(uid)
            .collection("medications")
        )
        
        docs = coll.where(
            "timestamp", ">=", start_time.isoformat()
        ).order_by(
            "timestamp", direction="DESCENDING"
        ).limit(limit).stream()
        
        medications = []
        for doc in docs:
            doc_data = doc.to_dict()
            if doc_data:
                medications.append({
                    "id": doc.id,
                    **doc_data
                })
        
        logger.info(f"GET /medications/history returned {len(medications)} items for user {uid}")
        return {
            "medications": medications,
            "count": len(medications),
            "limit": limit,
            "days": days
        }
    except Exception as e:
        logger.error(f"Error fetching medication history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notes/submit")
async def submit_patient_note(
    note: PatientNote,
    authorization: Optional[str] = Header(default=None)
):
    """
    Submit a patient symptom note or observation.
    """
    uid = _verify_token(authorization)
    db = get_firestore_db()
    if not db:
        raise HTTPException(status_code=500, detail="Firestore not initialized")
    
    try:
        # Save to patient_notes collection
        coll = (
            db.collection("artifacts")
            .document(settings.APP_ID)
            .collection("users")
            .document(uid)
            .collection("patient_notes")
        )
        
        doc_ref = coll.add(note.model_dump())
        
        logger.info(f"POST /notes/submit saved note for user {uid}")
        return {
            "success": True,
            "message": "Note submitted successfully",
            "id": doc_ref[1].id,
            "note": note.model_dump()
        }
    except Exception as e:
        logger.error(f"Error submitting note: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/notes/history")
async def get_notes_history(
    limit: int = Query(default=100, ge=1, le=1000),
    days: int = Query(default=30, ge=1, le=365),
    category: Optional[str] = Query(default=None),
    authorization: Optional[str] = Header(default=None)
):
    """
    Retrieve patient notes history for the specified time period.
    Optionally filter by category (symptom, observation, general).
    """
    uid = _verify_token(authorization)
    db = get_firestore_db()
    if not db:
        raise HTTPException(status_code=500, detail="Firestore not initialized")
    
    try:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=days)
        
        coll = (
            db.collection("artifacts")
            .document(settings.APP_ID)
            .collection("users")
            .document(uid)
            .collection("patient_notes")
        )
        
        query = coll.where("timestamp", ">=", start_time.isoformat())
        
        # Apply category filter if specified
        if category:
            query = query.where("category", "==", category)
        
        docs = query.order_by("timestamp", direction="DESCENDING").limit(limit).stream()
        
        notes = []
        for doc in docs:
            doc_data = doc.to_dict()
            if doc_data:
                notes.append({
                    "id": doc.id,
                    **doc_data
                })
        
        logger.info(f"GET /notes/history returned {len(notes)} items for user {uid}")
        return {
            "notes": notes,
            "count": len(notes),
            "limit": limit,
            "days": days,
            "category": category
        }
    except Exception as e:
        logger.error(f"Error fetching notes history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

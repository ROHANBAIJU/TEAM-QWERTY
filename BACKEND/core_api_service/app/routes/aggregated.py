# File: BACKEND/core_api_service/app/routes/aggregated.py
#
# New endpoint for receiving aggregated sensor data from Node.js

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import logging

from ..comms.firestore_client import get_firestore_db
from ..dependencies import get_current_user
import asyncio

router = APIRouter(prefix="/ingest", tags=["aggregated-data"])
logger = logging.getLogger(__name__)


class AggregatedDataRequest(BaseModel):
    """Schema for aggregated sensor data"""
    user_id: str
    app_id: str
    data: Dict[str, Any]


@router.post("/aggregated")
async def receive_aggregated_data(
    request: AggregatedDataRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Receives aggregated sensor data from Node.js aggregation service.
    This endpoint is called every 10 minutes with summarized statistics.
    
    Expected data format:
    {
        "user_id": "test_patient_001",
        "app_id": "stancesense",
        "data": {
            "timestamp": "2025-11-16T10:00:00Z",
            "period_start": "2025-11-16T09:50:00Z",
            "period_end": "2025-11-16T10:00:00Z",
            "data_points_count": 200,
            "tremor": { "avg": 45.2, "min": 40, "max": 52, ... },
            "rigidity": { "avg": 36.5, "min": 30, "max": 45, ... },
            "gait": { "avg": 55.8, "min": 50, "max": 65, ... },
            "safety": { "fall_detected_count": 0, ... },
            "alerts": [ ... ]
        }
    }
    """
    try:
        db = get_firestore_db()
        if not db:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Firestore not initialized"
            )

        # Store aggregated data
        await save_aggregated_data(
            db=db,
            app_id=request.app_id,
            user_id=request.user_id,
            data=request.data
        )

        # Check for critical alerts and save them separately
        if request.data.get("alerts"):
            await save_alerts_from_aggregation(
                db=db,
                app_id=request.app_id,
                user_id=request.user_id,
                alerts=request.data["alerts"]
            )

        logger.info(f"Saved aggregated data for {request.user_id}: {request.data['data_points_count']} points")

        return {
            "status": "success",
            "message": "Aggregated data saved successfully",
            "user_id": request.user_id,
            "data_points_aggregated": request.data.get("data_points_count", 0),
            "timestamp": request.data.get("timestamp")
        }

    except Exception as e:
        logger.error(f"Error saving aggregated data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save aggregated data: {str(e)}"
        )


async def save_aggregated_data(db, app_id: str, user_id: str, data: Dict[str, Any]):
    """
    Save aggregated data to Firestore.
    Path: /artifacts/{appId}/users/{userId}/aggregated_data/{timestamp}
    """
    try:
        timestamp = data.get("timestamp", "unknown")
        doc_ref = db.collection(
            "artifacts", app_id, "users", user_id, "aggregated_data"
        ).document(timestamp)

        await asyncio.to_thread(doc_ref.set, data)
        logger.info(f"Saved aggregated data document: {timestamp}")
    except Exception as e:
        logger.error(f"Error saving aggregated data: {e}")
        raise


async def save_alerts_from_aggregation(db, app_id: str, user_id: str, alerts: List[Dict[str, Any]]):
    """
    Save critical alerts from aggregated data.
    Path: /artifacts/{appId}/users/{userId}/alerts/{timestamp}
    """
    try:
        for alert in alerts:
            if alert.get("severity") == "critical":
                timestamp = alert.get("timestamp", "unknown")
                doc_ref = db.collection(
                    "artifacts", app_id, "users", user_id, "alerts"
                ).document(timestamp)

                alert_data = {
                    "event_type": alert.get("type", "unknown"),
                    "timestamp": timestamp,
                    "severity": alert["severity"],
                    "value": alert.get("value"),
                    "message": f"Critical alert: {alert.get('type')}",
                    "source": "aggregation_service"
                }

                await asyncio.to_thread(doc_ref.set, alert_data)
                logger.info(f"Saved critical alert: {alert.get('type')}")
    except Exception as e:
        logger.error(f"Error saving alerts: {e}")
        raise


@router.get("/stats/{user_id}")
async def get_aggregation_stats(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get statistics about aggregated data for a user.
    Useful for monitoring and debugging.
    """
    try:
        db = get_firestore_db()
        if not db:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Firestore not initialized"
            )

        # Get count of aggregated data documents
        app_id = "stancesense"
        aggregated_ref = db.collection(
            "artifacts", app_id, "users", user_id, "aggregated_data"
        )

        # Get recent documents (last 24 hours)
        docs = await asyncio.to_thread(
            lambda: list(aggregated_ref.order_by("timestamp", direction="DESCENDING").limit(288).stream())
        )

        total_data_points = sum(doc.to_dict().get("data_points_count", 0) for doc in docs)

        return {
            "user_id": user_id,
            "aggregated_documents_count": len(docs),
            "total_data_points_stored": total_data_points,
            "storage_efficiency": f"{(len(docs) / total_data_points * 100):.2f}%" if total_data_points > 0 else "N/A",
            "latest_timestamp": docs[0].to_dict().get("timestamp") if docs else None
        }

    except Exception as e:
        logger.error(f"Error getting aggregation stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get stats: {str(e)}"
        )

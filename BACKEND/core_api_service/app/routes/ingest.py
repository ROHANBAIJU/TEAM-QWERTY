"""Internal endpoint used by Node ingestion service.

Implements POST /ingest/data which validates a device packet, normalizes fields,
saves the raw packet to Firestore, prints an entry log, and enqueues background
processing via FastAPI BackgroundTasks.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Header
from pydantic import BaseModel, Field
from typing import Optional
import uuid
import datetime
import asyncio

from ..comms.firestore_client import get_firestore_db, save_sensor_data, save_alert
import firebase_admin
from firebase_admin import auth as fb_auth
from ..services.ai_processor import process_data_with_ai
from ..services.rag_agent import generate_contextual_alert
from ..comms.manager import frontend_manager
from ..models.schemas import ProcessedData, Alert as AlertModel, DeviceData
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Use shared manager imported from app.comms.manager
# frontend_manager is the shared singleton instance


def _normalize_packet(raw: dict) -> dict:
	"""Normalize incoming raw payload into canonical DeviceData dict.

	This converts 'yes'/'no' strings to booleans and ensures timestamps are
	ISO 8601 where possible. We do minimal mutation; server still accepts
	different formats but normalizes common ones.
	"""
	packet = dict(raw)

	# Normalize string booleans (for backwards compatibility with old hardware)
	def _str_to_bool(v):
		if isinstance(v, str):
			return v.strip().lower() in ("yes", "true", "1")
		return v

	# tremor - handle both old format (strings) and new format (booleans)
	if "tremor" in packet:
		if "tremor_detected" in packet["tremor"]:
			packet["tremor"]["tremor_detected"] = _str_to_bool(packet["tremor"]["tremor_detected"])

	# rigidity
	if "rigidity" in packet:
		if "rigid" in packet["rigidity"]:
			packet["rigidity"]["rigid"] = _str_to_bool(packet["rigidity"]["rigid"])
	
	# safety
	if "safety" in packet:
		if "fall_detected" in packet["safety"]:
			packet["safety"]["fall_detected"] = _str_to_bool(packet["safety"]["fall_detected"])

	# timestamp: if short like 19:37, convert to today's ISO
	ts = packet.get("timestamp")
	try:
		if ts and len(ts) == 5 and ts.count(":") == 1:
			today = datetime.datetime.utcnow().date()
			hh, mm = ts.split(":")
			packet["timestamp"] = datetime.datetime(today.year, today.month, today.day, int(hh), int(mm)).isoformat() + "Z"
	except Exception:
		pass

	return packet


@router.post("/data", status_code=202)
async def ingest_data(body: dict, background_tasks: BackgroundTasks, authorization: str | None = Header(default=None)):
	logger.info("ENTER POST /ingest/data called")

	# Authenticate request via Firebase ID token in Authorization header
	uid = None
	if not authorization:
		raise HTTPException(status_code=401, detail="Missing Authorization header")
	try:
		# Expect header like: Bearer <id_token>
		if authorization.lower().startswith("bearer "):
			id_token = authorization.split(" ", 1)[1]
		else:
			id_token = authorization
		
		# SIMULATOR MODE BYPASS: For testing without real Firebase users
		if id_token == "simulator_test_token" or id_token == "simulator_mode_bypass":
			uid = "simulator_user_test_123"  # Test user ID
			logger.warning("🎮 SIMULATOR MODE: Using test user ID: %s", uid)
		else:
			# Normal Firebase authentication
			decoded = fb_auth.verify_id_token(id_token)
			uid = decoded.get("uid")
			logger.info("Authenticated ingest request for uid: %s", uid)
	except Exception as e:
		raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

	# Normalize
	packet = _normalize_packet(body)

	# Validate using pydantic
	try:
		data = DeviceData(**packet)
	except Exception as e:
		raise HTTPException(status_code=400, detail=f"Invalid payload: {e}")

	# Save raw packet to Firestore
	db = get_firestore_db()
	doc_id = str(uuid.uuid4())
	saved = False
	if db and uid:
		try:
			# Path: artifacts/stancesense/users/{uid}/sensor_data/{doc_id}
			doc_ref = db.collection("artifacts").document("stancesense").collection("users").document(uid).collection("sensor_data").document(doc_id)
			doc_ref.set(data.model_dump())
			saved = True
			logger.info("Saved raw packet to Firestore for user %s with id %s", uid, doc_id)
		except Exception as e:
			logger.error("Error saving to Firestore: %s", e)
	else:
		logger.warning("Firestore not available or uid missing; skipping save")

	# Enqueue AI processing in background (async-safe)
	async def _process_and_save_async():
		try:
			# Run AI processing (async). process_data_with_ai is async, so await it directly.
			processed: ProcessedData = await process_data_with_ai(data)
			logger.info("AI processing complete for %s", doc_id)

			# Persist processed data to Firestore via helper
			db = get_firestore_db()
			if db and uid:
				try:
					await save_sensor_data(db, "stancesense", uid, processed)
					# Also write to processed_data collection for historical records
					proc_ref = db.collection("artifacts").document("stancesense").collection("users").document(uid).collection("processed_data").document(doc_id)
					await asyncio.to_thread(proc_ref.set, processed.model_dump())
					logger.info("Saved processed data for %s", doc_id)
				except Exception as e:
					logger.error("Error saving processed data: %s", e)

			# Determine critical events
			critical_event = None
			if processed.safety.fall_detected:
				critical_event = "fall"
			elif processed.analysis.is_rigid:
				critical_event = "rigidity_spike"

			if critical_event:
				try:
					# Check user consent for external AI before calling RAG
					consent_flag = False
					try:
						consent_doc = db.collection("users").document(uid).collection("preferences").document("consent").get()
						if consent_doc and consent_doc.exists:
							consent_flag = consent_doc.to_dict().get("consent", False)
					except Exception:
						# If we cannot determine consent, default to False (do not call external LLM)
						consent_flag = False

					# Generate alert via RAG (async) — pass consent flag
					alert_text = await generate_contextual_alert(processed, critical_event, consent=consent_flag)
					alert_doc = AlertModel(
						timestamp=processed.timestamp,
						event_type=critical_event,
						message=alert_text,
						data_snapshot=processed.model_dump()
					)

					# Save alert using helper
					if db and uid:
						try:
							await save_alert(db, "stancesense", uid, alert_doc)
							logger.info("Saved alert for %s event %s", doc_id, critical_event)
						except Exception as e:
							logger.error("Error saving alert: %s", e)

					# Broadcast alert to frontend with type wrapper
					try:
						message = {
							"type": "alert",
							"data": alert_doc.model_dump()
						}
						import json
						await frontend_manager.broadcast(json.dumps(message))
					except Exception as e:
						logger.error("Error broadcasting alert: %s", e)
				except Exception as e:
					logger.error("Error generating contextual alert: %s", e)
			else:
				# Non-critical: broadcast processed data with type wrapper
				try:
					message = {
						"type": "processed_data",
						"data": processed.model_dump()
					}
					import json
					await frontend_manager.broadcast(json.dumps(message))
				except Exception as e:
					logger.error("Error broadcasting processed data: %s", e)
		except Exception as e:
			logger.exception("Error in background AI processing: %s", e)

	# Schedule the async task without blocking the request
	asyncio.create_task(_process_and_save_async())

	return {"status": "accepted", "id": doc_id, "saved": saved, "user": uid}


@router.get("/raw")
async def get_raw_sensor_data(limit: int = 10, authorization: str | None = Header(default=None)):
	"""Return the most recent raw sensor data documents for the authenticated user."""
	if not authorization:
		raise HTTPException(status_code=401, detail="Missing Authorization header")
	try:
		if authorization.lower().startswith("bearer "):
			id_token = authorization.split(" ", 1)[1]
		else:
			id_token = authorization
		decoded = fb_auth.verify_id_token(id_token)
		uid = decoded.get("uid")
	except Exception as e:
		raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

	db = get_firestore_db()
	if not db:
		raise HTTPException(status_code=500, detail="Firestore not initialized")

	try:
		coll = db.collection("artifacts").document("stancesense").collection("users").document(uid).collection("sensor_data")
		docs = coll.order_by("timestamp", direction="DESCENDING").limit(limit).stream()
		items = [d.to_dict() for d in docs]
		logger.info("GET /ingest/raw returned %d items for user %s", len(items), uid)
		return {"items": items}
	except Exception as e:
		raise HTTPException(status_code=500, detail=str(e))


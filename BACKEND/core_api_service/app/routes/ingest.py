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
	print("\n" + "="*70)
	print("🔬 [FastAPI] DATA INGESTION STARTED")
	print("="*70)

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
			print(f"🎮 [FastAPI] DEMO MODE - User: {uid}")
		else:
			# Normal Firebase authentication
			decoded = fb_auth.verify_id_token(id_token)
			uid = decoded.get("uid")
			print(f"🔐 [FastAPI] Authenticated user: {uid}")
	except Exception as e:
		raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

	# Normalize
	packet = _normalize_packet(body)

	# Validate using pydantic
	try:
		data = DeviceData(**packet)
		print("✅ [FastAPI] Packet validated successfully")
		print(f"📊 [FastAPI] Data: Tremor={data.tremor.amplitude_g}g, Rigidity={data.rigidity.emg_wrist}, Fall={data.safety.fall_detected}")
	except Exception as e:
		print(f"❌ [FastAPI] VALIDATION ERROR: {str(e)}")
		print(f"📦 [FastAPI] Received packet: {packet}")
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
			print(f"💾 [FastAPI] Saved to Firestore: {doc_id}")
		except Exception as e:
			print(f"❌ [FastAPI] Firestore error: {e}")
	else:
		if not db:
			print("⚠️  [FastAPI] Firestore not initialized - data processed in-memory only")
		saved = False

	# Enqueue AI processing in background (async-safe)
	async def _process_and_save_async():
		try:
			print("\n🤖 [AI] Starting AI processing...")
			# Run AI processing (async). process_data_with_ai is async, so await it directly.
			processed: ProcessedData = await process_data_with_ai(data)
			print("="*70)
			print("🧠 [AI] ANALYSIS COMPLETE")
			print("="*70)
			
			# Access scores safely
			scores = processed.scores if hasattr(processed, 'scores') else processed.get('scores', {})
			analysis = processed.analysis if hasattr(processed, 'analysis') else processed.get('analysis', {})
			
			print(f"🫨 Tremor Score: {scores.get('tremor', 0):.3f}")
			print(f"🔒 Rigidity Score: {scores.get('rigidity', 0):.3f}")
			print(f"🚶 Gait Score: {scores.get('gait', 0):.3f}")
			print(f"🐌 Slowness Score: {scores.get('slowness', 0):.3f}")
			
			if hasattr(analysis, 'is_tremor_confirmed'):
				print(f"✅ Tremor Confirmed: {analysis.is_tremor_confirmed}")
				print(f"✅ Rigid Detected: {analysis.is_rigid}")
				print(f"⚖️  Gait Stability: {analysis.gait_stability_score:.2f}")
			else:
				print(f"✅ Tremor Confirmed: {analysis.get('is_tremor_confirmed', False)}")
				print(f"✅ Rigid Detected: {analysis.get('is_rigid', False)}")
				print(f"⚖️  Gait Stability: {analysis.get('gait_stability_score', 0):.2f}")
			print("="*70)

			# Persist processed data to Firestore via helper
			db = get_firestore_db()
			if db and uid:
				try:
					await save_sensor_data(db, "stancesense", uid, processed)
					# Also write to processed_data collection for historical records
					proc_ref = db.collection("artifacts").document("stancesense").collection("users").document(uid).collection("processed_data").document(doc_id)
					await asyncio.to_thread(proc_ref.set, processed.model_dump())
					print(f"💾 [AI] Saved processed data: {doc_id}")
				except Exception as e:
					error_msg = str(e)
					if "Invalid JWT Signature" in error_msg or "invalid_grant" in error_msg:
						print(f"🔴 [AI] FIRESTORE WRITE FAILED - Invalid service account key")
						print(f"💡 Download fresh key from Firebase Console")
						print(f"🎮 Continuing in DEMO MODE without database writes")
					else:
						print(f"❌ [AI] Error saving processed data: {e}")

			# Determine critical events
			critical_event = None
			if processed.safety.fall_detected:
				critical_event = "fall"
				print("🚨 [AI] CRITICAL: FALL DETECTED!")
			elif processed.analysis.is_rigid:
				critical_event = "rigidity_spike"
				print("⚠️  [AI] WARNING: High rigidity detected")
			elif processed.analysis.is_tremor_confirmed:
				print("⚠️  [AI] WARNING: Tremor confirmed")

			# ALWAYS broadcast processed data first (so frontend gets scores)
			try:
				message = {
					"type": "processed_data",
					"data": processed.model_dump()
				}
				import json
				await frontend_manager.broadcast(json.dumps(message))
				print("📡 [AI] Processed data broadcasted to frontend")
			except Exception as e:
				print(f"❌ [AI] Error broadcasting processed data: {e}")

			# ADDITIONALLY send alert if critical event detected
			if critical_event:
				try:
					print(f"🎯 [RAG] Generating contextual alert for: {critical_event}")
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
					print("="*70)
					print("🎯 [RAG] ALERT GENERATED")
					print("="*70)
					print(f"📝 Message: {alert_text}")
					print("="*70)
					
					# Map event types to frontend-compatible formats
					event_type_map = {
						"fall": "fall",
						"rigidity_spike": "rigidity",
						"tremor_confirmed": "tremor"
					}
					
					# Determine severity
					severity = "critical" if critical_event == "fall" else "warning"
					
					alert_doc = AlertModel(
						id=f"{processed.timestamp}_{critical_event}",
						timestamp=processed.timestamp,
						event_type=critical_event,
						severity=severity,
						type=event_type_map.get(critical_event, critical_event),
						message=alert_text,
						data_snapshot=processed.model_dump()
					)

					# Save alert using helper
					if db and uid:
						try:
							await save_alert(db, "stancesense", uid, alert_doc)
							print(f"💾 [RAG] Alert saved to Firestore")
						except Exception as e:
							print(f"❌ [RAG] Error saving alert: {e}")

					# Broadcast alert to frontend with type wrapper
					try:
						message = {
							"type": "alert",
							"data": alert_doc.model_dump()
						}
						import json
						await frontend_manager.broadcast(json.dumps(message))
						print("📡 [RAG] Alert broadcasted to frontend\n")
					except Exception as e:
						print(f"❌ [RAG] Error broadcasting alert: {e}")
				except Exception as e:
					print(f"❌ [RAG] Error generating contextual alert: {e}")
		except Exception as e:
			print(f"❌ [AI] Error in background AI processing: {e}\n")
			logger.exception("Error in background AI processing: %s", e)

	# Schedule the async task without blocking the request
	asyncio.create_task(_process_and_save_async())

	print(f"✅ [FastAPI] Packet accepted for processing: {doc_id}\n")
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


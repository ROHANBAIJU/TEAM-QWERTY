from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from ..comms.firestore_client import get_firestore_db
import firebase_admin
from firebase_admin import auth as fb_auth

router = APIRouter()


class ConsentRequest(BaseModel):
    consent: bool


@router.post("/consent")
def set_consent(body: ConsentRequest, authorization: str | None = None):
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
        # Store consent under users/{uid}/consent doc
        doc_ref = db.collection("users").document(uid).collection("preferences").document("consent")
        doc_ref.set({"consent": bool(body.consent)})
        return {"uid": uid, "consent": body.consent}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/consent")
def get_consent(authorization: str | None = None):
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
        doc = db.collection("users").document(uid).collection("preferences").document("consent").get()
        if doc.exists:
            return {"uid": uid, "consent": doc.to_dict().get("consent", False)}
        return {"uid": uid, "consent": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

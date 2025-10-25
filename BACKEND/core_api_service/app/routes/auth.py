from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
import os
import datetime

from ..comms.firestore_client import get_firestore_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: Optional[str] = None


class LoginRequest(BaseModel):
    id_token: str


@router.post("/signup")
def signup(body: SignupRequest):
    logger.info("ENTER POST /auth/signup called for %s", body.email)

    try:
        # Assume firebase_admin was initialized at application startup
        from firebase_admin import auth as fb_auth

        user = fb_auth.create_user(email=body.email, password=body.password, display_name=body.display_name)
        uid = user.uid

        # Create user doc in Firestore
        db = get_firestore_db()
        if db:
            doc = {
                "email": body.email,
                "display_name": body.display_name or "",
                "created_at": datetime.datetime.utcnow().isoformat() + "Z",
            }
            db.collection("users").document(uid).set(doc)

        return {"uid": uid, "status": "created"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login")
def login(body: LoginRequest):
    logger.info("ENTER POST /auth/login called")
    try:
        # Assume firebase_admin was initialized at application startup
        from firebase_admin import auth as fb_auth

        decoded = fb_auth.verify_id_token(body.id_token)
        uid = decoded.get("uid")

        # Fetch user doc from Firestore
        db = get_firestore_db()
        user_doc = None
        if db and uid:
            doc = db.collection("users").document(uid).get()
            if doc.exists:
                user_doc = doc.to_dict()

        return {"uid": uid, "user": user_doc}

    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

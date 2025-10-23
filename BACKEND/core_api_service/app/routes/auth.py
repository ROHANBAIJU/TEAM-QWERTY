from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
import os
import datetime

from ..comms.firestore_client import get_firestore_db

router = APIRouter()


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: Optional[str] = None


class LoginRequest(BaseModel):
    id_token: str


@router.post("/signup")
def signup(body: SignupRequest):
    print(f"ENTER POST /auth/signup called for {body.email}")

    try:
        # Lazy import to avoid hard dependency at import-time
        import firebase_admin
        from firebase_admin import auth as fb_auth, credentials

        # Initialize firebase admin if not already
        if not firebase_admin._apps:
            cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            if cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            else:
                # Try default app (will fail if not configured)
                firebase_admin.initialize_app()

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
    print("ENTER POST /auth/login called")
    try:
        import firebase_admin
        from firebase_admin import auth as fb_auth

        # Initialize if needed
        if not firebase_admin._apps:
            cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            if cred_path and os.path.exists(cred_path):
                from firebase_admin import credentials
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            else:
                firebase_admin.initialize_app()

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

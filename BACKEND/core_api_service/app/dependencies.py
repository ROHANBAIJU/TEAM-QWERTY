"""Global dependencies."""

from typing import Optional
from fastapi import Header, HTTPException, status


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    Dependency for getting current user from authorization header.
    For now, this is a placeholder that allows all requests.
    TODO: Implement proper Firebase Auth token verification.
    """
    # For development/demo, allow all requests
    # In production, verify Firebase Auth token here
    return {"user_id": "anonymous", "authenticated": False}


# TODO: add database/session dependencies

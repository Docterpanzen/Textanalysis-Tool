from __future__ import annotations

from datetime import datetime, timedelta
import secrets
from typing import Dict

from fastapi import Header, HTTPException, status

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin"
TOKEN_TTL = timedelta(hours=8)

_tokens: Dict[str, datetime] = {}


def _cleanup_expired() -> None:
    now = datetime.utcnow()
    expired = [token for token, created in _tokens.items() if now - created > TOKEN_TTL]
    for token in expired:
        _tokens.pop(token, None)


def create_token() -> str:
    _cleanup_expired()
    token = secrets.token_urlsafe(32)
    _tokens[token] = datetime.utcnow()
    return token


def validate_token(token: str) -> bool:
    _cleanup_expired()
    created = _tokens.get(token)
    if not created:
        return False
    if datetime.utcnow() - created > TOKEN_TTL:
        _tokens.pop(token, None)
        return False
    return True


def require_admin(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing admin token.",
        )

    token = authorization.split(" ", 1)[1].strip()
    if not validate_token(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired admin token.",
        )

    return token

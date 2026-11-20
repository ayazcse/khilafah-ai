"""Shared FastAPI dependencies: DB session, current user, role checks."""
from __future__ import annotations

import uuid
from collections.abc import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from backend.app.database import SessionLocal
from backend.app.models import User
from backend.app.security import decode_access_token

# Keep this endpoint aligned with the OAuth2 form-based token route in auth.py.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    user_id = decode_access_token(token)
    if user_id is None:
        raise credentials_exception
    try:
        user = db.get(User, uuid.UUID(user_id))
    except (ValueError, TypeError):
        raise credentials_exception
    if user is None:
        raise credentials_exception
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user

"""Authentication: register, login, OAuth2 token, me."""
# NOTE: no `from __future__ import annotations` here deliberately — combined
# with slowapi's @limiter.limit decorator, postponed evaluation of
# annotations breaks FastAPI's ability to resolve the Pydantic body model
# (it ends up treating `payload` as a query parameter). See documents.py for
# the same note.
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from backend.app.deps import get_current_user, get_db
from backend.app.models import User
from backend.app.rate_limit import limiter
from backend.app.schemas import Token, UserLogin, UserOut, UserRegister
from backend.app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _authenticate(email: str, password: str, db: Session) -> Token:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    return Token(access_token=create_access_token(subject=user.id))


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def register(request: Request, payload: UserRegister, db: Session = Depends(get_db)) -> User:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
@limiter.limit("20/minute")
def login(request: Request, payload: UserLogin, db: Session = Depends(get_db)) -> Token:
    """JSON login endpoint retained for the web frontend and existing clients."""
    return _authenticate(payload.email, payload.password, db)


@router.post("/token", response_model=Token)
@limiter.limit("20/minute")
def issue_oauth2_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> Token:
    """OAuth2 form endpoint used by Swagger UI's Authorize dialog.

    OAuth2 calls the account identifier `username`; KHILAFAH AI uses email
    addresses, so the submitted username is authenticated as the email.
    """
    return _authenticate(form_data.username, form_data.password, db)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user

"""
keys.py — Key generation endpoint.

POST /generate-keys
  - Creates an ECDSA P-256 keypair for a new user
  - Encrypts the private key with AES-256 using BestAvailableEncryption
  - Stores bcrypt hash of password for future auth
  - Returns public key (safe to share)
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from backend.config import RATE_LIMIT_KEY_GEN
from backend.schemas import UserCreate, KeyResponse
from backend.crypto import generate_keypair
from backend.database import get_db
from backend import models

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post(
    "/generate-keys",
    response_model=KeyResponse,
    summary="Generate ECDSA keypair for a user",
    description="Creates a new user with an ECDSA P-256 keypair. "
                "Private key is AES-256 encrypted, password is bcrypt hashed.",
)
@limiter.limit(RATE_LIMIT_KEY_GEN)
async def generate_keys(body: UserCreate, request: Request, db: Session = Depends(get_db)):
    username = body.username.strip()
    password = body.password.strip()

    if not username or not password:
        raise HTTPException(status_code=400, detail="username and password are required")

    existing = db.query(models.User).filter(models.User.username == username).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"User '{username}' already exists")

    public_pem, encrypted_pem, bcrypt_hash = generate_keypair(password)

    new_user = models.User(
        username=username,
        public_key=public_pem,
        encrypted_private_key=encrypted_pem,
        password_hash=bcrypt_hash,
    )
    db.add(new_user)
    db.commit()

    # Audit log
    log = models.AuditLog(
        transaction_id=None,
        status="SUCCESS",
        reason=f"ECDSA P-256 keypair generated for user: {username}"
    )
    db.add(log)
    db.commit()

    return KeyResponse(
        username=username,
        public_key=public_pem,
        message="Keypair generated. Private key is AES-256 encrypted and stored securely."
    )

"""
transactions.py — Transaction signing and verification endpoints.

POST /sign-transaction
  - Builds a transaction payload (txn_id, timestamp, nonce auto-generated)
  - Hashes with SHA-256, signs with sender's ECDSA private key
  - Wraps in a JWT envelope for transport integrity
  - Returns signed envelope

POST /verify-transaction
  - 5-step verification pipeline:
    1. Field presence check
    2. Timestamp window check (rejects expired / future transactions)
    3. Nonce uniqueness check (rejects replays)
    4. ECDSA signature verification (rejects tampered payloads)
    5. Commit to DB + audit log
"""

import time
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from cryptography.exceptions import InvalidSignature

from backend.config import RATE_LIMIT_TRANSACTION, REPLAY_WINDOW_SECONDS
from backend.schemas import TransactionCreate, TransactionVerify, SignedTransactionResponse, VerifyResponse
from backend.crypto import (
    verify_password,
    sign_transaction,
    verify_signature,
    compute_hash,
    create_jwt_envelope,
    decode_jwt_envelope,
)
from backend.database import get_db
from backend import models

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


def _audit(db: Session, txn_id: str, status: str, reason: str):
    """Append-only audit log helper."""
    log = models.AuditLog(transaction_id=txn_id, status=status, reason=reason)
    db.add(log)
    db.commit()


@router.post(
    "/sign-transaction",
    response_model=SignedTransactionResponse,
    summary="Sign a transaction",
    description="Builds a transaction payload, signs it with the sender's ECDSA private key, "
                "and returns a JWT-wrapped envelope.",
)
@limiter.limit(RATE_LIMIT_TRANSACTION)
async def sign(body: TransactionCreate, request: Request, db: Session = Depends(get_db)):
    sender = body.sender.strip()
    password = body.password.strip()
    receiver = body.receiver.strip()
    amount = body.amount
    currency = body.currency.strip()

    # Look up user
    user = db.query(models.User).filter(models.User.username == sender).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{sender}' not found")

    # Auth check via bcrypt
    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid password for key decryption")

    # Build canonical payload
    payload = {
        "txn_id":    str(uuid.uuid4()),
        "sender":    sender,
        "receiver":  receiver,
        "amount":    float(amount),
        "currency":  currency,
        "timestamp": str(time.time()),
        "nonce":     uuid.uuid4().hex,
    }

    # Sign
    signature = sign_transaction(payload, user.encrypted_private_key, password)
    payload_hash = compute_hash(payload)

    # JWT envelope
    jwt_token = create_jwt_envelope(payload, signature, payload_hash)

    _audit(db, payload["txn_id"], "SIGNED", f"Signed by {sender}")

    return SignedTransactionResponse(
        payload=payload,
        signature=signature,
        hash=payload_hash,
        jwt_token=jwt_token,
        message="Transaction signed successfully"
    )


@router.post(
    "/verify-transaction",
    response_model=VerifyResponse,
    summary="Verify a signed transaction",
    description="5-step verification: field check → timestamp window → nonce uniqueness → "
                "ECDSA signature → commit. Detects tampering and replay attacks.",
)
@limiter.limit(RATE_LIMIT_TRANSACTION)
async def verify(body: TransactionVerify, request: Request, db: Session = Depends(get_db)):
    payload = body.payload
    sig = body.signature.strip()
    p_hash = body.hash.strip()
    jwt_token = body.jwt_token

    # Optional JWT envelope validation
    if jwt_token:
        try:
            decoded = decode_jwt_envelope(jwt_token)
            if decoded.get("signature") != sig:
                _audit(db, payload.get("txn_id", "?"), "FAIL", "JWT signature mismatch — envelope tampered")
                return VerifyResponse(valid=False, reason="JWT envelope integrity check failed — signature mismatch")
        except Exception:
            _audit(db, payload.get("txn_id", "?"), "FAIL", "Invalid JWT token")
            return VerifyResponse(valid=False, reason="Invalid JWT token")

    # Step 1 — field presence
    required = {"sender", "receiver", "amount", "timestamp", "nonce"}
    missing = required - set(payload.keys())
    if missing:
        return VerifyResponse(valid=False, reason=f"Missing fields: {missing}")

    sender_name = payload.get("sender")
    txn_id = payload.get("txn_id", str(uuid.uuid4()))

    # Step 2 — hash integrity check (tamper detection)
    computed_hash = compute_hash(payload)
    if computed_hash != p_hash:
        _audit(db, txn_id, "FAIL", "Tamper detected: Payload hash mismatch")
        return VerifyResponse(valid=False, reason="Tamper detected: Payload hash mismatch")

    # Step 3 — timestamp window
    try:
        txn_time = float(payload["timestamp"])
    except (ValueError, TypeError):
        _audit(db, txn_id, "FAIL", "Invalid timestamp format")
        return VerifyResponse(valid=False, reason="Invalid timestamp format")

    age = abs(time.time() - txn_time)
    if age > REPLAY_WINDOW_SECONDS:
        _audit(db, txn_id, "FAIL", f"Replay attack: Transaction expired ({age:.0f}s outside 5-min window)")
        return VerifyResponse(valid=False, reason="Replay attack: Transaction expired (older than 5 mins)")

    # Step 4 — nonce uniqueness (replay prevention)
    existing = db.query(models.Transaction).filter(models.Transaction.nonce == payload["nonce"]).first()
    if existing:
        _audit(db, txn_id, "FAIL", "Replay attack: Nonce already used")
        return VerifyResponse(valid=False, reason="Replay attack: Nonce already used")

    # Step 5 — ECDSA signature verification
    user = db.query(models.User).filter(models.User.username == sender_name).first()
    if not user:
        _audit(db, txn_id, "FAIL", f"Sender '{sender_name}' not found")
        return VerifyResponse(valid=False, reason=f"Sender '{sender_name}' not found in database")

    try:
        verify_signature(payload, sig, user.public_key)
    except InvalidSignature:
        _audit(db, txn_id, "FAIL", "ECDSA signature invalid — payload tampered")
        # Still save the rejected transaction for audit
        txn = models.Transaction(
            txn_id=txn_id, sender=sender_name,
            receiver=payload.get("receiver", ""),
            amount=payload.get("amount", 0),
            currency=payload.get("currency", "USD"),
            timestamp=payload["timestamp"],
            nonce=payload["nonce"],
            signature=sig, payload_hash=p_hash, status="REJECTED"
        )
        db.add(txn)
        db.commit()
        return VerifyResponse(valid=False, reason="Invalid signature: Verification failed — payload was tampered")
    except Exception as e:
        _audit(db, txn_id, "FAIL", f"Verification error: {e}")
        return VerifyResponse(valid=False, reason=f"Verification error: {e}")

    # All checks passed — commit
    new_txn = models.Transaction(
        txn_id=txn_id, sender=sender_name,
        receiver=payload["receiver"],
        amount=payload["amount"],
        currency=payload.get("currency", "USD"),
        timestamp=payload["timestamp"],
        nonce=payload["nonce"],
        signature=sig, payload_hash=p_hash, status="ACCEPTED"
    )
    db.add(new_txn)
    db.commit()
    db.refresh(new_txn)

    _audit(db, txn_id, "PASS",
           f"Accepted — {payload['amount']} {payload.get('currency', '?')} "
           f"from {sender_name} to {payload['receiver']}")

    return VerifyResponse(
        valid=True,
        reason="Transaction verified and accepted",
        transaction_id=new_txn.txn_id
    )

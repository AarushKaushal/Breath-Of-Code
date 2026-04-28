"""
audit.py — Audit log, transactions list, and users endpoints.

GET /audit-logs       — Full append-only audit trail
GET /transactions     — Recent transactions
GET /users            — Registered users
"""

from typing import List
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from backend.config import RATE_LIMIT_READ
from backend.database import get_db
from backend.schemas import AuditLogSchema, TransactionSchema, UserSchema
from backend import models

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get(
    "/audit-logs",
    response_model=List[AuditLogSchema],
    summary="Get audit logs",
    description="Returns the append-only cryptographic audit trail. "
                "Logs are never updated or deleted.",
)
@limiter.limit(RATE_LIMIT_READ)
async def audit_logs(request: Request, db: Session = Depends(get_db)):
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).limit(100).all()


@router.get(
    "/transactions",
    response_model=List[TransactionSchema],
    summary="List recent transactions",
    description="Returns the 50 most recent transactions.",
)
@limiter.limit(RATE_LIMIT_READ)
async def transactions(request: Request, db: Session = Depends(get_db)):
    return db.query(models.Transaction).order_by(models.Transaction.created_at.desc()).limit(50).all()


@router.get(
    "/transactions/{txn_id}/audit",
    response_model=List[AuditLogSchema],
    summary="Get audit trail for a specific transaction",
    description="Returns all audit entries for a given transaction ID.",
)
@limiter.limit(RATE_LIMIT_READ)
async def txn_audit(txn_id: str, request: Request, db: Session = Depends(get_db)):
    return db.query(models.AuditLog).filter(
        models.AuditLog.transaction_id == txn_id
    ).order_by(models.AuditLog.id).all()


@router.get(
    "/users",
    response_model=List[UserSchema],
    summary="List registered users",
    description="Returns all registered users (IDs, public keys, and creation dates).",
)
@limiter.limit(RATE_LIMIT_READ)
async def users(request: Request, db: Session = Depends(get_db)):
    return db.query(models.User).all()

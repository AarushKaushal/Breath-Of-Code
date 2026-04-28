"""
schemas.py — Pydantic request/response schemas for all API endpoints.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict
from datetime import datetime


# ── Request Schemas ───────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str = Field(..., min_length=1, description="Unique user identifier")
    password: str = Field(..., min_length=1, description="Password to encrypt the private key")


class TransactionCreate(BaseModel):
    sender: str = Field(..., min_length=1, description="Sender's username")
    password: str = Field(..., min_length=1, description="Sender's password")
    receiver: str = Field(..., min_length=1, description="Receiver's username")
    amount: float = Field(..., gt=0, description="Transaction amount")
    currency: str = Field(default="USD", max_length=5, description="Currency code")


class TransactionVerify(BaseModel):
    payload: Dict
    signature: str = Field(..., min_length=1)
    hash: str = Field(..., min_length=1)
    jwt_token: Optional[str] = None


# ── Response Schemas ──────────────────────────────────────────────────────────

class KeyResponse(BaseModel):
    username: str
    public_key: str
    message: str


class SignedTransactionResponse(BaseModel):
    payload: Dict
    signature: str
    hash: str
    jwt_token: str
    message: str


class VerifyResponse(BaseModel):
    valid: bool
    reason: str
    transaction_id: Optional[str] = None


class AuditLogSchema(BaseModel):
    id: int
    transaction_id: Optional[str]
    status: str
    reason: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class TransactionSchema(BaseModel):
    id: int
    txn_id: str
    sender: str
    receiver: str
    amount: float
    currency: Optional[str] = "USD"
    timestamp: str
    nonce: str
    signature: str
    payload_hash: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserSchema(BaseModel):
    id: int
    username: str
    public_key: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
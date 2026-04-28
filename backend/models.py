"""
models.py — SQLAlchemy ORM models for Users, Transactions, and AuditLogs.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func

from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    public_key = Column(Text, nullable=False)
    encrypted_private_key = Column(Text, nullable=False)
    password_hash = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    txn_id = Column(String, unique=True, index=True, nullable=False)
    sender = Column(String, nullable=False)
    receiver = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    timestamp = Column(String, nullable=False)
    nonce = Column(String, unique=True, nullable=False)
    signature = Column(Text, nullable=False)
    payload_hash = Column(String, nullable=False)
    status = Column(String, default="PENDING")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AuditLog(Base):
    """Append-only audit log: no UPDATE or DELETE ever runs on this table."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, nullable=True)
    status = Column(String, nullable=False)  # PASS, FAIL, SIGNED, etc.
    reason = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
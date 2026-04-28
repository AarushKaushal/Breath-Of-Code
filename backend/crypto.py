"""
crypto.py — ECDSA key generation, transaction signing, verification, and JWT helpers.

Algorithms:
  - ECDSA P-256 (SECP256R1) for digital signatures
  - SHA-256 for payload hashing
  - AES-256-CBC for private key encryption at rest (via BestAvailableEncryption)
  - bcrypt for password hashing
  - JWT (HS256) for signed payload envelope
"""

import json
import hashlib
import bcrypt
import jwt as pyjwt
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric.utils import Prehashed
from cryptography.exceptions import InvalidSignature

from backend.config import JWT_SECRET, JWT_ALGORITHM


# ── Key generation ────────────────────────────────────────────────────────────

def generate_keypair(password: str) -> tuple:
    """
    Generate an ECDSA P-256 keypair.

    Returns:
        (public_pem_str, encrypted_private_pem_str, bcrypt_hash_str)
    """
    bcrypt_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    private_key = ec.generate_private_key(ec.SECP256R1())

    encrypted_private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.BestAvailableEncryption(password.encode())
    ).decode()

    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode()

    return public_pem, encrypted_private_pem, bcrypt_hash


def verify_password(password: str, bcrypt_hash: str) -> bool:
    """Check password against stored bcrypt hash."""
    return bcrypt.checkpw(password.encode(), bcrypt_hash.encode())


def decrypt_private_key(encrypted_pem: str, password: str):
    """Load and decrypt the ECDSA private key."""
    return serialization.load_pem_private_key(
        encrypted_pem.encode(),
        password=password.encode()
    )


# ── Canonical serialization ───────────────────────────────────────────────────

def canonical_bytes(payload: dict) -> bytes:
    """Deterministic JSON serialization — same input always produces same bytes."""
    return json.dumps(payload, sort_keys=True, separators=(',', ':')).encode('utf-8')


def compute_hash(payload: dict) -> str:
    """Compute SHA-256 hex digest of the canonical payload."""
    return hashlib.sha256(canonical_bytes(payload)).hexdigest()


# ── Signing ───────────────────────────────────────────────────────────────────

def sign_transaction(payload: dict, encrypted_pem: str, password: str) -> str:
    """
    Sign a transaction payload.
    Flow: payload → canonical JSON → SHA-256 digest → ECDSA sign → hex signature
    """
    private_key = decrypt_private_key(encrypted_pem, password)
    digest = hashlib.sha256(canonical_bytes(payload)).digest()
    signature_bytes = private_key.sign(digest, ec.ECDSA(Prehashed(hashes.SHA256())))
    return signature_bytes.hex()


# ── Verification ──────────────────────────────────────────────────────────────

def verify_signature(payload: dict, signature_hex: str, public_pem: str) -> bool:
    """
    Verify a transaction signature.
    Raises InvalidSignature if tampered.
    """
    public_key = serialization.load_pem_public_key(public_pem.encode())
    digest = hashlib.sha256(canonical_bytes(payload)).digest()
    try:
        public_key.verify(
            bytes.fromhex(signature_hex),
            digest,
            ec.ECDSA(Prehashed(hashes.SHA256()))
        )
        return True
    except InvalidSignature:
        raise
    except Exception as e:
        raise InvalidSignature(f"Verification error: {e}")


# ── JWT helpers ───────────────────────────────────────────────────────────────

def create_jwt_envelope(payload: dict, signature: str, payload_hash: str) -> str:
    """Wrap the signed transaction in a JWT for transport integrity."""
    jwt_payload = {
        "payload": payload,
        "signature": signature,
        "hash": payload_hash,
    }
    return pyjwt.encode(jwt_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_jwt_envelope(token: str) -> dict:
    """Decode and validate a JWT envelope."""
    return pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

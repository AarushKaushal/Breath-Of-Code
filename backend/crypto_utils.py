import hashlib
import json
import time
from typing import Dict, Tuple

import jwt
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.serialization import (
    BestAvailableEncryption,
    Encoding,
    PrivateFormat,
    PublicFormat,
    load_pem_private_key,
    load_pem_public_key,
)


def generate_keypair(password: str) -> Tuple[bytes, bytes]:
    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()
    encrypted_private_bytes = private_key.private_bytes(
        Encoding.PEM,
        PrivateFormat.PKCS8,
        BestAvailableEncryption(password.encode()),
    )
    public_bytes = public_key.public_bytes(Encoding.PEM, PublicFormat.SubjectPublicKeyInfo)
    return encrypted_private_bytes, public_bytes


def serialize_payload(payload: Dict) -> bytes:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def compute_sha256(payload: Dict) -> str:
    return hashlib.sha256(serialize_payload(payload)).hexdigest()


def sign_payload(payload: Dict, encrypted_private_pem: bytes, password: str) -> Tuple[str, str, str]:
    private_key = load_pem_private_key(encrypted_private_pem, password=password.encode())
    serialized = serialize_payload(payload)
    signature = private_key.sign(serialized, ec.ECDSA(hashes.SHA256()))
    payload_hash = hashlib.sha256(serialized).hexdigest()
    jwt_token = jwt.encode({**payload, "exp": int(time.time() + 300)}, private_key, algorithm="ES256")
    return signature.hex(), payload_hash, jwt_token


def verify_signature(payload: Dict, signature_hex: str, public_pem: bytes) -> bool:
    public_key = load_pem_public_key(public_pem)
    serialized = serialize_payload(payload)
    signature = bytes.fromhex(signature_hex)
    public_key.verify(signature, serialized, ec.ECDSA(hashes.SHA256()))
    return True


def verify_jwt_token(token: str, public_pem: bytes) -> Dict:
    public_key = load_pem_public_key(public_pem)
    return jwt.decode(token, public_key, algorithms=["ES256"])
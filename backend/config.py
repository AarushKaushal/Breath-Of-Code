"""
config.py — Application settings and constants.
"""

import os
import secrets

# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./fintech.db")

# ── Replay-attack window ─────────────────────────────────────────────────────
REPLAY_WINDOW_SECONDS = 300  # 5 minutes

# ── JWT ───────────────────────────────────────────────────────────────────────
JWT_SECRET = os.environ.get("JWT_SECRET", secrets.token_hex(32))
JWT_ALGORITHM = "HS256"

# ── Rate limiting ─────────────────────────────────────────────────────────────
RATE_LIMIT_KEY_GEN = "10/minute"
RATE_LIMIT_TRANSACTION = "30/minute"
RATE_LIMIT_READ = "60/minute"

"""
main.py — FastAPI application entry point.

Tamper-Proof Digital Transaction Signing & Verification System
  - ECDSA P-256 digital signatures
  - SHA-256 payload hashing
  - JWT-wrapped envelopes
  - Nonce + timestamp replay prevention
  - Append-only audit trail
  - Rate limiting via slowapi
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from backend.database import init_db
from backend.routes import keys, transactions, audit

# ── Initialize database ──────────────────────────────────────────────────────
init_db()

# ── Rate limiter ─────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ── FastAPI app ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="SecurePay — Tamper-Proof Transaction Signing System",
    description=(
        "A production-grade digital transaction signing and verification system "
        "using ECDSA P-256, SHA-256, JWT, and append-only audit logging. "
        "Features tamper detection and replay attack prevention."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Include route modules ────────────────────────────────────────────────────
app.include_router(keys.router, tags=["Key Management"])
app.include_router(transactions.router, tags=["Transactions"])
app.include_router(audit.router, tags=["Audit & Data"])

# ── Serve frontend ───────────────────────────────────────────────────────────
DIST_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")

if os.path.exists(DIST_PATH):
    # Serve built frontend assets
    assets_path = os.path.join(DIST_PATH, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.get("/", include_in_schema=False)
    async def serve_index():
        return FileResponse(os.path.join(DIST_PATH, "index.html"))

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        file_path = os.path.join(DIST_PATH, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(DIST_PATH, "index.html"))
else:
    @app.get("/", include_in_schema=False)
    async def api_root():
        return JSONResponse({
            "message": "SecurePay API is running. Visit /docs for API documentation.",
            "hint": "Build the frontend with: cd frontend && npm run build"
        })


@app.get("/health", include_in_schema=False)
async def health():
    return {"status": "ok", "service": "SecurePay"}


# ── Run with uvicorn ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    print("\n  SecurePay — Tamper-Proof Transaction Signing System")
    print("  ─────────────────────────────────────────────────────")
    print("  Dashboard:  http://localhost:5000")
    print("  API Docs:   http://localhost:5000/docs")
    print()
    uvicorn.run("backend.main:app", host="0.0.0.0", port=5000, reload=True)

"""Liveness and readiness probes.

`/health` is a static liveness signal (process is up). `/readiness` actively checks the
critical dependencies (DB, Redis) so orchestrators only route traffic when the service
can actually serve it. Foundation endpoints only — no business logic.
"""

from fastapi import APIRouter, Request
from sqlalchemy import text

from app.db.session import get_session
from app.schemas.health import DependencyStatus, HealthResponse, ReadinessResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get("/readiness", response_model=ReadinessResponse)
async def readiness(request: Request) -> ReadinessResponse:
    db_ok = False
    redis_ok = False

    try:
        async for session in get_session():
            await session.execute(text("SELECT 1"))
            db_ok = True
            break
    except Exception:  # readiness must never raise
        db_ok = False

    try:
        redis = request.app.state.redis
        redis_ok = bool(await redis.ping())
    except Exception:  # readiness must never raise
        redis_ok = False

    deps = DependencyStatus(database=db_ok, redis=redis_ok)
    # The DB is the only hard dependency for serving the heatmap; Redis is optional
    # (caching/realtime) and reported for information only.
    return ReadinessResponse(
        status="ready" if db_ok else "degraded",
        dependencies=deps,
    )

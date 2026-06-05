"""Admin endpoint to (re)load real data over HTTP — used where a shell isn't available
(e.g. free hosting). Runs ingestion in the background and returns immediately. Guarded by a
token (`INGEST_TOKEN`); disabled if no token is configured."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException

from app.core.config import get_settings
from app.core.logging import get_logger
from app.db import session as db_session
from app.services.ingest import ingest_real

router = APIRouter()
log = get_logger("admin")


async def _run_ingest() -> None:
    if db_session.session_factory is None:
        log.error("ingest_no_session_factory")
        return
    try:
        async with db_session.session_factory() as session:
            count = await ingest_real(session)
        log.info("admin_ingest_done", cells=count)
    except Exception as exc:  # background task: log, never crash the worker
        log.error("admin_ingest_failed", error=str(exc))


@router.post("/admin/ingest")
async def trigger_ingest(
    background: BackgroundTasks,
    x_ingest_token: Annotated[str | None, Header()] = None,
) -> dict[str, str]:
    settings = get_settings()
    if not settings.ingest_token or x_ingest_token != settings.ingest_token:
        raise HTTPException(403, "invalid or missing ingest token")
    background.add_task(_run_ingest)
    return {"status": "ingestion started"}

"""FastAPI application factory.

The lifespan owns process-scoped resources (async DB engine, Redis pool): created on
startup, disposed on shutdown. The OpenAPI schema is served at /api/v1/openapi.json,
which is the source the frontend's TypeScript types are generated from.
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger
from app.db import session as db_session
from app.db.redis import create_redis
from app.db.session import create_engine, create_session_factory
from app.realtime.websocket import router as ws_router

settings = get_settings()
configure_logging(settings.api_log_level)
log = get_logger("app")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    engine = create_engine()
    db_session.session_factory = create_session_factory(engine)
    redis = create_redis()
    app.state.engine = engine
    app.state.redis = redis
    log.info("startup", env=settings.api_env)
    try:
        yield
    finally:
        await redis.aclose()
        await engine.dispose()
        log.info("shutdown")


def create_app() -> FastAPI:
    app = FastAPI(
        title="EvoComb API",
        version="0.0.0",
        openapi_url="/api/v1/openapi.json",
        docs_url="/api/v1/docs",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_origin_regex=settings.api_cors_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix="/api/v1")
    app.include_router(ws_router)
    return app


app = create_app()

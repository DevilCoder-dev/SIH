"""Typed application settings.

12-factor config: everything comes from the environment and is validated on load,
so the service fails fast on misconfiguration instead of erroring at request time.
Vars are namespaced (POSTGRES_*, REDIS_*, MQTT_*, API_*) to stay legible as the
platform grows.
"""

from functools import lru_cache

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- PostgreSQL / TimescaleDB / PostGIS ---
    postgres_user: str = "urban"
    postgres_password: str = "changeme"
    postgres_db: str = "urban_stress"
    postgres_host: str = "localhost"
    postgres_port: int = 5432

    # --- Redis ---
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str = ""

    # --- MQTT (provisioned now; consumer wired in Phase 2) ---
    mqtt_host: str = "localhost"
    mqtt_port: int = 1883

    # --- API ---
    api_env: str = "development"
    api_log_level: str = "INFO"
    api_cors_origins: str = "http://localhost:3000"

    # --- External data providers (Phase 4) ---
    waqi_token: str = ""  # free token from https://aqicn.org/data-platform/token/
    # Polite identifier sent to OpenStreetMap Nominatim (reverse geocoding).
    geocoder_user_agent: str = "urban-stress-platform/0.1"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def database_url(self) -> str:
        """Async SQLAlchemy URL (asyncpg driver)."""
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def alembic_database_url(self) -> str:
        """Sync URL for Alembic migrations (psycopg/asyncpg-agnostic via asyncpg async env)."""
        return self.database_url

    @computed_field  # type: ignore[prop-decorator]
    @property
    def redis_url(self) -> str:
        auth = f":{self.redis_password}@" if self.redis_password else ""
        return f"redis://{auth}{self.redis_host}:{self.redis_port}/0"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.api_cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    """Cached singleton so settings are parsed once per process."""
    return Settings()

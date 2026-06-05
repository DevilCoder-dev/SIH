"""Minimal OpenStreetMap Overpass client. Used to derive real geospatial proxies for
factors with no live feed (crowd density from POIs, noise from roads, greenery, localities).

Retries with backoff across mirrors — the public Overpass instances throttle aggressively,
especially from shared cloud IPs (e.g. free hosting)."""

from __future__ import annotations

import asyncio
from typing import Any

import httpx

from app.core.logging import get_logger

log = get_logger("overpass")

_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
_HEADERS = {
    "User-Agent": "urban-stress-platform/0.1 (geospatial research)",
    "Accept": "application/json",
}


async def overpass_query(query: str) -> dict[str, Any]:
    last: Exception | None = None
    for attempt in range(5):
        endpoint = _ENDPOINTS[attempt % len(_ENDPOINTS)]
        try:
            async with httpx.AsyncClient(timeout=180, headers=_HEADERS) as client:
                resp = await client.post(endpoint, data={"data": query})
                resp.raise_for_status()
                result: dict[str, Any] = resp.json()
                return result
        except Exception as exc:
            last = exc
            log.warning("overpass_retry", attempt=attempt, error=str(exc))
            await asyncio.sleep(4 * (attempt + 1))  # 4s, 8s, 12s, 16s, 20s
    raise RuntimeError(f"overpass failed after retries: {last}")


def bbox_str(bbox: tuple[float, float, float, float]) -> str:
    """(minLng,minLat,maxLng,maxLat) -> Overpass '(south,west,north,east)'."""
    min_lng, min_lat, max_lng, max_lat = bbox
    return f"{min_lat},{min_lng},{max_lat},{max_lng}"

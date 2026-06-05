"""Minimal OpenStreetMap Overpass client. Used to derive real geospatial proxies for
factors with no live feed (crowd density from POIs, noise from roads, greenery from parks)."""

from __future__ import annotations

from typing import Any

import httpx

OVERPASS_URL = "https://overpass-api.de/api/interpreter"


_HEADERS = {
    "User-Agent": "urban-stress-platform/0.1 (geospatial research)",
    "Accept": "application/json",
}


async def overpass_query(query: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=180, headers=_HEADERS) as client:
        resp = await client.post(OVERPASS_URL, data={"data": query})
        resp.raise_for_status()
        result: dict[str, Any] = resp.json()
        return result


def bbox_str(bbox: tuple[float, float, float, float]) -> str:
    """(minLng,minLat,maxLng,maxLat) -> Overpass '(south,west,north,east)'."""
    min_lng, min_lat, max_lng, max_lat = bbox
    return f"{min_lat},{min_lng},{max_lat},{max_lng}"

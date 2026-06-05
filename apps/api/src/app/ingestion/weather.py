"""Real temperature from Open-Meteo (free, no API key). One request samples a coarse grid
over the bbox; values are IDW-interpolated to cells (temperature is spatially smooth)."""

from __future__ import annotations

from typing import Any

import httpx

from app.ingestion.http_retry import with_retries
from app.ingestion.interpolate import Point

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


async def fetch_temperature_grid(
    bbox: tuple[float, float, float, float], nx: int = 6, ny: int = 6
) -> list[Point]:
    """Current 2m temperature (°C) at an nx×ny grid over bbox, as (lat, lng, temp)."""
    min_lng, min_lat, max_lng, max_lat = bbox
    lats: list[float] = []
    lngs: list[float] = []
    for i in range(ny):
        for j in range(nx):
            lats.append(round(min_lat + (max_lat - min_lat) * i / (ny - 1), 4))
            lngs.append(round(min_lng + (max_lng - min_lng) * j / (nx - 1), 4))

    params = {
        "latitude": ",".join(str(x) for x in lats),
        "longitude": ",".join(str(x) for x in lngs),
        "current": "temperature_2m",
    }
    async def _call() -> Any:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(OPEN_METEO_URL, params=params)
            resp.raise_for_status()
            return resp.json()

    data = await with_retries(_call)

    # Multi-location responses come back as a list; a single location as an object.
    items = data if isinstance(data, list) else [data]
    return [
        (float(it["latitude"]), float(it["longitude"]), float(it["current"]["temperature_2m"]))
        for it in items
    ]

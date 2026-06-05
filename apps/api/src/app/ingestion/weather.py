"""Real temperature from MET Norway (api.met.no) — free, no key, and (unlike
api.open-meteo.com) not blocked from cloud IPs like Render. Sampled on a small grid and
IDW-interpolated to cells (temperature is spatially smooth). MET requires a descriptive
User-Agent per their terms of service."""

from __future__ import annotations

from typing import Any

import httpx

from app.ingestion.http_retry import with_retries
from app.ingestion.interpolate import Point

MET_NO_URL = "https://api.met.no/weatherapi/locationforecast/2.0/compact"
_HEADERS = {"User-Agent": "EvoComb/0.1 (https://github.com/aksh08022006/EvoComb)"}


async def fetch_temperature_grid(
    bbox: tuple[float, float, float, float], nx: int = 3, ny: int = 3
) -> list[Point]:
    """Current 2m temperature (°C) at an nx×ny grid over bbox, as (lat, lng, temp)."""
    min_lng, min_lat, max_lng, max_lat = bbox
    points: list[Point] = []

    async with httpx.AsyncClient(timeout=20, headers=_HEADERS) as client:
        for i in range(ny):
            for j in range(nx):
                lat = round(min_lat + (max_lat - min_lat) * i / (ny - 1), 4)
                lng = round(min_lng + (max_lng - min_lng) * j / (nx - 1), 4)

                async def _call(lat: float = lat, lng: float = lng) -> Any:
                    resp = await client.get(MET_NO_URL, params={"lat": lat, "lon": lng})
                    resp.raise_for_status()
                    return resp.json()

                try:
                    data = await with_retries(_call)
                    temp = data["properties"]["timeseries"][0]["data"]["instant"]["details"][
                        "air_temperature"
                    ]
                    points.append((lat, lng, float(temp)))
                except Exception:
                    continue  # skip a failed point; IDW handles gaps

    return points

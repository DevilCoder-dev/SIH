"""Real-data ingestion — replaces the synthetic simulator with real/derived inputs:

- Heat:    Open-Meteo temperature (real, no key)
- AQI:     Open-Meteo US AQI (real, no key)
- Density: OSM POI density per H3 cell (proxy for crowding)
- Noise:   distance to nearest OSM major road (proxy for traffic noise)
- Greenery: OSM parks/forest lower a cell's ESI (relief)

Coverage is clipped to the urban footprint (cells near POIs), so the map is Delhi-shaped
rather than an artificial disk. Noise + density are *modeled proxies* (no public live feed);
true values need ESP32 sensors. The output is an irregular, real surface driven by actual
city structure — not a synthetic gradient.
"""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable
from datetime import UTC, datetime

from shapely.geometry import Point
from shapely.prepared import prep
from sqlalchemy import delete, insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.db.h3_utils import cell_to_latlng
from app.domain.methodology import H3_RESOLUTION
from app.ingestion.air_quality import fetch_aqi_grid
from app.ingestion.boundary import fetch_delhi_boundary
from app.ingestion.geofeatures import GreenIndex, PlaceIndex, RoadNoiseIndex
from app.ingestion.interpolate import idw
from app.ingestion.osm import (
    fetch_green_polygons,
    fetch_place_points,
    fetch_poi_counts_by_cell,
    fetch_road_lines,
)
from app.ingestion.weather import fetch_temperature_grid
from app.models.reading import Reading
from app.services.aggregation import recompute_cells
from app.services.coverage import DELHI_BBOX, candidate_cells, delhi_cells

log = get_logger("ingest")

_REPLACED_SOURCES = ("simulator", "waqi", "open_meteo", "osm")

async def _safe[T](coro: Awaitable[T], default: T, label: str) -> T:
    """Run a source fetch; on failure log and return a default so one flaky/blocked source
    (e.g. Overpass refusing a cloud IP) doesn't sink the whole ingest."""
    try:
        return await coro
    except Exception as exc:  # resilience: one blocked source shouldn't sink the ingest
        log.warning("source_failed", source=label, error=str(exc))
        return default


def _reading(now: datetime, cell: str, metric: str, value: float, source: str) -> dict[str, object]:
    return {
        "time": now,
        "sensor_id": f"{source}:{cell}",
        "metric": metric,
        "value": value,
        "h3_r9": cell,
        "source": source,
    }


async def _coverage_cells() -> list[str]:
    """Cells clipped to the real Delhi boundary (contiguous, city-shaped). Falls back to
    the core disk if the boundary can't be fetched."""
    boundary = await fetch_delhi_boundary()
    if boundary is None:
        log.warning("boundary_unavailable_using_disk")
        return delhi_cells()
    contains = prep(boundary).contains
    cells = [c for c in candidate_cells() if contains(Point(*reversed(cell_to_latlng(c))))]
    log.info("boundary_clip", kept=len(cells))
    return cells


async def ingest_real(session: AsyncSession, now: datetime | None = None) -> dict[str, object]:
    now = now or datetime.now(UTC)

    # Fetch all sources concurrently so total time ≈ the slowest source (not the sum of
    # all retry/backoff waits) — important on throttled cloud IPs like Render's.
    temps, aqis, poi_counts, green_polys, road_lines, places = await asyncio.gather(
        _safe(fetch_temperature_grid(DELHI_BBOX), [], "met_no_temp"),
        _safe(fetch_aqi_grid(DELHI_BBOX), [], "open_meteo_aqi"),
        _safe(fetch_poi_counts_by_cell(DELHI_BBOX, H3_RESOLUTION), {}, "osm_pois"),
        _safe(fetch_green_polygons(DELHI_BBOX), [], "osm_green"),
        _safe(fetch_road_lines(DELHI_BBOX), [], "osm_roads"),
        _safe(fetch_place_points(DELHI_BBOX), [], "osm_places"),
    )
    log.info(
        "fetched_sources",
        temp=len(temps),
        aqi=len(aqis),
        poi_cells=len(poi_counts),
        green=len(green_polys),
        roads=len(road_lines),
        places=len(places),
    )

    green_idx = GreenIndex(green_polys)
    road_idx = RoadNoiseIndex(road_lines)
    place_idx = PlaceIndex(places)
    cells = await _coverage_cells()

    rows: list[dict[str, object]] = []
    green_factors: dict[str, float] = {}
    localities: dict[str, str | None] = {}
    for cell in cells:
        lat, lng = cell_to_latlng(cell)
        heat = idw(temps, lat, lng) if temps else None
        aqi = idw(aqis, lat, lng) if aqis else None
        noise = road_idx.noise_db(lat, lng)
        green_factors[cell] = green_idx.factor(lat, lng)
        localities[cell] = place_idx.nearest_name(lat, lng)

        if heat is not None:
            rows.append(_reading(now, cell, "heat", heat, "open_meteo"))
        if aqi is not None:
            rows.append(_reading(now, cell, "aqi", aqi, "open_meteo"))
        if noise is not None:
            rows.append(_reading(now, cell, "noise", noise, "osm"))
        rows.append(_reading(now, cell, "density", float(poi_counts.get(cell, 0)), "osm"))

    await session.execute(delete(Reading).where(Reading.source.in_(_REPLACED_SOURCES)))
    if rows:
        await session.execute(insert(Reading), rows)
    await session.commit()

    cell_count = await recompute_cells(
        session, now, green_factors=green_factors, localities=localities
    )
    sources = {
        "temp": len(temps),
        "aqi": len(aqis),
        "poi_cells": len(poi_counts),
        "green": len(green_polys),
        "roads": len(road_lines),
        "places": len(places),
    }
    log.info("ingest_complete", readings=len(rows), stress_cells=cell_count, **sources)
    return {"cells": cell_count, "sources": sources}

"""Delhi administrative boundary — used to clip coverage to the real city shape instead of
an artificial disk. Fetched from OSM via Overpass (reliable here) and cached to disk, since
we only need the polygon once."""

from __future__ import annotations

import json
from pathlib import Path

from shapely.geometry import LineString, mapping, shape
from shapely.geometry.base import BaseGeometry
from shapely.ops import linemerge, polygonize, unary_union

from app.core.logging import get_logger
from app.ingestion.overpass import overpass_query

log = get_logger("boundary")

_CACHE = Path(__file__).resolve().parents[3] / ".cache" / "delhi_boundary.geojson"

# NCT of Delhi = administrative boundary, admin_level 4.
_QUERY = (
    "[out:json][timeout:90];"
    'rel["boundary"="administrative"]["admin_level"="4"]["name"~"Delhi"];'
    "out geom;"
)


def _load_cache() -> BaseGeometry | None:
    if not _CACHE.exists():
        return None
    try:
        return shape(json.loads(_CACHE.read_text()))
    except Exception:
        return None


def _assemble(data: dict) -> BaseGeometry | None:  # type: ignore[type-arg]
    rels = [e for e in data.get("elements", []) if e.get("type") == "relation"]
    if not rels:
        return None
    rel = max(rels, key=lambda r: len(r.get("members", [])))  # the NCT relation
    lines: list[LineString] = []
    for m in rel.get("members", []):
        geom = m.get("geometry")
        if m.get("type") == "way" and geom and len(geom) >= 2:
            lines.append(LineString([(p["lon"], p["lat"]) for p in geom]))
    if not lines:
        return None
    polys = list(polygonize(linemerge(lines)))
    if not polys:
        return None
    result: BaseGeometry = unary_union(polys)
    return result if result.is_valid and not result.is_empty else None


async def fetch_delhi_boundary() -> BaseGeometry | None:
    """The NCT of Delhi polygon (cached), or None if unavailable (caller falls back)."""
    cached = _load_cache()
    if cached is not None:
        return cached
    try:
        geom = _assemble(await overpass_query(_QUERY))
    except Exception:
        geom = None
    if geom is not None:
        _CACHE.parent.mkdir(parents=True, exist_ok=True)
        _CACHE.write_text(json.dumps(mapping(geom)))
        log.info("boundary_cached", bounds=[round(x, 2) for x in geom.bounds])
    return geom

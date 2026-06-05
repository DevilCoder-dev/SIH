"""Derived geospatial proxies from OpenStreetMap (via Overpass).

Crowd density has no public live feed, so we proxy it from the spatial density of POIs
(amenities + shops): markets, transit, malls, eateries cluster where people congregate.
Each POI is binned to its H3 cell — the count per cell is the crowding proxy.
"""

from __future__ import annotations

from collections import Counter

from shapely.geometry import LineString, Polygon

from app.db.h3_utils import latlng_to_cell
from app.ingestion.overpass import bbox_str, overpass_query


async def fetch_poi_counts_by_cell(
    bbox: tuple[float, float, float, float], resolution: int
) -> dict[str, int]:
    """Count amenity/shop POIs per H3 cell within bbox."""
    b = bbox_str(bbox)
    query = (
        f"[out:json][timeout:120];"
        f'(node["amenity"]({b});node["shop"]({b}););'
        f"out;"
    )
    data = await overpass_query(query)

    counts: Counter[str] = Counter()
    for el in data.get("elements", []):
        if el.get("type") != "node":
            continue
        cell = latlng_to_cell(float(el["lat"]), float(el["lon"]), resolution)
        counts[cell] += 1
    return dict(counts)


async def fetch_place_points(
    bbox: tuple[float, float, float, float],
) -> list[tuple[float, float, str]]:
    """Named places (suburbs, neighbourhoods, towns) as (lat, lng, name) — used to label
    each cell with its locality without per-click geocoding."""
    b = bbox_str(bbox)
    query = (
        f"[out:json][timeout:90];"
        f'node["place"~"city|town|suburb|neighbourhood|village|quarter|locality"]["name"]({b});'
        f"out;"
    )
    data = await overpass_query(query)
    places: list[tuple[float, float, str]] = []
    for el in data.get("elements", []):
        name = el.get("tags", {}).get("name")
        if el.get("type") == "node" and name:
            places.append((float(el["lat"]), float(el["lon"]), str(name)))
    return places


async def fetch_green_polygons(bbox: tuple[float, float, float, float]) -> list[Polygon]:
    """Parks / forest / grass / wood polygons — used as greenery relief (lowers stress)."""
    b = bbox_str(bbox)
    query = (
        f"[out:json][timeout:120];"
        f'(way["leisure"~"park|garden|nature_reserve|golf_course"]({b});'
        f'way["landuse"~"forest|grass|recreation_ground|meadow|village_green|cemetery|farmland|orchard"]({b});'
        f'way["natural"~"wood|scrub|grassland|heath"]({b}););'
        f"out geom;"
    )
    data = await overpass_query(query)
    polys: list[Polygon] = []
    for el in data.get("elements", []):
        geom = el.get("geometry")
        if not geom or len(geom) < 4:
            continue
        try:
            poly = Polygon([(p["lon"], p["lat"]) for p in geom])
        except (ValueError, KeyError):
            continue
        if poly.is_valid and not poly.is_empty:
            polys.append(poly)
    return polys


async def fetch_road_lines(bbox: tuple[float, float, float, float]) -> list[LineString]:
    """Major roads (motorway/trunk/primary/secondary) — drive the noise proxy."""
    b = bbox_str(bbox)
    query = (
        f"[out:json][timeout:120];"
        f'(way["highway"~"motorway|trunk|primary|secondary"]({b}););'
        f"out geom;"
    )
    data = await overpass_query(query)
    lines: list[LineString] = []
    for el in data.get("elements", []):
        geom = el.get("geometry")
        if not geom or len(geom) < 2:
            continue
        try:
            lines.append(LineString([(p["lon"], p["lat"]) for p in geom]))
        except (ValueError, KeyError):
            continue
    return lines

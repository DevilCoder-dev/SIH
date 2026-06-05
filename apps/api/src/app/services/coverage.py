"""Delhi NCR coverage: the canonical H3 cell set + bounding box used by both the dev
simulator and the real ingestion pipeline, so they describe the same area."""

from __future__ import annotations

from app.db.h3_utils import grid_disk, latlng_to_cell

# Delhi (Connaught Place-ish) centre.
DELHI_LAT = 28.6139
DELHI_LNG = 77.2090

# ~70 H3 rings at res 9 ≈ a ~17 km radius disk over the Delhi core (simulator default).
COVERAGE_RINGS = 70

# Wider disk that fully spans the NCT; the real pipeline clips this to the admin boundary.
WIDE_RINGS = 180

# Bounding box (minLng, minLat, maxLng, maxLat) for external queries (WAQI/Open-Meteo).
DELHI_BBOX = (76.70, 28.20, 77.70, 28.95)


def delhi_cells(rings: int = COVERAGE_RINGS) -> list[str]:
    return grid_disk(latlng_to_cell(DELHI_LAT, DELHI_LNG), rings)


def candidate_cells(rings: int = WIDE_RINGS) -> list[str]:
    """A wide disk of candidate cells, to be clipped to the Delhi boundary by the caller."""
    return grid_disk(latlng_to_cell(DELHI_LAT, DELHI_LNG), rings)

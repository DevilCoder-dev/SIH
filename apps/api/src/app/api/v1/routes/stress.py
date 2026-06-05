"""Read API for the Environmental Stress heatmap.

Always viewport-bounded (a bbox is required) so payloads scale with what's on screen, not
with the whole city. The response is capped and flags `truncated` rather than silently
dropping cells.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.db.session import get_session
from app.models.stress_cell import StressCell
from app.schemas.stress import StressCellCollection, StressCellOut, StressScoresOut

router = APIRouter()
log = get_logger("stress")

# Cap per response. Delhi NCR at H3 res 9 is large; the frontend queries by viewport so
# typical requests are well under this. Exceeding it sets `truncated` + logs (no silent cap).
MAX_CELLS = 100_000


def _parse_bbox(bbox: str) -> tuple[float, float, float, float]:
    try:
        parts = [float(x) for x in bbox.split(",")]
    except ValueError:
        raise HTTPException(400, "bbox must be 'minLng,minLat,maxLng,maxLat' floats") from None
    if len(parts) != 4:
        raise HTTPException(400, "bbox must have 4 comma-separated values")
    min_lng, min_lat, max_lng, max_lat = parts
    if min_lng >= max_lng or min_lat >= max_lat:
        raise HTTPException(400, "bbox min values must be less than max values")
    return min_lng, min_lat, max_lng, max_lat


def _to_out(row: StressCell) -> StressCellOut:
    return StressCellOut(
        h3=row.h3_r9,
        lat=row.centroid_lat,
        lng=row.centroid_lng,
        esi=row.esi,
        scores=StressScoresOut(
            noise=row.noise_score,
            density=row.density_score,
            heat=row.heat_score,
            aqi=row.aqi_score,
        ),
        confidence=row.confidence,
        greenery=row.greenery,
        locality=row.locality,
        updated_at=row.updated_at,
    )


@router.get("/stress/cells", response_model=StressCellCollection)
async def get_stress_cells(
    bbox: Annotated[str, Query(description="minLng,minLat,maxLng,maxLat")],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> StressCellCollection:
    min_lng, min_lat, max_lng, max_lat = _parse_bbox(bbox)

    latest = await session.scalar(select(func.max(StressCell.bucket)))
    if latest is None:
        return StressCellCollection(bucket=None, count=0, truncated=False, cells=[])

    stmt = (
        select(StressCell)
        .where(
            StressCell.bucket == latest,
            StressCell.centroid_lng >= min_lng,
            StressCell.centroid_lng <= max_lng,
            StressCell.centroid_lat >= min_lat,
            StressCell.centroid_lat <= max_lat,
        )
        .limit(MAX_CELLS + 1)
    )
    rows = list(await session.scalars(stmt))

    truncated = len(rows) > MAX_CELLS
    if truncated:
        rows = rows[:MAX_CELLS]
        log.warning("stress_cells_truncated", bbox=bbox, cap=MAX_CELLS)

    cells = [_to_out(r) for r in rows]
    return StressCellCollection(
        bucket=latest, count=len(cells), truncated=truncated, cells=cells
    )


@router.get("/stress/cells/{h3}", response_model=StressCellOut)
async def get_stress_cell(
    h3: str,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> StressCellOut:
    latest = await session.scalar(
        select(func.max(StressCell.bucket)).where(StressCell.h3_r9 == h3)
    )
    if latest is None:
        raise HTTPException(404, "cell not found")
    row = await session.scalar(
        select(StressCell).where(StressCell.bucket == latest, StressCell.h3_r9 == h3)
    )
    if row is None:
        raise HTTPException(404, "cell not found")
    return _to_out(row)

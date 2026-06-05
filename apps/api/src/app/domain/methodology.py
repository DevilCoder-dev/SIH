"""Environmental Stress Index (ESI) — the methodology, as code.

Environmental Stress = the intensity of measurable environmental BURDEN at a location.
It is NOT human/psychological stress.

This module is the single source of truth for computation. The frontend mirrors only the
*render* constants (color ramp, weights for display) in
`packages/shared-types/src/domain/esi.ts`. Do not duplicate formulas anywhere else, and do
not invent alternative formulas without explicit justification.

Four inputs, each normalized to 0–100 then clamped, then a weighted sum:

    ESI = 0.30·Noise + 0.25·Density + 0.20·Heat + 0.25·AQI

Canonical example (also the unit test): Noise 80, Density 60, Heat 70, AQI 50
    0.30·80 + 0.25·60 + 0.20·70 + 0.25·50 = 24 + 15 + 14 + 12.5 = 65.5 → display 66.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum

# --- Spatial unit ----------------------------------------------------------------------
# Uber H3 hexagonal grid. Resolution 9 ≈ 100–200 m edge cells — the right granularity for
# Delhi NCR. Aggregation is always per-cell; never raw lat/long points.
H3_RESOLUTION = 9


class Metric(StrEnum):
    """The four measurable burdens. Values are the stable keys used across API, DB,
    realtime channels, and the frontend (kept in sync with shared-types STRESS_METRICS)."""

    NOISE = "noise"
    DENSITY = "density"
    HEAT = "heat"
    AQI = "aqi"


# --- Calibration anchors ----------------------------------------------------------------
# The ONLY place min/max anchors live. Tuning calibration = editing these constants.
NOISE_MIN_DB = 40.0  # quiet-ish urban baseline -> score 0
NOISE_MAX_DB = 100.0  # extreme -> score 100
DENSITY_MAX_DEVICES = 50.0  # unique BLE devices (crowding proxy) -> score 100
HEAT_MIN_C = 25.0  # comfortable -> score 0 (heat *stress*, not raw temperature)
HEAT_MAX_C = 45.0  # severe heat -> score 100
AQI_MAX = 300.0  # AQI 300 -> score 100

# --- ESI weights (must sum to 1.0) ------------------------------------------------------
WEIGHTS: dict[Metric, float] = {
    Metric.NOISE: 0.30,  # strongest urban stressor
    Metric.DENSITY: 0.25,  # crowd burden
    Metric.HEAT: 0.20,  # thermal burden
    Metric.AQI: 0.25,  # environmental burden
}
assert abs(sum(WEIGHTS.values()) - 1.0) < 1e-9, "ESI weights must sum to 1.0"

# --- Greenery relief (methodology extension) --------------------------------------------
# Greenery is not a burden but a *mitigator*: parks/tree cover lower local environmental
# stress (cooling, buffering, less crowding). A cell's ESI is reduced by up to this
# fraction in proportion to its green coverage (0–1). green_factor 1.0 -> ESI ×(1−relief).
GREENERY_RELIEF = 0.5


def apply_greenery(esi: float, green_factor: float) -> float:
    g = max(0.0, min(1.0, green_factor))
    return esi * (1.0 - GREENERY_RELIEF * g)


# --- Per-metric base confidence (data quality / spatial precision) ----------------------
# Reflects how trustworthy/precise each signal is (noise ~10-30m high; density ~20-50m
# medium; heat coarse but reliable; AQI coarse). Used to derive per-cell confidence.
BASE_CONFIDENCE: dict[Metric, float] = {
    Metric.NOISE: 1.0,
    Metric.DENSITY: 0.6,
    Metric.HEAT: 0.9,
    Metric.AQI: 0.8,
}


def _normalize(value: float, lo: float, hi: float) -> float:
    """Linear map [lo, hi] -> [0, 100], clamped."""
    if hi <= lo:
        raise ValueError("hi must be greater than lo")
    score = (value - lo) / (hi - lo) * 100.0
    return max(0.0, min(100.0, score))


def normalize_noise(db: float) -> float:
    return _normalize(db, NOISE_MIN_DB, NOISE_MAX_DB)


def normalize_density(devices: float) -> float:
    return _normalize(devices, 0.0, DENSITY_MAX_DEVICES)


def normalize_heat(celsius: float) -> float:
    return _normalize(celsius, HEAT_MIN_C, HEAT_MAX_C)


def normalize_aqi(aqi: float) -> float:
    return _normalize(aqi, 0.0, AQI_MAX)


NORMALIZERS = {
    Metric.NOISE: normalize_noise,
    Metric.DENSITY: normalize_density,
    Metric.HEAT: normalize_heat,
    Metric.AQI: normalize_aqi,
}


def normalize(metric: Metric, raw_value: float) -> float:
    """Normalize a raw measurement (native unit) to a 0–100 score for its metric."""
    return NORMALIZERS[metric](raw_value)


@dataclass(frozen=True, slots=True)
class StressScores:
    """Normalized 0–100 scores per metric. A metric may be missing (no recent data)."""

    noise: float | None = None
    density: float | None = None
    heat: float | None = None
    aqi: float | None = None

    def get(self, metric: Metric) -> float | None:
        value: float | None = getattr(self, metric.value)
        return value


def compute_esi(scores: StressScores) -> float:
    """Weighted ESI from normalized scores.

    If some metrics are missing, the weighted sum is renormalized over the *available*
    weights so a partial reading is not artificially deflated. With all four present this
    is exactly the canonical formula.
    """
    weighted_sum = 0.0
    weight_total = 0.0
    for metric, weight in WEIGHTS.items():
        score = scores.get(metric)
        if score is None:
            continue
        weighted_sum += weight * score
        weight_total += weight
    if weight_total == 0.0:
        return 0.0
    return weighted_sum / weight_total


def compute_confidence(scores: StressScores) -> float:
    """Per-cell confidence 0–1: weight-share of available metrics scaled by their base
    confidence. A cell with all high-confidence metrics present approaches 1.0; a cell
    with only coarse/partial data scores lower."""
    total = 0.0
    for metric, weight in WEIGHTS.items():
        if scores.get(metric) is not None:
            total += weight * BASE_CONFIDENCE[metric]
    return round(total, 3)

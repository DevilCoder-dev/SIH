// Stable identifiers for map layers. Used by the frontend layer registry/store and
// (later) by server-driven layer configuration. Kept here so both sides agree.

export const MAP_LAYER_IDS = {
  base: 'base',
  heatmap: 'stress-heatmap',
  hexagon: 'stress-hexagon',
  hotspots: 'stress-hotspots',
} as const;

export type MapLayerId = (typeof MAP_LAYER_IDS)[keyof typeof MAP_LAYER_IDS];

// The mutually exclusive data views rendered by the H3 layer. Every factor score is
// normalized to 0–100 by the API, so switching views never duplicates geometry.
export const STRESS_LAYER_KEYS = {
  esi: 'esi',
  noise: 'noise',
  density: 'density',
  heat: 'heat',
  aqi: 'aqi',
} as const;

export type StressLayerKey = (typeof STRESS_LAYER_KEYS)[keyof typeof STRESS_LAYER_KEYS];

export const STRESS_LAYER_LABELS: Record<StressLayerKey, string> = {
  esi: 'Combined ESI',
  noise: 'Noise',
  density: 'Crowding',
  heat: 'Heat',
  aqi: 'Air quality',
};

export const STRESS_LAYER_COLORS: Record<
  Exclude<StressLayerKey, 'esi'>,
  readonly [number, number, number]
> = {
  noise: [230, 126, 34],
  density: [155, 89, 182],
  heat: [231, 76, 60],
  aqi: [95, 110, 120],
};

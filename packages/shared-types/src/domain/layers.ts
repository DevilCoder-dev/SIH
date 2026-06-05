// Stable identifiers for map layers. Used by the frontend layer registry/store and
// (later) by server-driven layer configuration. Kept here so both sides agree.

export const MAP_LAYER_IDS = {
  base: 'base',
  heatmap: 'stress-heatmap',
  hexagon: 'stress-hexagon',
  hotspots: 'stress-hotspots',
} as const;

export type MapLayerId = (typeof MAP_LAYER_IDS)[keyof typeof MAP_LAYER_IDS];

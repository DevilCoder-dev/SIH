import { H3HexagonLayer } from '@deck.gl/geo-layers';
import type { PickingInfo } from '@deck.gl/core';
import {
  MAP_LAYER_IDS,
  STRESS_LAYER_COLORS,
  type RGBA,
  type StressLayerKey,
} from '@platform/shared-types';
import type { StressCell } from '@/lib/api/stress';
import { esiToColor } from '@/lib/map/esi';

const MISSING_COLOR: RGBA = [120, 130, 140, 35];

function factorColor(
  score: number | null | undefined,
  layer: Exclude<StressLayerKey, 'esi'>,
): RGBA {
  if (score == null) return MISSING_COLOR;
  const intensity = 0.12 + (0.88 * Math.max(0, Math.min(100, score))) / 100;
  const [r, g, b] = STRESS_LAYER_COLORS[layer];
  return [
    Math.round(255 - (255 - r) * intensity),
    Math.round(255 - (255 - g) * intensity),
    Math.round(255 - (255 - b) * intensity),
    210,
  ];
}

export function stressLayerValue(cell: StressCell, layer: StressLayerKey): number | null {
  return layer === 'esi' ? cell.esi : (cell.scores[layer] ?? null);
}

function stressLayerColor(cell: StressCell, layer: StressLayerKey): RGBA {
  return layer === 'esi' ? esiToColor(cell.esi) : factorColor(cell.scores[layer], layer);
}

// deck.gl H3 hexagon layer — the ESI heatmap. Geometry comes from each cell's H3 index
// (no GeoJSON); fill switches between combined ESI and the four normalized factor scores.
// `onSelect` fires on click (layer-level picking is more reliable than overlay-level).
export function createStressHexLayer(
  cells: StressCell[],
  onSelect: (cell: StressCell) => void,
  activeLayer: StressLayerKey,
): H3HexagonLayer<StressCell> {
  return new H3HexagonLayer<StressCell>({
    id: `${MAP_LAYER_IDS.hexagon}-${activeLayer}`,
    data: cells,
    getHexagon: (d) => d.h3,
    getFillColor: (d) => stressLayerColor(d, activeLayer),
    extruded: false,
    filled: true,
    stroked: false,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 80],
    opacity: 0.7,
    onClick: (info: PickingInfo) => {
      const cell = info.object as StressCell | undefined;
      if (cell) onSelect(cell);
    },
    updateTriggers: { getFillColor: activeLayer },
  });
}

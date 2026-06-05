import { H3HexagonLayer } from '@deck.gl/geo-layers';
import type { PickingInfo } from '@deck.gl/core';
import { MAP_LAYER_IDS } from '@platform/shared-types';
import type { StressCell } from '@/lib/api/stress';
import { esiToColor } from '@/lib/map/esi';

// deck.gl H3 hexagon layer — the ESI heatmap. Geometry comes from each cell's H3 index
// (no GeoJSON); fill comes from the ESI color ramp. `onSelect` fires on click (layer-level
// picking is more reliable than overlay-level).
export function createStressHexLayer(
  cells: StressCell[],
  onSelect: (cell: StressCell) => void,
): H3HexagonLayer<StressCell> {
  return new H3HexagonLayer<StressCell>({
    id: MAP_LAYER_IDS.hexagon,
    data: cells,
    getHexagon: (d) => d.h3,
    getFillColor: (d) => esiToColor(d.esi),
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
    updateTriggers: { getFillColor: cells },
  });
}

'use client';

import {
  esiBand,
  STRESS_LAYER_LABELS,
  STRESS_METRIC_LABELS,
  type StressLayerKey,
} from '@platform/shared-types';
import type { StressCell } from '@/lib/api/stress';
import { stressLayerValue } from '@/components/map/layers/stressHexLayer';

export interface HoverInfo {
  x: number;
  y: number;
  cell: StressCell;
}

const fmt = (v: number | null | undefined) => (v == null ? '—' : Math.round(v).toString());

// Hover card: locality name + ESI band + per-metric scores + confidence.
// A '—' score means that factor has no data (e.g. noise/density before ESP32 sensors).
export function StressTooltip({
  info,
  activeLayer,
}: {
  info: HoverInfo | null;
  activeLayer: StressLayerKey;
}) {
  if (!info) return null;
  const cell = info.cell;
  const band = esiBand(cell.esi);
  const s = cell.scores;
  const activeValue = stressLayerValue(cell, activeLayer);

  return (
    <div
      className="pointer-events-none absolute z-20 max-w-[220px] rounded-md border border-white/10 bg-neutral-900/95 px-3 py-2 text-xs text-white shadow-lg"
      style={{ left: info.x + 14, top: info.y + 14 }}
    >
      <div className="font-semibold">{cell.locality ?? 'Unknown area'}</div>
      <div className="mt-0.5">
        {STRESS_LAYER_LABELS[activeLayer]} <span className="font-semibold">{fmt(activeValue)}</span>
        /100
        {activeLayer === 'esi' ? ` · ${band.label}` : ''}
      </div>
      <div className="mt-1 text-neutral-300">
        {STRESS_METRIC_LABELS.noise} {fmt(s.noise)} · {STRESS_METRIC_LABELS.density}{' '}
        {fmt(s.density)}
        <br />
        {STRESS_METRIC_LABELS.heat} {fmt(s.heat)} · {STRESS_METRIC_LABELS.aqi} {fmt(s.aqi)}
        {cell.greenery != null && cell.greenery > 0 && (
          <>
            <br />
            Greenery relief {Math.round(cell.greenery * 100)}%
          </>
        )}
      </div>
      <div className="mt-1 text-neutral-400">
        Confidence {Math.round(cell.confidence * 100)}% · noise/crowd modeled
      </div>
    </div>
  );
}

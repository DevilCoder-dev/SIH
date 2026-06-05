'use client';

import { motion } from 'framer-motion';
import { esiBand } from '@platform/shared-types';
import { GREENERY, HEURISTICS } from '@/lib/heuristics';
import type { StressCell } from '@/lib/api/stress';

const rgba = (c: readonly number[]) => `rgb(${c[0]},${c[1]},${c[2]})`;

export function AreaDetails({ cell }: { cell: StressCell }) {
  const localityLabel = cell.locality ?? 'Unknown area';

  const band = esiBand(cell.esi);
  const present = HEURISTICS.filter((h) => cell.scores[h.key] != null);
  const driver = present.reduce<(typeof HEURISTICS)[number] | null>((top, h) => {
    const contrib = (cell.scores[h.key] ?? 0) * h.weight;
    const topContrib = top ? (cell.scores[top.key] ?? 0) * top.weight : -1;
    return contrib > topContrib ? h : top;
  }, null);

  return (
    <motion.div
      key={cell.h3}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      <div className="pr-6">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Area</p>
        <h2 className="text-base font-semibold leading-tight text-card-foreground">
          {localityLabel}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="flex h-16 w-16 flex-col items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: rgba(band.color) }}
        >
          <span className="text-2xl font-bold leading-none">{Math.round(cell.esi)}</span>
          <span className="text-[10px] opacity-90">/ 100</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-card-foreground">{band.label} stress</p>
          {driver && (
            <p className="text-xs text-muted-foreground">
              Mostly driven by <strong>{driver.label.toLowerCase()}</strong>
              {cell.greenery && cell.greenery > 0 ? '; greenery is helping' : ''}.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {HEURISTICS.map((h) => {
          const score = cell.scores[h.key];
          return (
            <div key={h.key}>
              <div className="flex justify-between text-xs">
                <span className="text-card-foreground">{h.label}</span>
                <span className="text-muted-foreground">
                  {score == null ? '—' : Math.round(score)}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: h.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${score ?? 0}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {cell.greenery != null && cell.greenery > 0 && (
        <div
          className="rounded-lg p-2 text-xs"
          style={{ backgroundColor: `${GREENERY.color}14`, color: GREENERY.color }}
        >
          🌳 Greenery here lowers the score by {Math.round(cell.greenery * 50)}%.
        </div>
      )}

      <p className="text-[11px] leading-snug text-muted-foreground">
        Confidence {Math.round(cell.confidence * 100)}% · noise &amp; crowding are modeled
        estimates (no live sensors yet). Score is for this ~150&nbsp;m hexagon, not an exact
        spot.
      </p>
    </motion.div>
  );
}

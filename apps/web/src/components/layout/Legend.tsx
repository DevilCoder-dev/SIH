'use client';

import { ESI_COLOR_RAMP } from '@platform/shared-types';

const rgba = (c: [number, number, number, number]) =>
  `rgba(${c[0]},${c[1]},${c[2]},${c[3] / 255})`;

// Color-ramp legend. The disclaimer is deliberate: ESI is a *regional* measure over H3
// cells, not point-level accuracy (see the ESI methodology).
export function Legend() {
  return (
    <div className="pointer-events-auto absolute bottom-6 left-4 z-10 rounded-lg border bg-card/90 p-3 shadow-sm backdrop-blur">
      <p className="mb-2 text-xs font-semibold text-card-foreground">
        Environmental Stress Index
      </p>
      <div className="flex flex-col gap-1">
        {ESI_COLOR_RAMP.map((band) => (
          <div key={band.label} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block h-3 w-4 rounded-sm"
              style={{ background: rgba(band.color) }}
            />
            <span className="text-muted-foreground">
              {band.min}–{band.max} · {band.label}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 max-w-[190px] text-[10px] leading-snug text-muted-foreground">
        Regional intensity over ~100–300m H3 cells — not point-level accuracy.
      </p>
    </div>
  );
}

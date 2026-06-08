'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { MAP_DEFAULTS } from '@/lib/map/config';
import { HEURISTICS } from '@/lib/heuristics';
import { Reveal } from '../ui/Reveal';

type Layer = 'esi' | 'noise' | 'density' | 'heat' | 'aqi';

interface Cell {
  q: number;
  r: number;
  cx: number;
  cy: number;
  noise: number;
  density: number;
  heat: number;
  aqi: number;
  esi: number;
  lat: number;
  lon: number;
}

const COLS = 13;
const ROWS = 9;
const R = 22;

function ramp(t: number): string {
  t = Math.max(0, Math.min(1, t));
  if (t < 0.34) return '#27ae60';
  if (t < 0.5) return '#7aa83a';
  if (t < 0.66) return '#e6b41e';
  if (t < 0.82) return '#e67e22';
  return '#c0392b';
}

const hc = (key: string) => HEURISTICS.find((h) => h.key === key)?.color ?? '#888';

const LAYER_META: Record<Layer, { label: string; color: string }> = {
  esi: { label: 'ESI', color: '#e6b41e' },
  noise: { label: 'Noise', color: hc('noise') },
  density: { label: 'Crowding', color: hc('density') },
  heat: { label: 'Heat', color: hc('heat') },
  aqi: { label: 'Air', color: hc('aqi') },
};

// Section 6. A real, interactive hex preview — hover any cell for its readout,
// toggle which signal colors the grid. Links through to the full live map.
export function MapPreview() {
  const [layer, setLayer] = useState<Layer>('esi');
  const [hover, setHover] = useState<Cell | null>(null);

  const cells = useMemo<Cell[]>(() => {
    const out: Cell[] = [];
    const w = Math.sqrt(3) * R;
    const h = R * 1.5;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cx = col * w + (row % 2 ? w / 2 : 0) + w;
        const cy = row * h + R;
        const dx = (col - COLS / 2) / COLS;
        const dy = (row - ROWS / 2) / ROWS;
        const d = Math.hypot(dx, dy);
        const n = (x: number) => Math.abs(Math.sin(col * x + row * (x + 1.3)));
        const noise = Math.min(1, 0.4 + n(2.1) * 0.5 - d * 0.3);
        const density = Math.min(1, Math.max(0, 1 - d * 1.7 + n(1.3) * 0.2));
        const heat = Math.min(1, 0.45 + n(0.7) * 0.4 - d * 0.2);
        const aqi = Math.min(1, 0.55 + (col / COLS) * 0.35 + n(0.4) * 0.1);
        const esi = Math.min(
          1,
          noise * 0.3 + density * 0.25 + heat * 0.2 + aqi * 0.25 - (1 - density) * 0.08,
        );
        out.push({
          q: col,
          r: row,
          cx,
          cy,
          noise,
          density,
          heat,
          aqi,
          esi,
          lat: MAP_DEFAULTS.latitude + (ROWS / 2 - row) * 0.012,
          lon: MAP_DEFAULTS.longitude + (col - COLS / 2) * 0.012,
        });
      }
    }
    return out;
  }, []);

  const hexPath = (cx: number, cy: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 180) * (60 * i - 90);
      return `${(cx + R * 0.92 * Math.cos(a)).toFixed(1)},${(cy + R * 0.92 * Math.sin(a)).toFixed(1)}`;
    }).join(' ');

  const vbW = COLS * Math.sqrt(3) * R + Math.sqrt(3) * R;
  const vbH = ROWS * R * 1.5 + R;

  return (
    <section id="map-preview" className="relative z-10 py-28">
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">06 · Map</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
              Explore it cell by cell.
            </h2>
          </div>
          <Link
            href="/map"
            className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.03]"
          >
            Open the live map
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </Reveal>

        <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-[#0a0b0d]/60 backdrop-blur-sm">
          {/* Toggles */}
          <div className="flex flex-wrap items-center gap-2 border-b border-white/10 p-3">
            <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">Layer</span>
            {(Object.keys(LAYER_META) as Layer[]).map((l) => (
              <button
                key={l}
                onClick={() => setLayer(l)}
                className="rounded-full border px-3 py-1 font-mono text-[11px] transition-colors"
                style={{
                  borderColor: layer === l ? LAYER_META[l].color : 'rgba(255,255,255,0.12)',
                  background: layer === l ? `${LAYER_META[l].color}22` : 'transparent',
                  color: layer === l ? '#fff' : 'rgba(255,255,255,0.55)',
                }}
              >
                {LAYER_META[l].label}
              </button>
            ))}
          </div>

          <div className="relative">
            <svg
              viewBox={`0 0 ${vbW} ${vbH}`}
              className="block w-full"
              onMouseLeave={() => setHover(null)}
              role="img"
              aria-label="Interactive hex preview of the Environmental Stress Index"
            >
              {cells.map((c) => {
                const v = c[layer];
                const fill = layer === 'esi' ? ramp(v) : LAYER_META[layer].color;
                return (
                  <polygon
                    key={`${c.q}-${c.r}`}
                    points={hexPath(c.cx, c.cy)}
                    fill={fill}
                    fillOpacity={layer === 'esi' ? 0.9 : 0.25 + v * 0.7}
                    stroke={hover === c ? '#fff' : 'rgba(0,0,0,0.35)'}
                    strokeWidth={hover === c ? 2 : 1}
                    onMouseEnter={() => setHover(c)}
                    style={{ cursor: 'pointer', transition: 'fill-opacity .2s' }}
                  />
                );
              })}
            </svg>

            {/* Hover readout */}
            <div className="pointer-events-none absolute right-3 top-3 w-52 rounded-lg border border-white/15 bg-[#0a0b0d]/90 p-3 font-mono text-[11px] backdrop-blur">
              {hover ? (
                <>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-white/50">CELL {hover.q}·{hover.r}</span>
                    <span className="rounded px-1.5 py-0.5 text-black" style={{ background: ramp(hover.esi) }}>
                      ESI {Math.round(hover.esi * 100)}
                    </span>
                  </div>
                  <div className="text-white/45">
                    {hover.lat.toFixed(3)}°N {hover.lon.toFixed(3)}°E
                  </div>
                  <dl className="mt-2 space-y-1">
                    {([
                      ['Noise', hover.noise, hc('noise')],
                      ['Crowd', hover.density, hc('density')],
                      ['Heat', hover.heat, hc('heat')],
                      ['Air', hover.aqi, hc('aqi')],
                    ] as const).map(([k, val, col]) => (
                      <div key={k} className="flex items-center gap-2">
                        <span className="w-10 text-white/45">{k}</span>
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                          <span className="block h-full rounded-full" style={{ width: `${val * 100}%`, background: col }} />
                        </span>
                        <span className="w-6 text-right text-white/55">{Math.round(val * 100)}</span>
                      </div>
                    ))}
                  </dl>
                </>
              ) : (
                <span className="text-white/40">Hover a cell for its readout</span>
              )}
            </div>
          </div>
        </div>
        <p className="mt-3 font-mono text-[10px] text-white/35">
          Preview is illustrative · the live map serves real ingested cells from /stress/cells.
        </p>
      </div>
    </section>
  );
}

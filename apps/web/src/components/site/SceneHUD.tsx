'use client';

import { useEffect, useRef, useState } from 'react';
import { MAP_DEFAULTS } from '@/lib/map/config';

const SCENES = [
  'HERO',
  'SIGNALS',
  'IMPACT',
  'INDEX',
  'PIPELINE',
  'MAP',
  'EVIDENCE',
  'DEPLOY',
];

/**
 * Fixed technical chrome over the canvas — coordinate readout, a live scene
 * label tied to scroll, and the ESI legend. Decorative but honest: the
 * coordinates are the real Delhi NCR map center.
 */
export function SceneHUD() {
  const [pct, setPct] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const on = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setPct(max > 0 ? window.scrollY / max : 0);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, []);

  const scene = SCENES[Math.min(SCENES.length - 1, Math.floor(pct * SCENES.length))];
  const lat = MAP_DEFAULTS.latitude.toFixed(4);
  const lon = MAP_DEFAULTS.longitude.toFixed(4);

  return (
    <div className="pointer-events-none fixed inset-0 z-30 hidden md:block" aria-hidden>
      {/* Top-left coordinate readout */}
      <div className="absolute left-8 top-20 font-mono text-[10px] leading-relaxed tracking-wider text-white/40">
        <div className="text-white/55">DELHI NCR · H3 r8</div>
        <div>
          {lat}°N {lon}°E
        </div>
        <div>SCENE · {scene}</div>
      </div>

      {/* Right scroll-progress rail */}
      <div className="absolute right-8 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2">
        <span className="font-mono text-[9px] tracking-widest text-white/35">ESI</span>
        <div className="relative h-40 w-[3px] overflow-hidden rounded-full bg-white/10">
          <div
            ref={barRef}
            className="absolute inset-x-0 top-0 rounded-full bg-gradient-to-b from-emerald-400 via-amber-300 to-rose-500"
            style={{ height: `${Math.round(pct * 100)}%` }}
          />
        </div>
        <span className="font-mono text-[9px] tabular-nums text-white/45">
          {String(Math.round(pct * 100)).padStart(2, '0')}
        </span>
      </div>

      {/* Bottom-left legend */}
      <div className="absolute bottom-7 left-8 flex items-center gap-3 font-mono text-[10px] tracking-wider text-white/45">
        <span>LOW</span>
        <span className="h-1.5 w-28 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-600" />
        <span>HIGH BURDEN</span>
      </div>
    </div>
  );
}

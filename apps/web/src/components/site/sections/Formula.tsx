'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import anime from 'animejs';
import { HEURISTICS, GREENERY } from '@/lib/heuristics';
import { Reveal } from '../ui/Reveal';

// Local green→amber→red ramp so the sample cell needs no map import.
function esiColor(v: number): { hex: string; band: string } {
  const t = Math.max(0, Math.min(100, v)) / 100;
  if (t < 0.34) return { hex: '#27ae60', band: 'Calm' };
  if (t < 0.5) return { hex: '#7aa83a', band: 'Low' };
  if (t < 0.66) return { hex: '#e6b41e', band: 'Moderate' };
  if (t < 0.82) return { hex: '#e67e22', band: 'Elevated' };
  return { hex: '#c0392b', band: 'High burden' };
}

interface Slider {
  key: string;
  label: string;
  color: string;
  weight: number;
  value: number; // 0–100 input
}

const INITIAL: Slider[] = HEURISTICS.map((h, i) => ({
  key: h.key,
  label: h.label,
  color: h.color,
  weight: h.weight,
  value: [78, 64, 70, 82][i] ?? 60,
}));

// Section 4. The published ESI formula, made tangible: drag each factor chip to
// change its 0–100 input; the sample cell recomputes live. Greenery subtracts.
export function Formula() {
  const [sliders, setSliders] = useState<Slider[]>(INITIAL);
  const [green, setGreen] = useState(20);
  const cellRef = useRef<HTMLDivElement>(null);

  const esi = useMemo(() => {
    const sum = sliders.reduce((acc, s) => acc + s.weight * s.value, 0);
    return Math.max(0, Math.min(100, sum - green * 0.25));
  }, [sliders, green]);

  const { hex, band } = esiColor(esi);

  const bump = useCallback(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    anime({ targets: cellRef.current, scale: [1.04, 1], duration: 420, easing: 'easeOutElastic(1, .6)' });
  }, []);

  const setValue = (key: string, value: number) => {
    setSliders((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));
    bump();
  };

  return (
    <section id="formula" className="relative z-10 py-28">
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
        <Reveal className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">04 · The index</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
            One transparent formula. No black box.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/60">
            The Environmental Stress Index is a published weighted sum — drag a factor to see the cell
            respond. It is not a trained model, and not human stress.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          {/* Builder */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
            <div className="space-y-5">
              {sliders.map((s) => (
                <DragChip key={s.key} slider={s} onChange={(v) => setValue(s.key, v)} />
              ))}

              {/* Greenery discount */}
              <div className="border-t border-white/10 pt-5">
                <DragChip
                  slider={{ key: 'green', label: GREENERY.label, color: GREENERY.color, weight: -0.25, value: green }}
                  onChange={(v) => {
                    setGreen(v);
                    bump();
                  }}
                  subtractive
                />
              </div>
            </div>

            {/* Equation row */}
            <div className="mt-7 flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
              <span className="text-white/45">ESI =</span>
              {sliders.map((s, i) => (
                <span key={s.key} className="flex items-center gap-1.5">
                  <span className="rounded px-2 py-0.5 font-medium text-black" style={{ background: s.color }}>
                    {Math.round(s.weight * 100)}%·{s.label}
                  </span>
                  {i < sliders.length - 1 && <span className="text-white/35">+</span>}
                </span>
              ))}
              <span className="text-white/35">−</span>
              <span className="rounded px-2 py-0.5 font-medium text-black" style={{ background: GREENERY.color }}>
                greenery
              </span>
            </div>
          </div>

          {/* Live sample cell */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Sample cell · H3</p>
            <div
              ref={cellRef}
              className="mt-6 grid h-40 w-40 place-items-center transition-colors duration-300 [clip-path:polygon(25%_2%,75%_2%,98%_50%,75%_98%,25%_98%,2%_50%)]"
              style={{ background: hex, boxShadow: `0 0 60px ${hex}55` }}
            >
              <span className="text-4xl font-semibold text-black/85 tabular-nums">{Math.round(esi)}</span>
            </div>
            <p className="mt-6 font-mono text-sm" style={{ color: hex }}>
              {band}
            </p>
            <p className="mt-1 font-mono text-[10px] text-white/40">ESI 0–100</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** A draggable/tappable factor chip. Pointer-drag sets the 0–100 value; keyboard
 *  arrows work too. Spring feedback via Anime.js on the parent cell. */
function DragChip({
  slider,
  onChange,
  subtractive = false,
}: {
  slider: Slider;
  onChange: (value: number) => void;
  subtractive?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const fromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    onChange(Math.round(Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * 100));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    fromClientX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.buttons !== 1) return;
    fromClientX(e.clientX);
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-white/80">
          <span className="h-2 w-2 rounded-full" style={{ background: slider.color }} />
          {slider.label}
          <span className="font-mono text-[10px] text-white/40">
            {subtractive ? '−' : ''}
            {Math.abs(Math.round(slider.weight * 100))}%
          </span>
        </span>
        <span className="font-mono text-white/55 tabular-nums">{slider.value}</span>
      </div>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={`${slider.label} input value`}
        aria-valuenow={slider.value}
        aria-valuemin={0}
        aria-valuemax={100}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') onChange(Math.min(100, slider.value + 4));
          if (e.key === 'ArrowLeft') onChange(Math.max(0, slider.value - 4));
        }}
        className="relative h-7 cursor-ew-resize touch-none select-none rounded-full bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-100"
          style={{ width: `${slider.value}%`, background: `${slider.color}55` }}
        />
        <div
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80 shadow-lg transition-[left] duration-100"
          style={{ left: `${slider.value}%`, background: slider.color }}
        />
      </div>
    </div>
  );
}

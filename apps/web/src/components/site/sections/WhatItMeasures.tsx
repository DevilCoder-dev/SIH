'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FACTORS } from '@/lib/evocomb/factors';
import { Reveal } from '../ui/Reveal';

// Section 2. The four signals emerge in the shared 3D field; here each one
// activates in sequence as you scroll, with its real source + limitation.
export function WhatItMeasures() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top center',
      end: 'bottom center',
      scrub: true,
      onUpdate: (self) => setActive(Math.min(FACTORS.length - 1, Math.floor(self.progress * FACTORS.length))),
    });
    return () => st.kill();
  }, []);

  return (
    <section id="measure" ref={ref} className="relative z-10 min-h-[180vh] py-28">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 md:grid-cols-[0.85fr_1.15fr] md:px-8">
        {/* Sticky intro */}
        <div className="md:sticky md:top-24 md:h-fit">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">02 · Signals</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
              Four signals, measured separately.
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/60">
              Each layer is scored 0–100 on its own terms before anything is combined. Some are
              sensor-grade; some are open-data proxies. We say which.
            </p>
          </Reveal>

          <div className="mt-8 flex gap-1.5">
            {FACTORS.map((f, i) => (
              <span
                key={f.key}
                className="h-1 flex-1 rounded-full transition-all duration-500"
                style={{ background: i <= active ? f.color : 'rgba(255,255,255,0.12)' }}
              />
            ))}
          </div>
        </div>

        {/* Factor cards */}
        <div className="flex flex-col gap-4">
          {FACTORS.map((f, i) => {
            const on = i === active;
            return (
              <article
                key={f.key}
                className="rounded-2xl border p-6 transition-all duration-500 md:p-7"
                style={{
                  borderColor: on ? `${f.color}66` : 'rgba(255,255,255,0.08)',
                  background: on ? `${f.color}10` : 'rgba(255,255,255,0.015)',
                  opacity: on ? 1 : 0.5,
                  transform: on ? 'translateY(0)' : 'translateY(2px)',
                }}
              >
                <header className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: f.color }} />
                    <h3 className="text-lg font-semibold text-white">{f.label}</h3>
                  </div>
                  <span className="font-mono text-xs text-white/45">
                    {Math.round(f.weight * 100)}% · {f.unit}
                  </span>
                </header>
                <p className="mt-3 text-[15px] leading-relaxed text-white/75">{f.measures}</p>
                <dl className="mt-4 grid gap-x-6 gap-y-2 border-t border-white/10 pt-4 font-mono text-[11px] sm:grid-cols-2">
                  <div>
                    <dt className="text-white/40">SOURCE</dt>
                    <dd className="text-white/65">{f.source}</dd>
                  </div>
                  <div>
                    <dt className="text-white/40">PRECISION</dt>
                    <dd className="text-white/65">{f.precision}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-white/40">LIMITATION</dt>
                    <dd className="text-amber-200/70">{f.limitation}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

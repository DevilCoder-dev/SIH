'use client';

import { useEffect, useRef } from 'react';
import anime from 'animejs';
import { Database, SlidersHorizontal, Scale, Hexagon } from 'lucide-react';
import { Reveal } from '../ui/Reveal';

const STEPS = [
  {
    icon: Database,
    label: 'Collect',
    detail: 'Open-Meteo AQI, MET Norway heat, OSM roads & POIs — pulled per ingest.',
  },
  { icon: SlidersHorizontal, label: 'Normalize', detail: 'Each raw signal mapped to a comparable 0–100 score.' },
  { icon: Scale, label: 'Weight', detail: 'Blended by published weights; greenery subtracts.' },
  { icon: Hexagon, label: 'Aggregate', detail: 'Rolled up to H3 r8 hexagonal cells for the map.' },
];

// Section 5. Collect → Normalize → Weight → Aggregate as a self-drawing flow.
// The connector draws with Anime.js (SVG stroke), then data packets stream
// along it; nodes stagger in.
export function Pipeline() {
  const ref = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const root = ref.current;
    const path = pathRef.current;
    if (!root || !path) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;

    if (reduced) {
      path.style.strokeDashoffset = '0';
      return;
    }
    path.style.strokeDashoffset = `${len}`;

    const tl = anime.timeline({ autoplay: false });
    tl.add({ targets: path, strokeDashoffset: [len, 0], duration: 1300, easing: 'easeInOutSine' }).add(
      {
        targets: root.querySelectorAll('.pipe-node'),
        opacity: [0, 1],
        translateY: [14, 0],
        delay: anime.stagger(140),
        duration: 620,
        easing: 'easeOutCubic',
      },
      '-=900',
    );

    let packets: anime.AnimeInstance | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          tl.play();
          packets = anime({
            targets: root.querySelectorAll('.packet'),
            translateX: [0, root.querySelector('.pipe-track')!.clientWidth - 16],
            opacity: [{ value: [0, 1], duration: 200 }, { value: 1, duration: 1600 }, { value: 0, duration: 200 }],
            delay: anime.stagger(700),
            duration: 2000,
            loop: true,
            easing: 'linear',
          });
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(root);

    return () => {
      io.disconnect();
      tl.pause();
      packets?.pause();
    };
  }, []);

  return (
    <section id="pipeline" ref={ref} className="relative z-10 py-28">
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
        <Reveal className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">05 · Pipeline</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
            From raw feeds to a hex grid.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/60">
            Reproducible and open at every stage — the same path every cell takes, every ingest.
          </p>
        </Reveal>

        <div className="pipe-track relative mt-16">
          {/* Self-drawing connector (desktop) */}
          <svg
            className="pointer-events-none absolute inset-x-0 top-7 hidden h-3 w-full md:block"
            viewBox="0 0 1000 12"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              ref={pathRef}
              d="M 12 6 L 988 6"
              fill="none"
              stroke="url(#pipegrad)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="pipegrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#27ae60" />
                <stop offset="0.5" stopColor="#e6b41e" />
                <stop offset="1" stopColor="#c0392b" />
              </linearGradient>
            </defs>
          </svg>

          {/* Traveling data packets (desktop) */}
          <div className="pointer-events-none absolute left-0 top-[26px] hidden h-3 w-full md:block" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="packet absolute left-0 top-0 h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
              />
            ))}
          </div>

          <ol className="grid gap-4 md:grid-cols-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <li
                  key={s.label}
                  className="pipe-node rounded-2xl border border-white/10 bg-[#0a0b0d]/70 p-5 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 bg-white/5">
                      <Icon className="h-4 w-4 text-white/80" />
                    </span>
                    <span className="font-mono text-[10px] text-white/40">0{i + 1}</span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">{s.label}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{s.detail}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

'use client';

import { HEALTH_IMPACTS } from '@/lib/landing/research';
import { HEURISTICS } from '@/lib/heuristics';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { Reveal } from '../ui/Reveal';

const byKey = (key: string) => HEURISTICS.find((h) => h.key === key)?.color ?? '#e74c3c';
const COLOR: Record<string, string> = {
  Noise: byKey('noise'),
  'Air pollution': byKey('aqi'),
  Heat: byKey('heat'),
};

// Section 3. Three sourced "data callouts" — large animated figures, not
// paragraphs. Each carries its citation inline so the claim is checkable.
export function WhyItMatters() {
  return (
    <section id="evidence-why" className="relative z-10 py-28">
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
        <Reveal className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">03 · Why it matters</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
            These signals carry measurable cost.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] md:grid-cols-3">
          {HEALTH_IMPACTS.map((im) => {
            const c = COLOR[im.factor] ?? '#e74c3c';
            return (
              <article key={im.factor} className="flex flex-col bg-[#0a0b0d]/85 p-7">
                <div className="mb-5 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: c }} />
                  <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/50">
                    {im.factor}
                  </span>
                </div>

                <div className="text-5xl font-semibold tracking-tight text-white md:text-6xl" style={{ color: c }}>
                  <AnimatedNumber
                    value={im.value}
                    decimals={im.decimals ?? 0}
                    prefix={im.prefix ?? ''}
                    suffix={im.suffix ?? ''}
                  />
                </div>

                <p className="mt-4 text-[15px] leading-relaxed text-white/75">{im.caption}</p>

                <a
                  href={im.citation.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-auto pt-6 font-mono text-[11px] leading-relaxed text-white/40 transition-colors hover:text-white/70"
                >
                  {im.citation.authors} · {im.citation.journal} ({im.citation.year}) ↗
                </a>
              </article>
            );
          })}
        </div>

        <Reveal className="mt-6">
          <p className="font-mono text-[11px] text-white/40">
            Built for planning, research and public-health context — not diagnosis.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

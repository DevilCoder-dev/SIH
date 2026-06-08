'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '#measure', label: 'Signals' },
  { href: '#evidence-why', label: 'Why' },
  { href: '#formula', label: 'Index' },
  { href: '#pipeline', label: 'Pipeline' },
  { href: '#evidence', label: 'Evidence' },
];

export function SiteNav() {
  const [solid, setSolid] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <header
      ref={ref}
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        solid ? 'border-b border-white/10 bg-[#0a0b0d]/80 backdrop-blur-md' : 'border-b border-transparent',
      )}
    >
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-5 w-5 place-items-center">
            <span className="h-3 w-3 rotate-12 bg-gradient-to-br from-emerald-400 via-amber-300 to-rose-500 [clip-path:polygon(25%_0,75%_0,100%_50%,75%_100%,25%_100%,0_50%)]" />
          </span>
          <span className="font-mono text-[13px] font-semibold tracking-tight text-white">EvoComb</span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-white/35 sm:inline">
            / ESI
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/55 transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </div>

        <Link
          href="/map"
          className="group inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-[12px] font-semibold text-black transition-transform hover:scale-[1.03]"
        >
          Live map
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </nav>
    </header>
  );
}

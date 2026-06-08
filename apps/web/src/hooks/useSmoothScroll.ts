'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let registered = false;

/**
 * Sets up Lenis smooth scrolling and drives GSAP's ScrollTrigger from it, so
 * pinned/scrubbed scene timelines stay perfectly in sync with the smoothed
 * scroll position. Honors reduced-motion by skipping Lenis entirely (native
 * scroll) while still keeping ScrollTrigger live.
 */
export function useSmoothScroll(reducedMotion: boolean) {
  useEffect(() => {
    if (!registered) {
      gsap.registerPlugin(ScrollTrigger);
      registered = true;
    }

    if (reducedMotion) {
      ScrollTrigger.refresh();
      return () => ScrollTrigger.getAll().forEach((t) => t.kill());
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const onRaf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onRaf);
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(onRaf);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [reducedMotion]);
}

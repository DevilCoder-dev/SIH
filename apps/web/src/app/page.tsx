import { LandingNav } from '@/components/landing/LandingNav';
import { Hero } from '@/components/landing/Hero';
import { WhatIsStress } from '@/components/landing/WhatIsStress';
import { HealthImpacts } from '@/components/landing/HealthImpacts';
import { CinematicReveal } from '@/components/landing/CinematicReveal';
import { Methodology } from '@/components/landing/Methodology';
import { DataSources } from '@/components/landing/DataSources';
import { Precision } from '@/components/landing/Precision';
import { Audiences } from '@/components/landing/Audiences';
import { DemoHeatmap } from '@/components/landing/DemoHeatmap';
import { Research } from '@/components/landing/Research';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';

// Research-grade landing experience. The live map lives at /map.
export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0a0b0d] text-white antialiased">
      <LandingNav />
      <Hero />
      <WhatIsStress />
      <HealthImpacts />
      <CinematicReveal />
      <Methodology />
      <DataSources />
      <Precision />
      <Audiences />
      <DemoHeatmap />
      <Research />
      <FinalCTA />
      <Footer />
    </main>
  );
}

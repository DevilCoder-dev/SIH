'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import { MAP_LAYER_IDS } from '@platform/shared-types';
import { Button } from '@/components/ui/button';
import { useMapStore } from '@/stores/map-store';

// Floating UI shell above the map: title, ESI heatmap toggle, and a button that opens the
// plain-language explainer popup.
export function MapChrome() {
  const hexVisible = useMapStore((s) => s.visibleLayers[MAP_LAYER_IDS.hexagon]);
  const toggleLayer = useMapStore((s) => s.toggleLayer);
  const toggleExplainer = useMapStore((s) => s.toggleExplainer);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="pointer-events-none absolute left-4 top-4 z-10"
    >
      <div className="pointer-events-auto rounded-lg border bg-card/90 px-4 py-3 shadow-sm backdrop-blur">
        <Link
          href="/"
          className="text-sm font-semibold text-card-foreground hover:underline"
        >
          ← EvoComb
        </Link>
        <p className="text-xs text-muted-foreground">
          Urban environmental stress · Delhi NCR
        </p>
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            variant={hexVisible ? 'default' : 'outline'}
            onClick={() => toggleLayer(MAP_LAYER_IDS.hexagon)}
          >
            {hexVisible ? 'Hide' : 'Show'} heatmap
          </Button>
          <Button size="sm" variant="outline" onClick={toggleExplainer}>
            <HelpCircle className="h-4 w-4" />
            How it works
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

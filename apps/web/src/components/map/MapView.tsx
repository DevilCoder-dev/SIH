'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { PickingInfo } from '@deck.gl/core';
import { MAP_LAYER_IDS } from '@platform/shared-types';
import { MAP_DEFAULTS } from '@/lib/map/config';
import { useMapStore } from '@/stores/map-store';
import { useStressCells } from '@/hooks/useStressCells';
import type { StressCell } from '@/lib/api/stress';
import { createStressHexLayer } from '@/components/map/layers/stressHexLayer';
import { StressTooltip, type HoverInfo } from '@/components/map/StressTooltip';

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const [hover, setHover] = useState<HoverInfo | null>(null);

  const setViewport = useMapStore((s) => s.setViewport);
  const setBounds = useMapStore((s) => s.setBounds);
  const setSelectedCell = useMapStore((s) => s.setSelectedCell);
  const hexVisible = useMapStore((s) => s.visibleLayers[MAP_LAYER_IDS.hexagon]);

  const { data } = useStressCells();
  const cells = useMemo(() => data?.cells ?? [], [data]);

  // Create the map + overlay once.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = new maplibregl.Map({
      container,
      style: MAP_DEFAULTS.styleUrl,
      center: [MAP_DEFAULTS.longitude, MAP_DEFAULTS.latitude],
      zoom: MAP_DEFAULTS.zoom,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.on('error', (e) => console.error('[MapLibre]', e.error?.message ?? e.error ?? e));
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    const overlay = new MapboxOverlay({
      interleaved: false,
      layers: [],
      onHover: (info: PickingInfo) => {
        const cell = info.object as StressCell | undefined;
        setHover(cell ? { x: info.x, y: info.y, cell } : null);
      },
    });
    overlayRef.current = overlay;
    map.addControl(overlay as unknown as maplibregl.IControl);

    const syncView = () => {
      const c = map.getCenter();
      const b = map.getBounds();
      setViewport({ longitude: c.lng, latitude: c.lat, zoom: map.getZoom() });
      setBounds({
        minLng: b.getWest(),
        minLat: b.getSouth(),
        maxLng: b.getEast(),
        maxLat: b.getNorth(),
      });
    };
    map.on('load', () => {
      map.resize();
      syncView();
    });
    map.on('moveend', syncView);

    return () => {
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
    };
  }, [setViewport, setBounds, setSelectedCell]);

  // Update deck layers when data or visibility changes.
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const layers =
      hexVisible && cells.length > 0 ? [createStressHexLayer(cells, setSelectedCell)] : [];
    overlay.setProps({ layers });
  }, [cells, hexVisible, setSelectedCell]);

  return (
    <>
      <div
        ref={containerRef}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />
      <StressTooltip info={hover} />
    </>
  );
}

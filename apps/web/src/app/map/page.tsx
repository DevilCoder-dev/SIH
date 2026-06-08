import { MapView } from '@/components/map/MapView';
import { MapChrome } from '@/components/layout/MapChrome';
import { Legend } from '@/components/layout/Legend';
import { Sidebar } from '@/components/layout/Sidebar';
import { SplashScreen } from '@/components/layout/SplashScreen';

// The live map dashboard. The research landing lives at `/`.
// `dark` puts the chrome (panels, legend, sidebar) on the same dark research-grade theme as
// the landing, matched to the dark CARTO basemap.
export default function MapPage() {
  return (
    <main className="dark fixed inset-0 overflow-hidden bg-[#0a0b0d] text-foreground">
      <MapView />
      <MapChrome />
      <Legend />
      <Sidebar />
      <SplashScreen />
    </main>
  );
}

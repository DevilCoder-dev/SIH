import { MapView } from '@/components/map/MapView';
import { MapChrome } from '@/components/layout/MapChrome';
import { Legend } from '@/components/layout/Legend';
import { Sidebar } from '@/components/layout/Sidebar';

// Map-first: the root route is the map. UI chrome floats above it.
export default function HomePage() {
  return (
    <main className="absolute inset-0 overflow-hidden">
      <MapView />
      <MapChrome />
      <Legend />
      <Sidebar />
    </main>
  );
}

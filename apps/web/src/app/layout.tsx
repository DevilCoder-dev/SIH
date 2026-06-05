import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'EvoComb · Urban Environmental Stress',
  description: 'EvoComb — geospatial mapping of urban environmental stress across Delhi NCR.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div id="app-root">{children}</div>
        </Providers>
      </body>
    </html>
  );
}

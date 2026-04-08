'use client';

import { useEffect } from 'react';

export default function LeafletProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    import('leaflet/dist/leaflet.css');
  }, []);

  return <>{children}</>;
}
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface LeafletContextType {
  isLoaded: boolean;
}

const LeafletContext = createContext<LeafletContextType>({ isLoaded: false });

export function LeafletProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Dynamically load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);

    // Load marker cluster CSS
    const clusterLink = document.createElement('link');
    clusterLink.rel = 'stylesheet';
    clusterLink.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
    clusterLink.integrity = 'sha256-SHSAuKNQlVs/a8Wl/w7h8GnWljzj0Fw+dZOPEFGPpLc=';
    clusterLink.crossOrigin = '';
    document.head.appendChild(clusterLink);

    const clusterDefaultLink = document.createElement('link');
    clusterDefaultLink.rel = 'stylesheet';
    clusterDefaultLink.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
    clusterDefaultLink.integrity = 'sha256-7y4r8KNSKGKUyhNcRKq+JvJYXgUJPnXxVZlMkT7OJKE=';
    clusterDefaultLink.crossOrigin = '';
    document.head.appendChild(clusterDefaultLink);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <LeafletContext.Provider value={{ isLoaded }}>
      {children}
    </LeafletContext.Provider>
  );
}

export function useLeaflet() {
  return useContext(LeafletContext);
}

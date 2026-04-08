'use client';

import { useEffect, useRef } from 'react';
import { Client, CLIENT_STATUS_COLORS } from '@/types';
import { useLeaflet } from './LeafletProvider';

interface InteractiveMapProps {
  clients: Client[];
  height?: string;
  onMarkerClick?: (client: Client) => void;
  center?: [number, number];
  zoom?: number;
}

declare global {
  interface Window {
    L: any;
  }
}

export default function InteractiveMap({
  clients,
  height = 'h-[600px]',
  onMarkerClick,
  center = [-14.235004, -51.92528], // Centro do Brasil
  zoom = 4,
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletInstance = useRef<any>(null);
  const markersInstance = useRef<any>(null);
  const { isLoaded } = useLeaflet();

  useEffect(() => {
    if (!isLoaded || !mapRef.current || leafletInstance.current) return;

    // Initialize map
    leafletInstance.current = window.L.map(mapRef.current).setView(center, zoom);

    // Add OpenStreetMap tiles
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(leafletInstance.current);

    // Initialize marker cluster group
    markersInstance.current = window.L.markerClusterGroup();

    return () => {
      if (leafletInstance.current) {
        leafletInstance.current.remove();
        leafletInstance.current = null;
      }
    };
  }, [isLoaded, center, zoom]);

  useEffect(() => {
    if (!leafletInstance.current || !markersInstance.current) return;

    // Clear existing markers
    markersInstance.current.clearLayers();

    // Add markers for clients with coordinates
    clients.forEach((client) => {
      if (client.latitude && client.longitude) {
        const color = CLIENT_STATUS_COLORS[client.status] || '#6b7280';
        
        // Create custom icon with color based on status
        const icon = window.L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              background-color: ${color};
              width: 20px;
              height: 20px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            "></div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const marker = window.L.marker([client.latitude, client.longitude], { icon });
        
        // Popup content
        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 8px; color: #1f2937;">${client.name}</h3>
            <p style="margin-bottom: 4px;"><strong>Status:</strong> ${client.status}</p>
            <p style="margin-bottom: 4px;"><strong>Prioridade:</strong> ${client.priority}</p>
            ${client.phone ? `<p style="margin-bottom: 4px;"><strong>Tel:</strong> ${client.phone}</p>` : ''}
            ${client.city ? `<p style="margin-bottom: 4px;"><strong>Cidade:</strong> ${client.city}/${client.state}</p>` : ''}
            ${client.address ? `<p style="margin-bottom: 4px;"><strong>Endereço:</strong> ${client.address}${client.number ? ', ' + client.number : ''}</p>` : ''}
          </div>
        `;

        marker.bindPopup(popupContent);
        
        // Click handler
        if (onMarkerClick) {
          marker.on('click', () => onMarkerClick(client));
        }

        markersInstance.current.addLayer(marker);
      }
    });

    // Add marker cluster group to map
    leafletInstance.current.addLayer(markersInstance.current);

    // Fit bounds if there are markers
    if (clients.some(c => c.latitude && c.longitude)) {
      const validClients = clients.filter(c => c.latitude && c.longitude);
      if (validClients.length > 0) {
        const bounds = validClients.map(c => [c.latitude!, c.longitude!]);
        leafletInstance.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [clients, onMarkerClick]);

  if (!isLoaded) {
    return (
      <div className={`${height} flex items-center justify-center bg-dark-800 rounded-lg`}>
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-dark-300">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${height} w-full rounded-lg overflow-hidden border border-dark-700`}>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}

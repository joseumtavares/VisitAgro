'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Client } from '@/types';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const mockClients: Client[] = [
  { id: '1', name: 'Fazenda Santa Clara', status: 'active', latitude: -23.5505, longitude: -46.6333, company_id: '1' },
  { id: '2', name: 'Agropecuária Boa Vista', status: 'prospect', latitude: -23.5605, longitude: -46.6433, company_id: '1' },
  { id: '3', name: 'Sítio Esperança', status: 'inactive', latitude: -23.5405, longitude: -46.6233, company_id: '1' },
  { id: '4', name: 'Granja Sol Nascente', status: 'blocked', latitude: -23.5705, longitude: -46.6533, company_id: '1' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return '#10b981';
    case 'prospect': return '#3b82f6';
    case 'inactive': return '#6b7280';
    case 'blocked': return '#ef4444';
    default: return '#6b7280';
  }
};

export default function InteractiveMap() {
  const [clients] = useState<Client[]>(mockClients);

  return (
    <MapContainer 
      center={[-23.5505, -46.6333]} 
      zoom={13} 
      style={{ height: '100%', width: '100%' }}
      className="bg-dark-900"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {clients.map((client) => (
        client.latitude && client.longitude && (
          <CircleMarker
            key={client.id}
            center={[client.latitude, client.longitude]}
            radius={10}
            fillColor={getStatusColor(client.status)}
            color="#fff"
            weight={2}
            opacity={1}
            fillOpacity={0.8}
          >
            <Popup>
              <div className="text-dark-900">
                <h3 className="font-bold">{client.name}</h3>
                <p className="text-sm capitalize">Status: {client.status}</p>
              </div>
            </Popup>
          </CircleMarker>
        )
      ))}
    </MapContainer>
  );
}
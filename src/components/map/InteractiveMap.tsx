'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Definição dos tipos baseados no Schema Real
type ClientStatus = 'interessado' | 'visitado' | 'agendado' | 'comprou' | 'naointeressado' | 'retornar' | 'outro';

interface Client {
  id: string;
  name: string;
  status: ClientStatus;
  lat?: number;
  lng?: number;
  workspace?: string;
}

// Fix para ícones do Leaflet no Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Dados Mockados atualizados com os statuses do Schema
const mockClients: Client[] = [
  { id: '1', name: 'Fazenda Santa Clara', status: 'interessado', lat: -23.5505, lng: -46.6333, workspace: 'principal' },
  { id: '2', name: 'Agropecuária Boa Vista', status: 'visitado', lat: -23.5605, lng: -46.6433, workspace: 'principal' },
  { id: '3', name: 'Sítio Esperança', status: 'agendado', lat: -23.5405, lng: -46.6233, workspace: 'principal' },
  { id: '4', name: 'Granja Sol Nascente', status: 'comprou', lat: -23.5705, lng: -46.6533, workspace: 'principal' },
  { id: '5', name: 'Recanto da Paz', status: 'naointeressado', lat: -23.5305, lng: -46.6133, workspace: 'principal' },
  { id: '6', name: 'Vale Verde', status: 'retornar', lat: -23.5805, lng: -46.6633, workspace: 'principal' },
];

const getStatusColor = (status: ClientStatus): string => {
  switch (status) {
    case 'interessado': return '#3b82f6'; // Azul (Prospect)
    case 'visitado': return '#10b981';   // Verde (Active)
    case 'agendado': return '#f59e0b';   // Laranja (Scheduled)
    case 'comprou': return '#8b5cf6';    // Roxo (Client)
    case 'naointeressado': return '#6b7280'; // Cinza (Inactive)
    case 'retornar': return '#ef4444';   // Vermelho (Return/Blocked)
    case 'outro': return '#9ca3af';      // Cinza claro
    default: return '#6b7280';
  }
};

const getStatusLabel = (status: ClientStatus): string => {
  const labels: Record<ClientStatus, string> = {
    interessado: 'Interessado',
    visitado: 'Visitado',
    agendado: 'Agendado',
    comprou: 'Comprou',
    naointeressado: 'Não Interessado',
    retornar: 'Retornar',
    outro: 'Outro'
  };
  return labels[status] || status;
};

export default function InteractiveMap() {
  const [clients, setClients] = useState<Client[]>(mockClients);

  // Em produção, você buscaria os dados da API aqui
  // useEffect(() => { fetch('/api/clients')... }, [])

  return (
    <MapContainer 
      center={[-23.5505, -46.6333]} 
      zoom={13} 
      style={{ height: '100%', width: '100%' }}
      className="bg-dark-900 z-0"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {clients.map((client) => (
        client.lat && client.lng && (
          <CircleMarker
            key={client.id}
            center={[client.lat, client.lng]}
            radius={12}
            fillColor={getStatusColor(client.status)}
            color="#fff"
            weight={2}
            opacity={1}
            fillOpacity={0.8}
          >
            <Popup>
              <div className="text-gray-900 min-w-[200px]">
                <h3 className="font-bold text-lg mb-1">{client.name}</h3>
                <div className="flex items-center gap-2">
                  <span 
                    className="inline-block w-3 h-3 rounded-full" 
                    style={{ backgroundColor: getStatusColor(client.status) }}
                  />
                  <span className="text-sm font-medium">Status: {getStatusLabel(client.status)}</span>
                </div>
                {client.workspace && (
                  <p className="text-xs text-gray-500 mt-2">Workspace: {client.workspace}</p>
                )}
              </div>
            </Popup>
          </CircleMarker>
        )
      ))}
    </MapContainer>
  );
}
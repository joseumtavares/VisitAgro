'use client';
// GpsPickerMap.tsx — Mapa para seleção de localização via GPS ou arraste
// Usado no cadastro de clientes: abre fullscreen, detecta GPS, permite ajuste manual

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  initialLat?: number;
  initialLng?: number;
  onConfirm: (lat: number, lng: number) => void;
  onCancel: () => void;
}

// Centro padrão: Araranguá SC
const DEFAULT_CENTER: [number, number] = [-28.935, -49.486];
const DEFAULT_ZOOM = 13;

// Ícone do marcador arrastável
function makeDraggableIcon() {
  const svg = `<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 0C7.6 0 0 7.6 0 17c0 9.4 17 27 17 27s17-17.6 17-27C34 7.6 26.4 0 17 0z" fill="#16a34a" stroke="white" stroke-width="2"/>
    <circle cx="17" cy="17" r="7" fill="white" opacity="0.95"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    iconSize: [34, 44], iconAnchor: [17, 44], popupAnchor: [0, -46],
    className: '',
  });
}

// Componente interno que detecta cliques no mapa e atualiza posição
function MapClickHandler({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) { onMove(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

// Centraliza mapa na posição atual
function FlyTo({ lat, lng, trigger }: { lat: number; lng: number; trigger: number }) {
  const map = useMap();
  useEffect(() => {
    if (trigger > 0) map.flyTo([lat, lng], 17, { duration: 1.2 });
  }, [trigger]);
  return null;
}

export default function GpsPickerMap({ initialLat, initialLng, onConfirm, onCancel }: Props) {
  const hasInitial = !!(initialLat && initialLng);
  const [lat, setLat] = useState<number>(initialLat ?? DEFAULT_CENTER[0]);
  const [lng, setLng] = useState<number>(initialLng ?? DEFAULT_CENTER[1]);
  const [hasPin, setHasPin] = useState(hasInitial);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [flyTrigger, setFlyTrigger] = useState(0);

  // Ao abrir, se não tiver pin inicial, tenta GPS automaticamente
  useEffect(() => {
    if (!hasInitial) {
      requestGps();
    }
  }, []);

  const requestGps = () => {
    if (!navigator.geolocation) {
      setGpsError('GPS não disponível neste dispositivo.');
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy: acc } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        setAccuracy(Math.round(acc));
        setHasPin(true);
        setFlyTrigger(t => t + 1);
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) setGpsError('Permissão de localização negada. Clique no mapa para marcar.');
        else if (err.code === 2) setGpsError('Localização indisponível. Clique no mapa para marcar.');
        else setGpsError('Timeout ao obter GPS. Clique no mapa para marcar.');
        // Mesmo com erro, permite clique no mapa
        setHasPin(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleMove = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    setHasPin(true);
    setAccuracy(null);
  };

  const handleMarkerDrag = (e: L.LeafletEvent) => {
    const pos = (e.target as L.Marker).getLatLng();
    setLat(pos.lat);
    setLng(pos.lng);
    setAccuracy(null);
  };

  const center: [number, number] = hasInitial
    ? [initialLat!, initialLng!]
    : DEFAULT_CENTER;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Barra de status GPS */}
      <div style={{
        background: '#0f172a', borderBottom: '1px solid #1e293b',
        padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10,
        fontSize: 12, color: '#94a3b8', minHeight: 40,
      }}>
        {gpsLoading ? (
          <>
            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
            <span>Obtendo localização GPS...</span>
          </>
        ) : gpsError ? (
          <><span style={{ color: '#fbbf24' }}>⚠️</span><span style={{ color: '#fbbf24' }}>{gpsError}</span></>
        ) : hasPin ? (
          <>
            <span style={{ color: '#4ade80' }}>📍</span>
            <span style={{ fontFamily: 'monospace', color: '#e2e8f0', fontSize: 13 }}>
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </span>
            {accuracy !== null && (
              <span style={{ color: '#94a3b8', fontSize: 11 }}>± {accuracy}m</span>
            )}
          </>
        ) : (
          <><span>📌</span><span>Clique no mapa para marcar a localização</span></>
        )}

        {/* Botão Seguir GPS */}
        <button
          onClick={requestGps}
          disabled={gpsLoading}
          style={{
            marginLeft: 'auto', background: gpsLoading ? '#334155' : '#1d4ed8',
            color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px',
            fontSize: 11, cursor: gpsLoading ? 'not-allowed' : 'pointer', fontWeight: 600,
          }}>
          {gpsLoading ? '...' : '📡 Seguir'}
        </button>
      </div>

      {/* Dica de arraste */}
      {hasPin && (
        <div style={{
          background: '#1e3a5f', padding: '4px 16px', fontSize: 11,
          color: '#93c5fd', textAlign: 'center', borderBottom: '1px solid #1e293b',
        }}>
          ✋ Arraste o marcador para ajustar a posição exata
        </div>
      )}

      {/* Mapa */}
      <div style={{ flex: 1, position: 'relative', minHeight: 300 }}>
        <MapContainer
          center={center}
          zoom={hasInitial ? 16 : DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler onMove={handleMove} />
          <FlyTo lat={lat} lng={lng} trigger={flyTrigger} />

          {hasPin && (
            <Marker
              position={[lat, lng]}
              icon={makeDraggableIcon()}
              draggable={true}
              eventHandlers={{ dragend: handleMarkerDrag }}
            />
          )}
        </MapContainer>

        {/* Botão "Marcar minha posição" flutuante */}
        <button
          onClick={requestGps}
          disabled={gpsLoading}
          style={{
            position: 'absolute', bottom: 16, right: 16, zIndex: 800,
            background: gpsLoading ? '#374151' : '#fff',
            color: gpsLoading ? '#9ca3af' : '#111',
            border: 'none', borderRadius: 8, padding: '8px 14px',
            fontSize: 12, fontWeight: 600, cursor: gpsLoading ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
          <span style={{ fontSize: 14 }}>📍</span>
          {gpsLoading ? 'Obtendo GPS...' : 'Marcar minha posição'}
        </button>
      </div>

      {/* Barra inferior: Cancelar / Salvar */}
      <div style={{
        background: '#0f172a', borderTop: '1px solid #1e293b',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
      }}>
        <button
          onClick={onCancel}
          style={{
            background: 'transparent', color: '#9ca3af', border: 'none',
            borderRight: '1px solid #1e293b', padding: '16px', fontSize: 14,
            cursor: 'pointer', fontWeight: 500,
          }}>
          Cancelar
        </button>
        <button
          onClick={() => { if (hasPin) onConfirm(lat, lng); }}
          disabled={!hasPin}
          style={{
            background: hasPin ? '#16a34a' : '#374151',
            color: hasPin ? '#fff' : '#6b7280',
            border: 'none', padding: '16px', fontSize: 14,
            cursor: hasPin ? 'pointer' : 'not-allowed', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          ✅ Salvar localização
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
// Importação estática do CSS do Leaflet
import 'leaflet/dist/leaflet.css';

export default function LeafletProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Não é necessário importar o CSS aqui novamente.
    // A importação estática no topo já garante que o CSS seja carregado.
    
    // Se houver necessidade de carregar scripts específicos ou configurações globais do Leaflet,
    // este é o lugar ideal para fazê-lo.
  }, []);

  return <>{children}</>;
}
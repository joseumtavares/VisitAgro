'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardShell from '@/components/layout/DashboardShell';
import LeafletProvider from '@/components/map/LeafletProvider';
import dynamic from 'next/dynamic';

const InteractiveMap = dynamic(() => import('@/components/map/InteractiveMap'), { ssr: false });

export default function MapPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  // Hydration guard — Zustand persist rehydrates asynchronously
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) { router.push('/auth/login'); }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) return null;

  return (
    <DashboardShell>
      {/* L037: flex column com altura total da viewport disponível */}
      <div className="flex flex-col gap-4" style={{ minHeight: 'calc(100dvh - 120px)' }}>
        <div>
          <h1 className="text-2xl font-bold text-white">Mapa de Clientes</h1>
          <p className="text-dark-400 text-sm mt-1">
            Clientes com coordenadas cadastradas. Clique no marcador para ver detalhes e editar.
          </p>
        </div>
        {/* L037: mapa ocupa o espaço restante; min-height adaptado para mobile */}
        <div
          className="flex-1"
          style={{ minHeight: 'min(560px, calc(100dvh - 200px))' }}
        >
          <LeafletProvider>
            <InteractiveMap compact={false} />
          </LeafletProvider>
        </div>
      </div>
    </DashboardShell>
  );
}

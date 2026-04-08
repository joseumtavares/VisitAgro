'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardShell from '@/components/layout/DashboardShell';
import LeafletProvider from '@/components/map/LeafletProvider';
import dynamic from 'next/dynamic';

const InteractiveMap = dynamic(() => import('@/components/map/InteractiveMap'), { ssr: false });

export default function MapPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <DashboardShell>
      <div className="flex flex-col h-full gap-4" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <div>
          <h1 className="text-2xl font-bold text-white">Mapa de Clientes</h1>
          <p className="text-dark-400 text-sm mt-1">
            Clientes com coordenadas cadastradas. Clique no marcador para ver detalhes e editar.
          </p>
        </div>
        <div className="flex-1" style={{ minHeight: 560 }}>
          <LeafletProvider>
            <InteractiveMap compact={false} />
          </LeafletProvider>
        </div>
      </div>
    </DashboardShell>
  );
}

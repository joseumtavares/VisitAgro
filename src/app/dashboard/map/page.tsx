'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardShell from '@/components/layout/DashboardShell';
import dynamic from 'next/dynamic';

const InteractiveMap = dynamic(() => import('@/components/map/InteractiveMap'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-white">Carregando mapa...</div>
});

export default function MapPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <DashboardShell>
      <div className="h-[calc(100vh-4rem)] bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
        <InteractiveMap />
      </div>
    </DashboardShell>
  );
}
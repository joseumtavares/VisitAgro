'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardShell from '@/components/layout/DashboardShell';
import { Settings, MapPin, Shield, Bell } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => { if (!isAuthenticated) router.push('/auth/login'); }, [isAuthenticated, router]);
  if (!isAuthenticated) return null;

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white">Configurações</h1>
          <p className="text-dark-400 text-sm mt-1">Gerencie as configurações do sistema</p>
        </div>

        {/* Perfil */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-primary-500" />
            <h2 className="text-white font-semibold">Perfil do Usuário</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-dark-400">Usuário</span>
              <span className="text-white font-medium">{(user as any)?.username ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Email</span>
              <span className="text-white">{(user as any)?.email ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Perfil</span>
              <span className="text-white capitalize">{(user as any)?.role ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Workspace</span>
              <span className="text-white">{(user as any)?.workspace ?? 'principal'}</span>
            </div>
          </div>
        </div>

        {/* Mapa */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 text-primary-500" />
            <h2 className="text-white font-semibold">Configurações do Mapa</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white">Região padrão</p>
                <p className="text-dark-400 text-xs">Centro inicial do mapa</p>
              </div>
              <span className="text-primary-400 bg-primary-500/10 border border-primary-500/30 px-3 py-1 rounded-full text-xs">
                Araranguá — SC
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white">Zoom padrão</p>
                <p className="text-dark-400 text-xs">Nível de zoom inicial</p>
              </div>
              <span className="text-dark-300 text-xs">9 (região)</span>
            </div>
          </div>
        </div>

        {/* Sistema */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-5 h-5 text-primary-500" />
            <h2 className="text-white font-semibold">Sistema</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-dark-400">Versão</span>
              <span className="text-white">2.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Ambiente</span>
              <span className="text-green-400">Produção (Vercel)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Banco de dados</span>
              <span className="text-green-400">Supabase ✓</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

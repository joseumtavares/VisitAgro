'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardShell from '@/components/layout/DashboardShell';
import LeafletProvider from '@/components/map/LeafletProvider';
import { Users, Package, MapPin, DollarSign } from 'lucide-react';
import dynamic from 'next/dynamic';

const InteractiveMap = dynamic(() => import('@/components/map/InteractiveMap'), { ssr: false });

interface Stats { clients: number; products: number; }

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const [stats, setStats] = useState<Stats>({ clients: 0, products: 0 });

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    // Busca contagens reais
    Promise.all([
      fetch('/api/clients').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
    ]).then(([c, p]) => setStats({
      clients: c.clients?.length ?? 0,
      products: p.products?.length ?? 0,
    })).catch(() => {});
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const cards = [
    { name: 'Clientes', value: String(stats.clients), icon: Users,    color: 'text-primary-500', href: '/dashboard/clients' },
    { name: 'Produtos',  value: String(stats.products), icon: Package,  color: 'text-blue-500',    href: '/dashboard/products' },
    { name: 'Visitas/Mês', value: '—',                  icon: MapPin,   color: 'text-yellow-500',  href: '/dashboard/map' },
    { name: 'Comissões',   value: '—',                  icon: DollarSign, color: 'text-green-500', href: '#' },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <button onClick={logout} className="text-sm text-dark-400 hover:text-white transition-colors">
            Sair
          </button>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(stat => (
            <a key={stat.name} href={stat.href}
              className="bg-dark-800 p-6 rounded-xl border border-dark-700 hover:border-primary-500/50 transition-colors block">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-400 text-sm">{stat.name}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </a>
          ))}
        </div>

        {/* Mapa rápido — usa componente real em modo compact */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Mapa Rápido</h2>
            <a href="/dashboard/map" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
              Ver mapa completo →
            </a>
          </div>
          <div style={{ height: 280 }}>
            <LeafletProvider>
              <InteractiveMap compact={true} />
            </LeafletProvider>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardShell from '@/components/layout/DashboardShell';
import { Users, Package, MapPin, DollarSign } from 'lucide-react';

const stats = [
  { name: 'Clientes Ativos', value: '124', icon: Users, color: 'text-primary-500' },
  { name: 'Produtos', value: '85', icon: Package, color: 'text-blue-500' },
  { name: 'Visitas Mês', value: '42', icon: MapPin, color: 'text-yellow-500' },
  { name: 'Comissões', value: 'R$ 12k', icon: DollarSign, color: 'text-green-500' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <button onClick={logout} className="text-sm text-dark-400 hover:text-white">Sair</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-dark-800 p-6 rounded-xl border border-dark-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-400 text-sm">{stat.name}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Mapa Rápido</h2>
          <div className="h-64 bg-dark-900 rounded-lg flex items-center justify-center text-dark-500">
            <p>Carregando mapa...</p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardShell from '@/components/layout/DashboardShell';
import LeafletProvider from '@/components/map/LeafletProvider';
import dynamic from 'next/dynamic';
import { Users, Package, ShoppingCart, DollarSign, UserCheck, MapPin, LogOut } from 'lucide-react';
import { apiFetch } from '@/lib/apiFetch';
import Link from 'next/link';

const InteractiveMap = dynamic(() => import('@/components/map/InteractiveMap'), { ssr: false });

interface Stats {
  clients:number; products:number; orders:number; commissions:number;
  referrals:number; pendingCommissions:number; totalSales:number; pendingSales:number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, logout, user } = useAuthStore();
  // ── Hydration guard ───────────────────────────────────────────────────────
  // Zustand's persist middleware rehydrates from localStorage asynchronously.
  // Without this guard, isAuthenticated reads as false on first render,
  // triggering a redirect to /auth/login even for authenticated users.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  const [stats, setStats] = useState<Stats>({ clients:0,products:0,orders:0,commissions:0,referrals:0,pendingCommissions:0,totalSales:0,pendingSales:0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) return null;
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    Promise.all([
      apiFetch('/api/clients').then(r=>r.json()),
      apiFetch('/api/products').then(r=>r.json()),
      apiFetch('/api/orders').then(r=>r.json()),
      apiFetch('/api/commissions').then(r=>r.json()),
      apiFetch('/api/referrals').then(r=>r.json()),
    ]).then(([c,p,o,com,ref]) => {
      const orders = o.orders ?? [];
      const commissions = com.commissions ?? [];
      setStats({
        clients:    c.clients?.length ?? 0,
        products:   p.products?.length ?? 0,
        orders:     orders.length,
        commissions: commissions.length,
        referrals:  ref.referrals?.length ?? 0,
        pendingCommissions: commissions.filter((x:any) => x.status==='pendente').reduce((s:number,x:any) => s+Number(x.amount),0),
        totalSales: orders.filter((x:any) => x.status==='pago').reduce((s:number,x:any) => s+Number(x.total),0),
        pendingSales: orders.filter((x:any) => x.status==='pendente').length,
      });
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, [isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) return null;

  const cards = [
    { label:'Clientes',    value: stats.clients,    sub:'cadastrados',                     icon: Users,       color:'text-primary-400', href:'/dashboard/clients' },
    { label:'Produtos',    value: stats.products,   sub:'no catálogo',                     icon: Package,     color:'text-blue-400',    href:'/dashboard/products' },
    { label:'Indicadores', value: stats.referrals,  sub:'ativos',                          icon: UserCheck,   color:'text-purple-400',  href:'/dashboard/referrals' },
    { label:'Pedidos',     value: stats.orders,     sub:`${stats.pendingSales} pendentes`,  icon: ShoppingCart,color:'text-yellow-400',  href:'/dashboard/sales' },
    { label:'Vendas (pago)',value: stats.totalSales.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}), sub:'total recebido', icon: DollarSign, color:'text-green-400', href:'/dashboard/sales' },
    { label:'Comissões a Pagar', value: stats.pendingCommissions.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}), sub:'aguardando pagamento', icon: DollarSign, color:'text-red-400', href:'/dashboard/commissions' },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-dark-400 text-sm mt-0.5">Bem-vindo, {(user as any)?.username ?? 'Admin'} 👋</p>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-dark-400 hover:text-white border border-dark-700 hover:border-dark-500 px-3 py-2 rounded-lg text-sm transition-colors">
            <LogOut className="w-4 h-4"/>Sair
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(card => (
            <Link key={card.label} href={card.href}
              className="bg-dark-800 p-5 rounded-xl border border-dark-700 hover:border-dark-500 transition-colors block group">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-dark-400 text-xs uppercase tracking-wide mb-1">{card.label}</p>
                  <p className="text-xl font-bold text-white truncate">{loading ? '…' : card.value}</p>
                  <p className="text-dark-500 text-xs mt-1">{card.sub}</p>
                </div>
                <card.icon className={`w-8 h-8 ${card.color} shrink-0 ml-2 group-hover:scale-110 transition-transform`} />
              </div>
            </Link>
          ))}
        </div>

        {/* Mapa rápido */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-400"/>
              <h2 className="text-white font-semibold">Mapa Rápido</h2>
            </div>
            <Link href="/dashboard/map" className="text-xs text-primary-400 hover:text-primary-300 transition-colors border border-primary-500/30 px-2 py-1 rounded">
              Ver completo →
            </Link>
          </div>
          <div style={{ height: 300 }}>
            <LeafletProvider>
              <InteractiveMap compact={true} />
            </LeafletProvider>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

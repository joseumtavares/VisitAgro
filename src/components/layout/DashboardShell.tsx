'use client';
/**
 * src/components/layout/DashboardShell.tsx — Merge controlado L036-A + L037
 *
 * BASE PRESERVADA: L036-A
 * - filtro de navegação por perfil mantido;
 * - representative continua sem ver Indicadores e Com. Indicadores;
 * - adminOnly continua visível apenas para admin;
 * - logout, rotas, branding e contratos preservados.
 *
 * RESPONSIVIDADE INCORPORADA DE L037:
 * - sidebar fixa no desktop e colapsável no mobile;
 * - header mobile com botão hamburguer;
 * - overlay mobile para fechar menu;
 * - links fecham o menu ao navegar no mobile;
 * - padding responsivo no conteúdo.
 *
 * NÃO ALTERADO:
 * - regras de comissão;
 * - chamadas de API;
 * - contratos frontend ↔ API ↔ banco;
 * - tipagens de negócio.
 */

import { useState } from 'react';
import Image      from 'next/image';
import Link       from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  UserCheck,
  Settings,
  Map,
  LogOut,
  Wrench,
  ScrollText,
  Award,
  BarChart2,
  Menu,
  X,
} from 'lucide-react';

interface NavItem {
  href:                  string;
  label:                 string;
  icon:                  React.ReactNode;
  adminOnly?:            boolean;  // existente: oculta para não-admin
  hideForRepresentative?: boolean; // L036-A: oculta para representative
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',                  label: 'Dashboard',           icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/dashboard/clients',          label: 'Clientes',            icon: <Users           className="w-4 h-4" /> },
  { href: '/dashboard/products',         label: 'Produtos',            icon: <Package         className="w-4 h-4" /> },
  { href: '/dashboard/sales',            label: 'Vendas',              icon: <ShoppingCart    className="w-4 h-4" /> },
  // Indicadores e Com. Indicadores: ocultos para representative
  { href: '/dashboard/referrals',        label: 'Indicadores',         icon: <UserCheck       className="w-4 h-4" />, hideForRepresentative: true },
  { href: '/dashboard/commissions',      label: 'Com. Indicadores',    icon: <TrendingUp      className="w-4 h-4" />, hideForRepresentative: true },
  { href: '/dashboard/rep-commissions',  label: 'Com. Representantes', icon: <Award      className="w-4 h-4" /> },
  { href: '/dashboard/reports',          label: 'Relatórios',          icon: <BarChart2  className="w-4 h-4" /> },
  { href: '/dashboard/map',              label: 'Mapa',                icon: <Map        className="w-4 h-4" /> },
  { href: '/dashboard/settings',         label: 'Configurações',       icon: <Settings        className="w-4 h-4" /> },
  // adminOnly: Manutenção e Logs — comportamento anterior preservado
  { href: '/dashboard/maintenance',      label: 'Manutenção',          icon: <Wrench          className="w-4 h-4" />, adminOnly: true },
  { href: '/dashboard/logs',             label: 'Logs',                icon: <ScrollText      className="w-4 h-4" />, adminOnly: true },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin          = user?.role === 'admin';
  const isRepresentative = user?.role === 'representative';

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  // ── Filtro de nav ───────────────────────────────────────────────────────────
  // 1. adminOnly: visível apenas para admin (comportamento original)
  // 2. hideForRepresentative: oculto para representative
  const visibleNav = NAV_ITEMS.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.hideForRepresentative && isRepresentative) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-dark-950 flex overflow-hidden">
      {/* Overlay mobile: fecha o menu ao tocar fora */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Fechar menu"
        />
      )}

      {/* Sidebar: desktop fixa; mobile colapsável */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-60 flex-shrink-0 bg-dark-900 border-r border-dark-800 flex flex-col
          transform transition-transform duration-200 ease-in-out
          lg:static lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="px-4 py-5 border-b border-dark-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center min-w-0">
              <Image
                src="/branding/visitagro-fortsul-logo-sidebar.svg"
                alt="VisitAgro Pro Fortsul"
                width={230}
                height={54}
                className="h-auto w-auto max-w-full"
                priority
              />
            </div>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg text-dark-400 hover:bg-dark-800 hover:text-white transition-colors"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {user && (
            <p className="text-xs text-dark-400 mt-3 truncate">
              {user.name || user.username}
            </p>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
          {visibleNav.map((item) => {
            const active =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors min-h-11
                  ${active
                    ? 'bg-primary-600/20 text-primary-300'
                    : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                  }
                `}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-dark-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-dark-400 hover:bg-dark-800 hover:text-red-300 transition-colors min-h-11"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
        {/* Header mobile */}
        <header className="lg:hidden bg-dark-900 border-b border-dark-800 px-4 py-3 flex items-center gap-3 text-white">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg text-dark-300 hover:bg-dark-800 hover:text-white transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">VisitAgro Pro</p>
            {user && (
              <p className="text-xs text-dark-400 truncate">
                {user.name || user.username}
              </p>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 text-white">
          {children}
        </main>
      </div>
    </div>
  );
}

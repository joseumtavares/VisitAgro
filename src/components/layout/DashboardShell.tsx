'use client';
/**
 * src/components/layout/DashboardShell.tsx — Lote L036-A
 *
 * MUDANÇA: itens de nav filtrados por perfil.
 *
 * Perfil          | Itens ocultos
 * ─────────────── | ────────────────────────────────────────────────
 * admin           | nenhum (vê tudo)
 * manager         | Manutenção, Logs (adminOnly — comportamento anterior)
 * user            | Manutenção, Logs (adminOnly — comportamento anterior)
 * representative  | Indicadores, Com. Indicadores, Manutenção, Logs
 *
 * Lógica: cada NavItem pode ter `adminOnly` (existente) e/ou
 * `hideForRepresentative` (novo). O filtro na renderização respeita ambos.
 *
 * NENHUMA outra mudança: estrutura JSX, classes CSS, logo, logout — intactos.
 */

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
  { href: '/dashboard/rep-commissions',  label: 'Com. Representantes', icon: <Award           className="w-4 h-4" /> },
  { href: '/dashboard/map',              label: 'Mapa',                icon: <Map             className="w-4 h-4" /> },
  { href: '/dashboard/settings',         label: 'Configurações',       icon: <Settings        className="w-4 h-4" /> },
  // adminOnly: Manutenção e Logs — comportamento anterior preservado
  { href: '/dashboard/maintenance',      label: 'Manutenção',          icon: <Wrench          className="w-4 h-4" />, adminOnly: true },
  { href: '/dashboard/logs',             label: 'Logs',                icon: <ScrollText      className="w-4 h-4" />, adminOnly: true },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuthStore();

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
    if (item.adminOnly && !isAdmin)          return false;
    if (item.hideForRepresentative && isRepresentative) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-dark-900 border-r border-dark-800 flex flex-col">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-dark-800">
          <div className="flex items-center">
            <Image
              src="/branding/visitagro-fortsul-logo-sidebar.svg"
              alt="VisitAgro Pro Fortsul"
              width={230}
              height={54}
              className="h-auto w-auto max-w-full"
              priority
            />
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
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                  ${active
                    ? 'bg-primary-600/20 text-primary-300'
                    : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                  }
                `}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-dark-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-dark-400 hover:bg-dark-800 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-6 text-white">
        {children}
      </main>
    </div>
  );
}

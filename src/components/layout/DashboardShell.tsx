'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu, X, MapPin, LayoutDashboard, Users, Package,
  Settings, ShoppingCart, DollarSign, UserCheck,
  Wrench, ClipboardList, ChevronDown, ChevronRight, Tags
} from 'lucide-react';

interface Props { children: React.ReactNode; }

const NAV = [
  { href: '/dashboard',             label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/dashboard/map',         label: 'Mapa',         icon: MapPin },
  {
    label: 'Cadastros', icon: Users, group: true,
    children: [
      { href: '/dashboard/clients',   label: 'Clientes',    icon: Users },
      { href: '/dashboard/products',  label: 'Produtos',    icon: Package },
      { href: '/dashboard/referrals', label: 'Indicadores', icon: UserCheck },
    ]
  },
  {
    label: 'Operações', icon: ShoppingCart, group: true,
    children: [
      { href: '/dashboard/sales',       label: 'Vendas',               icon: ShoppingCart },
      { href: '/dashboard/commissions', label: 'Comissões Indicadores', icon: DollarSign },
    ]
  },
  {
    label: 'Administração', icon: Wrench, group: true,
    children: [
      { href: '/dashboard/maintenance', label: 'Manutenção',    icon: Wrench },
      { href: '/dashboard/logs',        label: 'Logs',          icon: ClipboardList },
      { href: '/dashboard/settings',    label: 'Configurações', icon: Settings },
    ]
  },
];

export default function DashboardShell({ children }: Props) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(['Cadastros','Operações']);

  const toggleGroup = (label: string) =>
    setOpenGroups(g => g.includes(label) ? g.filter(x => x !== label) : [...g, label]);

  const isActive = (href: string) => pathname === href;

  const navItemClass = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'bg-primary-600/20 text-primary-400 border border-primary-600/30'
        : 'text-dark-400 hover:text-white hover:bg-dark-700'
    }`;

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-dark-800 border-r border-dark-700
        flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-dark-700 flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">🌾 AgroVisita</h1>
            <p className="text-dark-500 text-xs mt-0.5">Pro v0.9.2</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-dark-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV.map((item) => {
            if ('group' in item && item.group) {
              const open = openGroups.includes(item.label);
              const Icon = item.icon;
              const anyActive = item.children?.some(c => isActive(c.href));
              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleGroup(item.label)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      anyActive ? 'text-primary-400' : 'text-dark-400 hover:text-white hover:bg-dark-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {open && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l border-dark-700 pl-3">
                      {item.children?.map(child => {
                        const CIcon = child.icon;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setSidebarOpen(false)}
                            className={navItemClass(isActive(child.href))}
                          >
                            <CIcon className="w-4 h-4 flex-shrink-0" />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            const Icon = item.icon;
            return (
              <Link
                key={(item as any).href}
                href={(item as any).href}
                onClick={() => setSidebarOpen(false)}
                className={navItemClass(isActive((item as any).href))}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden bg-dark-800 border-b border-dark-700 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-dark-400 hover:text-white p-1">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-white font-semibold text-sm">🌾 AgroVisita Pro</h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

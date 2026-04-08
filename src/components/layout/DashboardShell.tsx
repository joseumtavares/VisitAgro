'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu, X, MapPin, LayoutDashboard, Users, Package,
  Settings, ShoppingCart, DollarSign, UserCheck,
  Wrench, ClipboardList, ChevronDown, ChevronRight
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
      { href: '/dashboard/sales',       label: 'Vendas',      icon: ShoppingCart },
      { href: '/dashboard/commissions', label: 'Comissões',   icon: DollarSign },
    ]
  },
  {
    label: 'Administração', icon: Wrench, group: true,
    children: [
      { href: '/dashboard/maintenance', label: 'Manutenção',  icon: Wrench },
      { href: '/dashboard/logs',        label: 'Logs',        icon: ClipboardList },
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
  const groupActive = (children: any[]) => children.some(c => pathname.startsWith(c.href));

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-dark-800 border-r border-dark-700 flex flex-col transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 border-b border-dark-700 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-bold text-primary-500">Agrovisita</h1>
            <p className="text-dark-500 text-xs">Pro v2.0</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-dark-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV.map((item: any) => {
            if (item.group) {
              const open = openGroups.includes(item.label);
              const active = groupActive(item.children);
              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleGroup(item.label)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? 'text-primary-400' : 'text-dark-400 hover:text-white hover:bg-dark-700'}`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left font-medium">{item.label}</span>
                    {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {open && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-dark-700 pl-3">
                      {item.children.map((child: any) => (
                        <Link key={child.href} href={child.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive(child.href) ? 'bg-primary-600/15 text-primary-400 font-medium' : 'text-dark-400 hover:bg-dark-700 hover:text-white'}`}>
                          <child.icon className="w-4 h-4 shrink-0" />
                          <span>{child.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <Link key={item.href} href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive(item.href) ? 'bg-primary-600/15 text-primary-400 font-medium' : 'text-dark-400 hover:bg-dark-700 hover:text-white'}`}>
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-dark-700 shrink-0">
          <p className="text-dark-600 text-xs text-center">© 2025 Agrovisita Pro</p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-dark-800 border-b border-dark-700 px-4 py-3 lg:hidden flex items-center gap-3 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-dark-400 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-white font-semibold text-sm">Agrovisita Pro</span>
        </header>
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

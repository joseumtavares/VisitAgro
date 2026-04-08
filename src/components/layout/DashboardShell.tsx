'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, MapPin, LayoutDashboard, Users, Package, Settings } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/map', label: 'Mapa de Clientes', icon: MapPin },
  { href: '/dashboard/clients', label: 'Clientes', icon: Users },
  { href: '/dashboard/products', label: 'Produtos', icon: Package },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
];

export default function DashboardShell({ children }: Props) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-dark-800 border-r border-dark-700 transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-dark-700 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-500">Agrovisita</h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-dark-400">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-primary-600/10 text-primary-500' : 'text-dark-400 hover:bg-dark-700 hover:text-white'}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-dark-800 border-b border-dark-700 p-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-dark-400">
            <Menu className="w-6 h-6" />
          </button>
        </header>
        
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
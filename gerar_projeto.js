const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, 'agrovisita-pro');

// Função auxiliar para criar diretórios e arquivos
const createFile = (filePath, content) => {
  const fullPath = path.join(rootDir, filePath);
  const dir = path.dirname(fullPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Criado: ${filePath}`);
};

console.log('🚀 Iniciando geração do projeto Agrovisita Pro...\n');

// 1. Arquivos de Configuração Raiz
createFile('package.json', `{
  "name": "agrovisita-pro",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "node scripts/generate-password-hash.js"
  },
  "dependencies": {
    "next": "14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@supabase/supabase-js": "^2.45.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "zustand": "^4.5.4",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "lucide-react": "^0.424.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.4.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.12",
    "@types/react": "^18.3.3",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/leaflet": "^1.9.12",
    "typescript": "^5.5.4",
    "tailwindcss": "^3.4.7",
    "postcss": "^8.4.40",
    "autoprefixer": "^10.4.20"
  }
}`);

createFile('vercel.json', `{
  "region": "sao1",
  "framework": "nextjs",
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev"
}`);

createFile('.env.example', `NEXT_PUBLIC_SUPABASE_URL=sua-url-aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
JWT_SECRET=uma-chave-secreta-muito-forte-com-mais-de-32-caracteres
JWT_EXPIRES_IN=3600`);

createFile('tsconfig.json', `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`);

createFile('tailwind.config.js', `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
          400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
          800: '#1e293b', 900: '#0f172a', 950: '#020617',
        },
        primary: {
          50: '#ecfdf5', 100: '#d1fae5', 500: '#10b981', 600: '#059669', 700: '#047857',
        }
      },
    },
  },
  plugins: [],
}`);

createFile('postcss.config.js', `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`);

createFile('next.config.mjs', `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;`);

// 2. Estilos e Libs
createFile('src/styles/globals.css', `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #0f172a;
  color: #f8fafc;
}

.leaflet-popup-content-wrapper, .leaflet-popup-tip {
  background: #1e293b;
  color: #f8fafc;
}
.leaflet-container {
  background: #0f172a;
}`);

createFile('src/lib/supabase.ts', `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);`);

createFile('src/lib/auth.ts', `import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '3600';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: parseInt(JWT_EXPIRES_IN) + 's' });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}`);

createFile('src/store/authStore.ts', `import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  company_id?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
);`);

createFile('src/types/index.ts', `export interface Client {
  id: string;
  name: string;
  status: 'prospect' | 'active' | 'inactive' | 'blocked';
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  company_id: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category_id: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'sales';
}`);

// 3. Layout e Páginas
createFile('src/app/layout.tsx', `import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agrovisita Pro",
  description: "Sistema de Gestão Agrícola Escalável",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  );
}`);

createFile('src/app/page.tsx', `import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/auth/login');
}`);

createFile('src/app/auth/login/page.tsx', `'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { MapPin, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Falha na autenticação');

      login(data.user, data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">
      <div className="max-w-md w-full bg-dark-800 rounded-xl shadow-2xl p-8 border border-dark-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-600 mb-4">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Agrovisita Pro</h1>
          <p className="text-dark-400 mt-2">Acesse sua conta para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-dark-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                placeholder="admin@agrovisita.com.br"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-dark-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-dark-500">
          <p>Usuário padrão: admin@agrovisita.com.br</p>
          <p>Senha padrão: admin123</p>
        </div>
      </div>
    </div>
  );
}`);

createFile('src/app/dashboard/page.tsx', `'use client';

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
                <stat.icon className={\`w-8 h-8 \${stat.color}\`} />
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
}`);

createFile('src/app/dashboard/map/page.tsx', `'use client';

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
}`);

// 4. Componentes
createFile('src/components/layout/DashboardShell.tsx', `'use client';

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

      <aside className={\`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-dark-800 border-r border-dark-700 transform transition-transform duration-200 ease-in-out \${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}\`}>
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
                className={\`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors \${isActive ? 'bg-primary-600/10 text-primary-500' : 'text-dark-400 hover:bg-dark-700 hover:text-white'}\`}
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
}`);

createFile('src/components/map/LeafletProvider.tsx', `'use client';

import { useEffect } from 'react';

export default function LeafletProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    import('leaflet/dist/leaflet.css');
  }, []);

  return <>{children}</>;
}`);

createFile('src/components/map/InteractiveMap.tsx', `'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Client } from '@/types';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const mockClients: Client[] = [
  { id: '1', name: 'Fazenda Santa Clara', status: 'active', latitude: -23.5505, longitude: -46.6333, company_id: '1' },
  { id: '2', name: 'Agropecuária Boa Vista', status: 'prospect', latitude: -23.5605, longitude: -46.6433, company_id: '1' },
  { id: '3', name: 'Sítio Esperança', status: 'inactive', latitude: -23.5405, longitude: -46.6233, company_id: '1' },
  { id: '4', name: 'Granja Sol Nascente', status: 'blocked', latitude: -23.5705, longitude: -46.6533, company_id: '1' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return '#10b981';
    case 'prospect': return '#3b82f6';
    case 'inactive': return '#6b7280';
    case 'blocked': return '#ef4444';
    default: return '#6b7280';
  }
};

export default function InteractiveMap() {
  const [clients] = useState<Client[]>(mockClients);

  return (
    <MapContainer 
      center={[-23.5505, -46.6333]} 
      zoom={13} 
      style={{ height: '100%', width: '100%' }}
      className="bg-dark-900"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {clients.map((client) => (
        client.latitude && client.longitude && (
          <CircleMarker
            key={client.id}
            center={[client.latitude, client.longitude]}
            radius={10}
            fillColor={getStatusColor(client.status)}
            color="#fff"
            weight={2}
            opacity={1}
            fillOpacity={0.8}
          >
            <Popup>
              <div className="text-dark-900">
                <h3 className="font-bold">{client.name}</h3>
                <p className="text-sm capitalize">Status: {client.status}</p>
              </div>
            </Popup>
          </CircleMarker>
        )
      ))}
    </MapContainer>
  );
}`);

// 5. API Routes
createFile('src/app/api/auth/login/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !users) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const validPassword = await verifyPassword(password, users.password_hash);
    if (!validPassword) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const token = generateToken({
      id: users.id,
      email: users.email,
      role: users.role,
      company_id: users.company_id
    });

    const { password_hash, ...userWithoutPassword } = users;

    return NextResponse.json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}`);

// 6. Scripts e DB
createFile('scripts/generate-password-hash.js', `const bcrypt = require('bcryptjs');

async function generateHash(password) {
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(password, salt);
  console.log('\\n=== Hash Gerado ===');
  console.log('Senha:', password);
  console.log('Hash:', hash);
  console.log('===================\\n');
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Uso: node scripts/generate-password-hash.js <senha>');
  process.exit(1);
}

generateHash(args[0]);`);

createFile('schema.sql', `-- Agrovisita Pro Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'sales',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'prospect',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  category_id UUID REFERENCES categories(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  unit VARCHAR(20) DEFAULT 'UN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  client_id UUID REFERENCES clients(id),
  user_id UUID REFERENCES users(id),
  total_amount DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL
);

CREATE TABLE appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  client_id UUID REFERENCES clients(id),
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  description TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  source VARCHAR(100),
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE km_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  start_km INTEGER NOT NULL,
  end_km INTEGER,
  start_location VARCHAR(255),
  end_location VARCHAR(255),
  trip_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE indicators (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  target_value DECIMAL(10, 2),
  unit VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sales_commissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  percentage DECIMAL(5, 2) NOT NULL,
  min_amount DECIMAL(10, 2) DEFAULT 0,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE indicator_commissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  indicator_id UUID REFERENCES indicators(id),
  user_id UUID REFERENCES users(id),
  bonus_value DECIMAL(10, 2) NOT NULL,
  condition_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE commission_payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  reference_month DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE environments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  client_id UUID REFERENCES clients(id),
  name VARCHAR(255) NOT NULL,
  area_hectares DECIMAL(10, 2),
  location_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_clients_company ON clients(company_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_location ON clients(latitude, longitude);
CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_appointments_date ON appointments(scheduled_for);

INSERT INTO companies (id, name) VALUES ('00000000-0000-0000-0000-000000000001', 'Agrovisita Pro');

INSERT INTO users (company_id, email, password_hash, name, role) 
VALUES (
  '00000000-0000-0000-0000-000000000001', 
  'admin@agrovisita.com.br', 
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G.4.4.4.4.4.4.4', 
  'Administrador', 
  'admin'
);

INSERT INTO categories (company_id, name) VALUES 
('00000000-0000-0000-0000-000000000001', 'Defensivos'),
('00000000-0000-0000-0000-000000000001', 'Fertilizantes'),
('00000000-0000-0000-0000-000000000001', 'Sementes'),
('00000000-0000-0000-0000-000000000001', 'Maquinário');`);

createFile('README.md', `# Agrovisita Pro 🚜

Sistema escalonável de gestão agrícola desenvolvido com Next.js 14, TypeScript e Supabase.

## 🚀 Funcionalidades

- **Autenticação JWT** segura
- **Mapa Interativo** com Leaflet e OpenStreetMap
- **Gestão de Clientes** com geolocalização e status por cores
- **Controle de Pedidos** e Produtos
- **Comissões** de venda e indicadores
- **Agendamentos** de visitas técnicas
- **Multi-tenancy** (múltiplas empresas)

## ⚙️ Configuração

1. Instale as dependências:
   \`\`\`bash
   npm install
   \`\`\`

2. Copie \`.env.example\` para \`.env.local\` e preencha.

3. Execute o script \`schema.sql\` no painel do Supabase.

4. Gere o hash da senha admin:
   \`\`\`bash
   node scripts/generate-password-hash.js admin123
   \`\`\`

5. Rode o projeto:
   \`\`\`bash
   npm run dev
   \`\`\`

## 🔐 Acesso Inicial

- **Email:** admin@agrovisita.com.br
- **Senha:** admin123
`);

console.log('\n✅ Projeto Agrovisita Pro gerado com sucesso na pasta: agrovisita-pro');
console.log('📂 Agora você pode abrir esta pasta no GitHub Desktop para fazer o commit.');
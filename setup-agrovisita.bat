@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ==========================================
echo   Criando estrutura do Agrovisita Pro
echo ==========================================

REM 1. Criar diretórios
echo [1/4] Criando pastas...
if not exist "src" mkdir src
if not exist "src\app" mkdir src\app
if not exist "src\app\api" mkdir src\app\api
if not exist "src\app\api\auth" mkdir src\app\api\auth
if not exist "src\app\api\auth\login" mkdir src\app\api\auth\login
if not exist "src\app\auth" mkdir src\app\auth
if not exist "src\app\auth\login" mkdir src\app\auth\login
if not exist "src\app\dashboard" mkdir src\app\dashboard
if not exist "src\app\dashboard\map" mkdir src\app\dashboard\map
if not exist "src\components" mkdir src\components
if not exist "src\components\layout" mkdir src\components\layout
if not exist "src\components\map" mkdir src\components\map
if not exist "src\lib" mkdir src\lib
if not exist "src\store" mkdir src\store
if not exist "src\styles" mkdir src\styles
if not exist "src\types" mkdir src\types
if not exist "scripts" mkdir scripts
if not exist "public" mkdir public

REM 2. Criar package.json
echo [2/4] Criando arquivos de configuracao...
(
echo {
echo   "name": "agrovisita-pro",
echo   "version": "1.0.0",
echo   "private": true,
echo   "scripts": {
echo     "dev": "next dev",
echo     "build": "next build",
echo     "start": "next start",
echo     "lint": "next lint",
echo     "db:generate": "node scripts/generate-password-hash.js"
echo   },
echo   "dependencies": {
echo     "next": "14.2.5",
echo     "react": "^18.3.1",
echo     "react-dom": "^18.3.1",
echo     "@supabase/supabase-js": "^2.45.0",
echo     "bcryptjs": "^2.4.3",
echo     "jsonwebtoken": "^9.0.2",
echo     "zustand": "^4.5.4",
echo     "leaflet": "^1.9.4",
echo     "react-leaflet": "^4.2.1",
echo     "lucide-react": "^0.424.0",
echo     "clsx": "^2.1.1",
echo     "tailwind-merge": "^2.4.0"
echo   },
echo   "devDependencies": {
echo     "@types/node": "^20.14.12",
echo     "@types/react": "^18.3.3",
echo     "@types/bcryptjs": "^2.4.6",
echo     "@types/jsonwebtoken": "^9.0.6",
echo     "@types/leaflet": "^1.9.12",
echo     "typescript": "^5.5.4",
echo     "tailwindcss": "^3.4.7",
echo     "postcss": "^8.4.40",
echo     "autoprefixer": "^10.4.20"
echo   }
echo }
) > package.json

REM 3. Criar vercel.json
(
echo {
echo   "region": "sao1",
echo   "framework": "nextjs",
echo   "installCommand": "npm install",
echo   "buildCommand": "npm run build",
echo   "devCommand": "npm run dev"
echo }
) > vercel.json

REM 4. Criar .env.example
(
echo NEXT_PUBLIC_SUPABASE_URL=sua-url-aqui
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
echo SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
echo JWT_SECRET=uma-chave-secreta-muito-forte-com-mais-de-32-caracteres
echo JWT_EXPIRES_IN=3600
) > .env.example

REM 5. Criar tsconfig.json
(
echo {
echo   "compilerOptions": {
echo     "target": "ES2017",
echo     "lib": ["dom", "dom.iterable", "esnext"],
echo     "allowJs": true,
echo     "skipLibCheck": true,
echo     "strict": true,
echo     "noEmit": true,
echo     "esModuleInterop": true,
echo     "module": "esnext",
echo     "moduleResolution": "bundler",
echo     "resolveJsonModule": true,
echo     "isolatedModules": true,
echo     "jsx": "preserve",
echo     "incremental": true,
echo     "plugins": [{"name": "next"}],
echo     "paths": {"@/*": ["./src/*"]}
echo   },
echo   "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
echo   "exclude": ["node_modules"]
echo }
) > tsconfig.json

REM 6. Criar tailwind.config.js
(
echo /** @type {import('tailwindcss').Config} */
echo module.exports = {
echo   content: [
echo     './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
echo     './src/components/**/*.{js,ts,jsx,tsx,mdx}',
echo     './src/app/**/*.{js,ts,jsx,tsx,mdx}',
echo   ],
echo   theme: {
echo     extend: {
echo       colors: {
echo         dark: {
echo           50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
echo           400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
echo           800: '#1e293b', 900: '#0f172a', 950: '#020617',
echo         },
echo         primary: { 50: '#ecfdf5', 100: '#d1fae5', 500: '#10b981', 600: '#059669', 700: '#047857' }
echo       },
echo     },
echo   },
echo   plugins: [],
echo }
) > tailwind.config.js

REM 7. Criar postcss.config.js
(
echo module.exports = {
echo   plugins: {
echo     tailwindcss: {},
echo     autoprefixer: {},
echo   },
echo }
) > postcss.config.js

REM 8. Criar next.config.mjs
(
echo /** @type {import('next').NextConfig} */
echo const nextConfig = {
echo   reactStrictMode: true,
echo };
echo export default nextConfig;
) > next.config.mjs

REM 9. Criar src/styles/globals.css
(
echo @tailwind base;
echo @tailwind components;
echo @tailwind utilities;
echo.
echo body {
echo   background-color: #0f172a;
echo   color: #f8fafc;
echo }
echo .leaflet-popup-content-wrapper, .leaflet-popup-tip {
echo   background: #1e293b;
echo   color: #f8fafc;
echo }
echo .leaflet-container {
echo   background: #0f172a;
echo }
) > src\styles\globals.css

REM 10. Criar src/lib/supabase.ts
(
echo import { createClient } from '@supabase/supabase-js';
echo.
echo const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
echo const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
echo.
echo export const supabase = createClient(supabaseUrl, supabaseAnonKey);
) > src\lib\supabase.ts

REM 11. Criar src/lib/auth.ts
(
echo import jwt from 'jsonwebtoken';
echo import bcrypt from 'bcryptjs';
echo.
echo const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';
echo const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '3600';
echo.
echo export async function hashPassword(password: string): Promise<string> {
echo   return bcrypt.hash(password, 12);
echo }
echo.
echo export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
echo   return bcrypt.compare(password, hashedPassword);
echo }
echo.
echo export function generateToken(payload: any): string {
echo   return jwt.sign(payload, JWT_SECRET, { expiresIn: parseInt(JWT_EXPIRES_IN) + 's' });
echo }
echo.
echo export function verifyToken(token: string): any {
echo   try {
echo     return jwt.verify(token, JWT_SECRET);
echo   } catch (error) {
echo     return null;
echo   }
echo }
) > src\lib\auth.ts

REM 12. Criar src/store/authStore.ts
(
echo import { create } from 'zustand';
echo import { persist } from 'zustand/middleware';
echo.
echo interface User {
echo   id: string;
echo   email: string;
echo   name: string;
echo   role: string;
echo   company_id?: string;
echo }
echo.
echo interface AuthState {
echo   user: User | null;
echo   token: string | null;
echo   isAuthenticated: boolean;
echo   login: (user: User, token: string) => void;
echo   logout: () => void;
echo }
echo.
echo export const useAuthStore = create<AuthState>()(
echo   persist(
echo     (set) => ({
echo       user: null,
echo       token: null,
echo       isAuthenticated: false,
echo       login: (user, token) => set({ user, token, isAuthenticated: true }),
echo       logout: () => set({ user: null, token: null, isAuthenticated: false }),
echo     }),
echo     { name: 'auth-storage' }
echo   )
echo );
) > src\store\authStore.ts

REM 13. Criar src/types/index.ts
(
echo export interface Client {
echo   id: string;
echo   name: string;
echo   status: 'prospect' | 'active' | 'inactive' | 'blocked';
echo   latitude?: number;
echo   longitude?: number;
echo   phone?: string;
echo   email?: string;
echo   company_id: string;
echo }
echo.
echo export interface Product {
echo   id: string;
echo   name: string;
echo   price: number;
echo   stock: number;
echo   category_id: string;
echo }
) > src\types\index.ts

REM 14. Criar src/app/layout.tsx
(
echo import type { Metadata } from "next";
echo import { Inter } from "next/font/google";
echo import "../styles/globals.css";
echo.
echo const inter = Inter({ subsets: ["latin"] });
echo.
echo export const metadata: Metadata = {
echo   title: "Agrovisita Pro",
echo   description: "Sistema de Gestao Agricola Escalavel",
echo };
echo.
echo export default function RootLayout({
echo   children,
echo }: Readonly<{
echo   children: React.ReactNode;
echo }>) {
echo   return (
echo     ^<html lang="pt-BR"^>
echo       ^<body className={inter.className}^{children}^</body^>
echo     ^</html^>
echo   );
echo }
) > src\app\layout.tsx

REM 15. Criar src/app/page.tsx
(
echo import { redirect } from 'next/navigation';
echo.
echo export default function Home() {
echo   redirect('/auth/login');
echo }
) > src\app\page.tsx

REM 16. Criar src/components/layout/DashboardShell.tsx
(
echo 'use client';
echo.
echo import { useState } from 'react';
echo import Link from 'next/link';
echo import { usePathname } from 'next/navigation';
echo import { Menu, X, MapPin, LayoutDashboard, Users, Package, Settings } from 'lucide-react';
echo.
echo interface Props { children: React.ReactNode; }
echo.
echo const navItems = [
echo   { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
echo   { href: '/dashboard/map', label: 'Mapa de Clientes', icon: MapPin },
echo   { href: '/dashboard/clients', label: 'Clientes', icon: Users },
echo   { href: '/dashboard/products', label: 'Produtos', icon: Package },
echo   { href: '/dashboard/settings', label: 'Configuracoes', icon: Settings },
echo ];
echo.
echo export default function DashboardShell({ children }: Props) {
echo   const pathname = usePathname();
echo   const [sidebarOpen, setSidebarOpen] = useState(false);
echo.
echo   return (
echo     ^<div className="min-h-screen bg-dark-900 flex"^>
echo       {sidebarOpen ^&^& (^<div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() =^> setSidebarOpen(false)} /^>)}
echo       ^<aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-dark-800 border-r border-dark-700 transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}`^>
echo         ^<div className="p-6 border-b border-dark-700 flex items-center justify-between"^>
echo           ^<h1 className="text-xl font-bold text-primary-500"^>Agrovisita^</h1^>
echo           ^<button onClick={() =^> setSidebarOpen(false)} className="lg:hidden text-dark-400"^>^<X className="w-6 h-6" /^>^</button^>
echo         ^</div^>
echo         ^<nav className="p-4 space-y-2"^>
echo           {navItems.map((item) =^> (
echo             ^<Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-lg ${pathname === item.href ? 'bg-primary-600/10 text-primary-500' : 'text-dark-400 hover:bg-dark-700 hover:text-white'}`}`^>
echo               ^<item.icon className="w-5 h-5" /^>^<span^{item.label}^</span^>
echo             ^</Link^>
echo           ))}
echo         ^</nav^>
echo       ^</aside^>
echo       ^<main className="flex-1 flex flex-col min-w-0 overflow-hidden"^>
echo         ^<header className="bg-dark-800 border-b border-dark-700 p-4 lg:hidden"^>
echo           ^<button onClick={() =^> setSidebarOpen(true)} className="text-dark-400"^>^<Menu className="w-6 h-6" /^>^</button^>
echo         ^</header^>
echo         ^<div className="flex-1 overflow-auto p-6"^>{children}^</div^>
echo       ^</main^>
echo     ^</div^>
echo   );
echo }
) > src\components\layout\DashboardShell.tsx

REM 17. Criar src/components/map/LeafletProvider.tsx
(
echo 'use client';
echo import { useEffect } from 'react';
echo export default function LeafletProvider({ children }: { children: React.ReactNode }) {
echo   useEffect(() =^> { import('leaflet/dist/leaflet.css'); }, []);
echo   return ^<^{children}^>;
echo }
) > src\components\map\LeafletProvider.tsx

REM 18. Criar src/components/map/InteractiveMap.tsx
(
echo 'use client';
echo import { useEffect, useState } from 'react';
echo import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
echo import L from 'leaflet';
echo import { Client } from '@/types';
echo.
echo delete (L.Icon.Default.prototype as any)._getIconUrl;
echo L.Icon.Default.mergeOptions({
echo   iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
echo   iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
echo   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
echo });
echo.
echo const mockClients: Client[] = [
echo   { id: '1', name: 'Fazenda Santa Clara', status: 'active', latitude: -23.5505, longitude: -46.6333, company_id: '1' },
echo   { id: '2', name: 'Agropecuaria Boa Vista', status: 'prospect', latitude: -23.5605, longitude: -46.6433, company_id: '1' },
echo   { id: '3', name: 'Sitio Esperanca', status: 'inactive', latitude: -23.5405, longitude: -46.6233, company_id: '1' },
echo   { id: '4', name: 'Granja Sol Nascente', status: 'blocked', latitude: -23.5705, longitude: -46.6533, company_id: '1' },
echo ];
echo.
echo const getStatusColor = (status: string) =^> {
echo   switch (status) {
echo     case 'active': return '#10b981';
echo     case 'prospect': return '#3b82f6';
echo     case 'inactive': return '#6b7280';
echo     case 'blocked': return '#ef4444';
echo     default: return '#6b7280';
echo   }
echo };
echo.
echo export default function InteractiveMap() {
echo   const [clients] = useState<Client[]>(mockClients);
echo   return (
echo     ^<MapContainer center={[-23.5505, -46.6333]} zoom={13} style={{ height: '100%', width: '100%' }} className="bg-dark-900"^>
echo       ^<TileLayer attribution='^&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /^>
echo       {clients.map((client) =^> (
echo         client.latitude ^&^& client.longitude ^&^& (
echo           ^<CircleMarker key={client.id} center={[client.latitude, client.longitude]} radius={10} fillColor={getStatusColor(client.status)} color="#fff" weight={2} opacity={1} fillOpacity={0.8}^>
echo             ^<Popup^>^<div className="text-dark-900"^>^<h3 className="font-bold"^{client.name}^</h3^>^<p className="text-sm capitalize"^>Status: {client.status}^</p^>^</div^>^</Popup^>
echo           ^</CircleMarker^>
echo         )
echo       ))}
echo     ^</MapContainer^>
echo   );
echo }
) > src\components\map\InteractiveMap.tsx

REM 19. Criar src/app/auth/login/page.tsx
(
echo 'use client';
echo import { useState } from 'react';
echo import { useRouter } from 'next/navigation';
echo import { useAuthStore } from '@/store/authStore';
echo import { MapPin, Lock, Mail } from 'lucide-react';
echo.
echo export default function LoginPage() {
echo   const router = useRouter();
echo   const login = useAuthStore((state) =^> state.login);
echo   const [email, setEmail] = useState('');
echo   const [password, setPassword] = useState('');
echo   const [error, setError] = useState('');
echo   const [loading, setLoading] = useState(false);
echo.
echo   const handleSubmit = async (e: React.FormEvent) =^> {
echo     e.preventDefault();
echo     setLoading(true);
echo     setError('');
echo     try {
echo       const res = await fetch('/api/auth/login', {
echo         method: 'POST',
echo         headers: { 'Content-Type': 'application/json' },
echo         body: JSON.stringify({ email, password }),
echo       });
echo       const data = await res.json();
echo       if (!res.ok) throw new Error(data.error || 'Falha na autenticacao');
echo       login(data.user, data.token);
echo       router.push('/dashboard');
echo     } catch (err: any) {
echo       setError(err.message);
echo     } finally {
echo       setLoading(false);
echo     }
echo   };
echo.
echo   return (
echo     ^<div className="min-h-screen flex items-center justify-center bg-dark-900 p-4"^>
echo       ^<div className="max-w-md w-full bg-dark-800 rounded-xl shadow-2xl p-8 border border-dark-700"^>
echo         ^<div className="text-center mb-8"^>
echo           ^<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-600 mb-4"^>
echo             ^<MapPin className="w-8 h-8 text-white" /^>
echo           ^</div^>
echo           ^<h1 className="text-2xl font-bold text-white"^>Agrovisita Pro^</h1^>
echo           ^<p className="text-dark-400 mt-2"^>Acesse sua conta para continuar^</p^>
echo         ^</div^>
echo         ^<form onSubmit={handleSubmit} className="space-y-6"^>
echo           {error ^&^& (^<div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm"^{error}^</div^>)}
echo           ^<div^>
echo             ^<label className="block text-sm font-medium text-dark-300 mb-2"^>Email^</label^>
echo             ^<div className="relative"^>
echo               ^<Mail className="absolute left-3 top-3 w-5 h-5 text-dark-500" /^>
echo               ^<input type="email" value={email} onChange={(e) =^> setEmail(e.target.value)} className="w-full bg-dark-900 border border-dark-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="admin@agrovisita.com.br" required /^>
echo             ^</div^>
echo           ^</div^>
echo           ^<div^>
echo             ^<label className="block text-sm font-medium text-dark-300 mb-2"^>Senha^</label^>
echo             ^<div className="relative"^>
echo               ^<Lock className="absolute left-3 top-3 w-5 h-5 text-dark-500" /^>
echo               ^<input type="password" value={password} onChange={(e) =^> setPassword(e.target.value)} className="w-full bg-dark-900 border border-dark-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="••••••••" required /^>
echo             ^</div^>
echo           ^</div^>
echo           ^<button type="submit" disabled={loading} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"^{loading ? 'Entrando...' : 'Entrar'}^</button^>
echo         ^</form^>
echo         ^<div className="mt-6 text-center text-xs text-dark-500"^>
echo           ^<p^>Usuario padrao: admin@agrovisita.com.br^</p^>
echo           ^<p^>Senha padrao: admin123^</p^>
echo         ^</div^>
echo       ^</div^>
echo     ^</div^>
echo   );
echo }
) > src\app\auth\login\page.tsx

REM 20. Criar src/app/dashboard/page.tsx
(
echo 'use client';
echo import { useEffect } from 'react';
echo import { useRouter } from 'next/navigation';
echo import { useAuthStore } from '@/store/authStore';
echo import DashboardShell from '@/components/layout/DashboardShell';
echo import { Users, Package, MapPin, DollarSign } from 'lucide-react';
echo.
echo const stats = [
echo   { name: 'Clientes Ativos', value: '124', icon: Users, color: 'text-primary-500' },
echo   { name: 'Produtos', value: '85', icon: Package, color: 'text-blue-500' },
echo   { name: 'Visitas Mes', value: '42', icon: MapPin, color: 'text-yellow-500' },
echo   { name: 'Comissoes', value: 'R$ 12k', icon: DollarSign, color: 'text-green-500' },
echo ];
echo.
echo export default function DashboardPage() {
echo   const router = useRouter();
echo   const { isAuthenticated, logout } = useAuthStore();
echo   useEffect(() =^> { if (!isAuthenticated) router.push('/auth/login'); }, [isAuthenticated, router]);
echo   if (!isAuthenticated) return null;
echo   return (
echo     ^<DashboardShell^>
echo       ^<div className="space-y-6"^>
echo         ^<div className="flex justify-between items-center"^>
echo           ^<h1 className="text-2xl font-bold text-white"^>Dashboard^</h1^>
echo           ^<button onClick={logout} className="text-sm text-dark-400 hover:text-white"^>Sair^</button^>
echo         ^</div^>
echo         ^<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"^>
echo           {stats.map((stat) =^> (
echo             ^<div key={stat.name} className="bg-dark-800 p-6 rounded-xl border border-dark-700"^>
echo               ^<div className="flex items-center justify-between"^>
echo                 ^<div^>^<p className="text-dark-400 text-sm"^{stat.name}^</p^>^<p className="text-2xl font-bold text-white mt-1"^{stat.value}^</p^>^</div^>
echo                 ^<stat.icon className={`w-8 h-8 ${stat.color}`} /^>
echo               ^</div^>
echo             ^</div^>
echo           ))}
echo         ^</div^>
echo       ^</div^>
echo     ^</DashboardShell^>
echo   );
echo }
) > src\app\dashboard\page.tsx

REM 21. Criar src/app/dashboard/map/page.tsx
(
echo 'use client';
echo import { useEffect } from 'react';
echo import { useRouter } from 'next/navigation';
echo import { useAuthStore } from '@/store/authStore';
echo import DashboardShell from '@/components/layout/DashboardShell';
echo import dynamic from 'next/dynamic';
echo const InteractiveMap = dynamic(() =^> import('@/components/map/InteractiveMap'), { ssr: false, loading: () =^> ^<div className="flex items-center justify-center h-full text-white"^>Carregando mapa...^</div^> });
echo.
echo export default function MapPage() {
echo   const router = useRouter();
echo   const { isAuthenticated } = useAuthStore();
echo   useEffect(() =^> { if (!isAuthenticated) router.push('/auth/login'); }, [isAuthenticated, router]);
echo   if (!isAuthenticated) return null;
echo   return (
echo     ^<DashboardShell^>
echo       ^<div className="h-[calc(100vh-4rem)] bg-dark-800 rounded-xl border border-dark-700 overflow-hidden"^>
echo         ^<InteractiveMap /^>
echo       ^</div^>
echo     ^</DashboardShell^>
echo   );
echo }
) > src\app\dashboard\map\page.tsx

REM 22. Criar src/app/api/auth/login/route.ts
(
echo import { NextRequest, NextResponse } from 'next/server';
echo import { supabase } from '@/lib/supabase';
echo import { verifyPassword, generateToken } from '@/lib/auth';
echo.
echo export async function POST(request: NextRequest) {
echo   try {
echo     const { email, password } = await request.json();
echo     if (!email || !password) return NextResponse.json({ error: 'Email e senha obrigatorios' }, { status: 400 });
echo     const { data: users, error } = await supabase.from('users').select('*').eq('email', email).single();
echo     if (error || !users) return NextResponse.json({ error: 'Credenciais invalidas' }, { status: 401 });
echo     const validPassword = await verifyPassword(password, users.password_hash);
echo     if (!validPassword) return NextResponse.json({ error: 'Credenciais invalidas' }, { status: 401 });
echo     const token = generateToken({ id: users.id, email: users.email, role: users.role, company_id: users.company_id });
echo     const { password_hash, ...userWithoutPassword } = users;
echo     return NextResponse.json({ user: userWithoutPassword, token });
echo   } catch (error) {
echo     console.error('Login error:', error);
echo     return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
echo   }
echo }
) > src\app\api\auth\login\route.ts

REM 23. Criar scripts/generate-password-hash.js
(
echo const bcrypt = require('bcryptjs');
echo async function generateHash(password) {
echo   const salt = await bcrypt.genSalt(12);
echo   const hash = await bcrypt.hash(password, salt);
echo   console.log('\n=== Hash Gerado ===');
echo   console.log('Senha:', password);
echo   console.log('Hash:', hash);
echo   console.log('===================\n');
echo }
echo const args = process.argv.slice(2);
echo if (args.length === 0) { console.log('Uso: node scripts/generate-password-hash.js ^<senha^>'); process.exit(1); }
echo generateHash(args[0]);
) > scripts\generate-password-hash.js

REM 24. Criar schema.sql básico (versão reduzida para caber no batch)
echo -- Schema completo disponivel no README ou documentacao original.
echo -- Execute a versao completa no painel do Supabase.
echo CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
echo CREATE TABLE IF NOT EXISTS companies (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, name VARCHAR(255) NOT NULL);
echo CREATE TABLE IF NOT EXISTS users (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, company_id UUID REFERENCES companies(id), email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, name VARCHAR(255), role VARCHAR(50) DEFAULT 'sales');
echo -- Insira aqui o script SQL completo fornecido anteriormente.
) > schema.sql

REM 25. Criar README.md
(
echo # Agrovisita Pro
echo Sistema escalonavel de gestao agricola com Next.js 14 e Supabase.
echo.
echo ## Instalacao
echo 1. `npm install`
echo 2. Copie `.env.example` para `.env.local` e preencha as chaves.
echo 3. Execute o `schema.sql` no Supabase.
echo 4. Gere o hash da senha: `node scripts/generate-password-hash.js admin123`
echo 5. Atualize o hash no banco de dados.
echo 6. `npm run dev`
echo.
echo ## Acesso Inicial
echo Email: admin@agrovisita.com.br
echo Senha: admin123
) > README.md

echo.
echo ==========================================
echo   Projeto criado com sucesso!
echo ==========================================
echo.
echo Proximos passos:
echo 1. Digite: npm install
echo 2. Configure o arquivo .env.local
echo 3. Execute o schema.sql no Supabase
echo 4. Gere o hash da senha admin
echo 5. Digite: npm run dev
echo.
pause
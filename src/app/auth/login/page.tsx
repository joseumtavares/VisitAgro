'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Lock, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [identifier, setIdentifier] = useState('');
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
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha no login');
      }

      login(data.user, data.token);
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.message || 'Falha no login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-dark-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-dark-900 border border-dark-800 rounded-2xl p-8 shadow-2xl">
        <div className="mb-8">
          <Image
            src="/branding/visitagro-fortsul-logo-login.svg"
            alt="VisitAgro Pro Fortsul"
            width={280}
            height={180}
            className="h-auto w-auto max-w-full"
            priority
          />
          <div className="mt-4">
            <h1 className="text-2xl font-bold">VisitAgro Pro</h1>
            <p className="text-sm text-dark-400">Acesse sua conta</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-dark-300 mb-2">Usuário ou e-mail</label>
            <div className="relative">
              <User className="w-4 h-4 text-dark-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Digite seu usuário ou e-mail"
                className="w-full bg-dark-950 border border-dark-700 rounded-lg py-3 pl-10 pr-4 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-dark-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full bg-dark-950 border border-dark-700 rounded-lg py-3 pl-10 pr-4 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="mt-6 text-xs text-dark-500 text-center">
          Use as credenciais fornecidas pelo administrador.
        </p>
      </div>
    </main>
  );
}

'use client';

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
}
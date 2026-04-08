'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { LeafletProvider } from '@/components/map/LeafletProvider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, token, router]);

  if (!isAuthenticated || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <LeafletProvider>
      <div className="min-h-screen">
        {children}
      </div>
    </LeafletProvider>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Higher-order component to protect routes requiring authentication
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect if still loading or already on login page
    if (loading) return;
    
    if (!user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  // Show loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#111827',
        color: '#2EDEA8',
        fontSize: '18px',
      }}>
        Loading...
      </div>
    );
  }

  // Show nothing if redirecting
  if (!user && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}

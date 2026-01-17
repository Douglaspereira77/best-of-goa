'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Client-side admin guard hook
 * Redirects non-admin users to home page
 *
 * Note: The middleware already protects admin routes,
 * this is a secondary protection for client components
 */
export function useAdminGuard() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login?redirect=' + encodeURIComponent(window.location.pathname));
      } else if (!isAdmin) {
        router.replace('/?error=unauthorized');
      }
    }
  }, [user, isAdmin, isLoading, router]);

  return {
    isLoading,
    isAuthorized: !isLoading && user && isAdmin,
  };
}

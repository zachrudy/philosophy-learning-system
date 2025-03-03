'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { USER_ROLES } from '@/lib/constants';

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: keyof typeof USER_ROLES;
}

export default function AuthGuard({
  children,
  requiredRole
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If not authenticated, redirect to login
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname || '/')}`);
      return;
    }

    // If authenticated but required role doesn't match
    if (status === 'authenticated' &&
        requiredRole &&
        session?.user?.role !== requiredRole) {
      // Redirect admin-only pages to dashboard
      if (requiredRole === USER_ROLES.ADMIN) {
        router.push('/dashboard');
      }
    }
  }, [status, session, router, pathname, requiredRole]);

  // Show loading state while checking authentication
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If there's a required role and the user doesn't have it, show an error
  if (requiredRole && session?.user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-700 mb-4">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // If everything's okay, render the children
  return <>{children}</>;
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define paths that require authentication
  const protectedPaths = ['/dashboard', '/profile', '/admin'];

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some(prefix =>
    path === prefix || path.startsWith(`${prefix}/`)
  );

  if (isProtectedPath) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    // If not authenticated, redirect to sign-in page with a callback URL
    if (!token) {
      const url = new URL('/auth/signin', request.url);
      url.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(url);
    }

    // Check for admin-only paths
    if (path.startsWith('/admin') && token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

// Configure paths that this middleware will run on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/admin/:path*',
  ],
};

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/logout',
  '/api/auth/status',
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public API routes and static assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/public') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Check if this is a public API route
  if (pathname.startsWith('/api/')) {
    if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
      return NextResponse.next();
    }

    // Validate session for all other API routes
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Inject userId into headers for downstream route handlers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', session.sub);
    requestHeaders.set('x-user-email', session.email);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // For page routes, let them through (client-side auth handles redirects)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

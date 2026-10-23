import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { corsHeaders, parseAllowedOrigins, resolveCorsOrigin } from '@/lib/security/cors-policy';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ================================================
  // CORS for API (explicit allowlist from env, never wildcard)
  // ================================================

  if (pathname.startsWith('/api/')) {
    const allowedOrigin = resolveCorsOrigin(
      request.headers.get('origin'),
      parseAllowedOrigins(process.env.ALLOWED_ORIGINS)
    );

    if (request.method === 'OPTIONS') {
      if (!allowedOrigin) {
        return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
      }
      return new NextResponse(null, {
        status: 204,
        headers: {
          ...corsHeaders(allowedOrigin),
          'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-automation-token, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const apiResponse = NextResponse.next();
    if (allowedOrigin) {
      const headers = corsHeaders(allowedOrigin);
      for (const key of Object.keys(headers)) {
        apiResponse.headers.set(key, headers[key]);
      }
    }
    return apiResponse;
  }

  const session = request.cookies.get('session');
  const mustChangePw = request.cookies.get('must_change_pw');

  const isChangePassword = pathname === '/admin/change-password';
  const isAdminRoute = pathname.startsWith('/admin');

  // ================================================
  // Route Protection
  // ================================================

  if (isAdminRoute) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (mustChangePw && !isChangePassword) {
      return NextResponse.redirect(new URL('/admin/change-password', request.url));
    }

    if (!mustChangePw && isChangePassword) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  if (pathname === '/login' && session) {
    if (mustChangePw) {
      return NextResponse.redirect(new URL('/admin/change-password', request.url));
    }
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  if (pathname === '/setup' && session && !mustChangePw) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // ================================================
  // Security Headers
  // ================================================

  const response = NextResponse.next();

  // Content Security & Protection Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Prevent caching of sensitive pages
  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    );
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/setup', '/api/:path*'],
};

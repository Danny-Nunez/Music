import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Skip NextAuth for mobile API paths
  if (request.nextUrl.pathname.startsWith('/api/mobile') || request.nextUrl.pathname.startsWith('/api/auth/mobile')) {
    return NextResponse.next();
  }

  // For all other paths, check for session
  const session = await getToken({ req: request });
  if (!session) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

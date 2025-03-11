import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Skip NextAuth for /api/mobile paths
  if (request.nextUrl.pathname.startsWith('/api/mobile')) {
    return NextResponse.next();
  }

  // For all other paths, check for session
  const session = await getToken({ req: request });
  if (!session && !request.nextUrl.pathname.startsWith('/api/mobile')) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!api/mobile|_next/static|_next/image|favicon.ico).*)',
  ],
};

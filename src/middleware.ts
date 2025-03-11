import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Skip NextAuth for /api/mobile paths
  if (request.nextUrl.pathname.startsWith('/api/mobile')) {
    return NextResponse.next();
  }
}

export const config = {
  matcher: '/api/:path*',
};

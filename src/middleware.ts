import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Skip auth check for mobile API paths
  if (
    request.nextUrl.pathname.startsWith('/api/mobile') || 
    request.nextUrl.pathname.startsWith('/api/auth/mobile') ||
    request.nextUrl.pathname.startsWith('/api/playlists/mobile')
  ) {
    console.log('Skipping auth for mobile path:', request.nextUrl.pathname);
    return NextResponse.next();
  }

  // For all other paths, check for session
  const session = await getToken({ req: request });
  if (!session) {
    console.log('No session, redirecting to signin');
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Include all API routes except mobile paths
    '/(api/(?!mobile|auth/mobile|playlists/mobile).*)',
    // Include all non-API routes except static assets
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

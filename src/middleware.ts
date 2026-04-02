import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CORS_METHODS = 'GET, POST, PUT, DELETE, OPTIONS';
const CORS_HEADERS =
  'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Session-Token';

function applyApiCors(request: NextRequest, response: NextResponse) {
  response.headers.set('Access-Control-Allow-Methods', CORS_METHODS);
  response.headers.set('Access-Control-Allow-Headers', CORS_HEADERS);
  // `*` + `Access-Control-Allow-Credentials: true` is invalid and breaks credentialed fetches (e.g. NextAuth session).
  const origin = request.headers.get('origin');
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.append('Vary', 'Origin');
  }
}

export function middleware(request: NextRequest) {
  if (request.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 200 });
    applyApiCors(request, res);
    res.headers.set('Access-Control-Max-Age', '86400');
    return res;
  }

  const response = NextResponse.next();
  applyApiCors(request, response);
  return response;
}

// Skip /api/auth/* so NextAuth routes are not wrapped in extra CORS headers (avoids broken
// session/csrf fetches and redirect/CORS edge cases with some hosts and proxies).
export const config = {
  matcher: ['/api/((?!auth/).*)'],
};

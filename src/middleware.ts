import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define allowed origins for CORS
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'https://your-production-domain.com', // Replace with your actual production domain
  // Add other allowed origins as needed
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Session-Token',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Handle actual request
  const response = NextResponse.next();

  // Add CORS headers to all responses with proper origin validation
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Session-Token');
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  return response;
}

// Configure which paths should be processed by this middleware
export const config = {
  matcher: [
    '/api/:path*',
    '/api/popular-artists',
    '/api/proxy-image',
    '/api/search',
    '/api/get-latest-cloudinary-url',
  ],
};

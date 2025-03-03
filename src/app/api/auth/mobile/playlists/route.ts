import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*'
    },
  });
}

export async function GET(request: Request) {
  try {
    // Log request details
    console.log('Request method:', request.method);
    console.log('All headers:', Object.fromEntries(request.headers.entries()));
    
    // Add CORS headers to response
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    // Try to get Authorization from x-vercel-sc-headers
    let sessionToken;
    const scHeaders = request.headers.get('x-vercel-sc-headers');
    if (scHeaders) {
      try {
        const parsedHeaders = JSON.parse(scHeaders);
        sessionToken = parsedHeaders.Authorization?.replace('Bearer ', '');
        console.log('Token from x-vercel-sc-headers:', sessionToken);
      } catch (e) {
        console.error('Failed to parse x-vercel-sc-headers:', e);
      }
    }

    // Fallback to normal Authorization header if not found in x-vercel-sc-headers
    if (!sessionToken) {
      sessionToken = request.headers.get('Authorization')?.replace('Bearer ', '');
      console.log('Token from Authorization header:', sessionToken);
    }

    console.log('Final token being used:', sessionToken);

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers }
      );
    }

    // Get user from session token
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true }
    });
    console.log('Session lookup result:', session ? { 
      id: session.id, 
      userId: session.userId,
      expires: session.expires 
    } : 'not found');

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401, headers }
      );
    }

    // Get user's playlists with songs
    const playlists = await prisma.playlist.findMany({
      where: { userId: session.user.id },
      include: {
        songs: {
          include: {
            song: true
          }
        }
      }
    });

    return NextResponse.json(playlists, { headers });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  }
}
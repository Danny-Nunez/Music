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
    
    // Add CORS headers to response
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    // Get token from Authorization header first
    let sessionToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    console.log('Token from Authorization header:', sessionToken);

    // If no token in Authorization header, check forwarded header
    if (!sessionToken) {
      const forwarded = request.headers.get('forwarded');
      if (forwarded) {
        const match = forwarded.match(/sig=([^;]+)/);
        if (match) {
          const sig = match[1];
          // Decode base64
          const decoded = Buffer.from(sig, 'base64').toString();
          // Extract token from "Bearer <token>"
          sessionToken = decoded.replace('Bearer ', '');
          console.log('Token from forwarded header:', sessionToken);
        }
      }
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
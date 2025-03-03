import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',  // Allow our custom header
      'Access-Control-Allow-Origin': '*'
    },
  });
}

export async function GET(request: Request) {
  try {
    console.log('Request method:', request.method);
    console.log('Raw headers:', Object.fromEntries(request.headers.entries()));
    
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token'  // Allow our custom header
    };

    // Get token from custom header
    const sessionToken = request.headers.get('x-session-token');
    console.log('Session token from custom header:', sessionToken);

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
          'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token'  // Keep consistent
        }
      }
    );
  }
}
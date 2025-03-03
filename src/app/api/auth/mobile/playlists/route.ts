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
    // Log ALL request details
    console.log('Request method:', request.method);
    console.log('Raw headers:', Object.fromEntries(request.headers.entries()));
    
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    // Try multiple ways to get the token
    let sessionToken;
    
    // 1. Try direct Authorization header
    const authHeader = request.headers.get('Authorization');
    console.log('Direct Authorization header:', authHeader);
    
    // 2. Try x-vercel-proxy-signature
    const proxySignature = request.headers.get('x-vercel-proxy-signature');
    console.log('Proxy signature:', proxySignature);
    
    // 3. Try x-vercel-sc-headers
    const scHeaders = request.headers.get('x-vercel-sc-headers');
    console.log('SC headers:', scHeaders);
    
    // 4. Try forwarded header
    const forwarded = request.headers.get('forwarded');
    console.log('Forwarded header:', forwarded);

    // First try Authorization
    if (authHeader) {
      sessionToken = authHeader.replace('Bearer ', '');
      console.log('Using token from Authorization:', sessionToken);
    }
    
    // Then try SC headers
    if (!sessionToken && scHeaders) {
      try {
        const parsed = JSON.parse(scHeaders);
        if (parsed.Authorization) {
          sessionToken = parsed.Authorization.replace('Bearer ', '');
          console.log('Using token from SC headers:', sessionToken);
        }
      } catch (e) {
        console.error('Failed to parse SC headers:', e);
      }
    }

    // Finally try forwarded header
    if (!sessionToken && forwarded) {
      const match = forwarded.match(/sig=([^;]+)/);
      if (match) {
        try {
          const sig = match[1];
          const decoded = Buffer.from(sig, 'base64').toString();
          if (decoded.startsWith('Bearer ')) {
            sessionToken = decoded.replace('Bearer ', '');
            console.log('Using token from forwarded:', sessionToken);
          }
        } catch (e) {
          console.error('Failed to decode forwarded:', e);
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
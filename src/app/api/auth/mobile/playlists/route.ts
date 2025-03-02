import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const sessionToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from session token
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true }
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
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

    return NextResponse.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
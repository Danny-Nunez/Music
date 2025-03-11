import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
      'Access-Control-Allow-Origin': '*'
    },
  });
}

export async function POST(request: Request) {
  try {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token'
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

    // Parse request body
    const body = await request.json();
    const { playlistId, song } = body;

    if (!playlistId || !song?.videoId || !song?.title || !song?.artist || !song?.thumbnail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers }
      );
    }

    // Verify playlist ownership
    const playlist = await prisma.playlist.findFirst({
      where: {
        id: playlistId,
        userId: session.user.id
      }
    });

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found or unauthorized' },
        { status: 404, headers }
      );
    }

    // Add song to playlist using a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create or update the song
      const upsertedSong = await tx.song.upsert({
        where: { videoId: song.videoId },
        update: {
          title: song.title,
          artist: song.artist,
          thumbnail: song.thumbnail
        },
        create: {
          videoId: song.videoId,
          title: song.title,
          artist: song.artist,
          thumbnail: song.thumbnail
        }
      });

      // Create the playlist-song connection if it doesn't exist
      try {
        await tx.playlistSong.create({
          data: {
            playlistId: playlist.id,
            songId: upsertedSong.videoId
          }
        });
      } catch (error: unknown) {
        // If the song is already in the playlist, we can ignore the unique constraint error
        if (error instanceof Error && 'code' in error && error.code !== 'P2002') { // P2002 is Prisma's unique constraint violation error
          throw error;
        }
        console.log('Song already exists in playlist');
      }

      return upsertedSong;
    });

    return NextResponse.json(
      { 
        success: true,
        message: 'Song added to playlist',
        song: result
      },
      { headers }
    );

  } catch (error: unknown) {
    console.error('Error adding song to playlist:', error);
    return NextResponse.json(
      { 
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token'
        }
      }
    );
  }
}

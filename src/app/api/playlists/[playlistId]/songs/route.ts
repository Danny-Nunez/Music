import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/prisma';

interface PlaylistWithSongs {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  songs: Array<{
    videoId: string;
    title: string;
    artist: string;
    thumbnail: string | null;
  }>;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ playlistId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting song addition process...');
    const { playlistId } = await params;
    if (!playlistId) {
      throw new Error('No playlistId available');
    }
    
    console.log('Finding user with email:', session.user.email);
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      console.log('User not found for email:', session.user.email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.log('Found user:', user);

    let songData;
    try {
      const body = await request.json();
      console.log('Received request body:', body);
      
      if (!body || typeof body !== 'object') {
        console.log('Invalid body format:', body);
        return NextResponse.json(
          { error: 'Invalid song data' },
          { status: 400 }
        );
      }
      
      if (!body.id || !body.title || !body.artist) {
        console.log('Missing required fields:', body);
        return NextResponse.json(
          { error: 'Missing required song data fields' },
          { status: 400 }
        );
      }
      
      songData = body;
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Verify playlist exists and belongs to user
    const playlist = await prisma.playlist.findFirst({
      where: {
        id: playlistId,
        userId: user.id,
      },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found or unauthorized' },
        { status: 404 }
      );
    }

    try {
      console.log('Starting database transaction...');
      const result = await prisma.$transaction(async (tx) => {
        // First verify playlist ownership
        console.log('Verifying playlist ownership...');
        const playlistCheck = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM "Playlist"
          WHERE id = ${playlistId} AND "userId" = ${user.id}
        `;

        if (playlistCheck.length === 0) {
          throw new Error('Playlist not found or unauthorized');
        }
        console.log('Playlist ownership verified');

        // Create or update song
        console.log('Creating or updating song...');
        await tx.$executeRaw`
          INSERT INTO "Song" ("videoId", "title", "artist", "thumbnail", "createdAt", "updatedAt")
          VALUES (${songData.id}, ${songData.title}, ${songData.artist}, ${songData.thumbnail || ''}, NOW(), NOW())
          ON CONFLICT ("videoId")
          DO UPDATE SET
            "title" = ${songData.title},
            "artist" = ${songData.artist},
            "thumbnail" = ${songData.thumbnail || ''},
            "updatedAt" = NOW()
        `;

        // Create playlist-song connection
        console.log('Creating playlist-song connection...');
        await tx.$executeRaw`
          INSERT INTO "PlaylistSong" ("id", "playlistId", "songId", "createdAt")
          SELECT gen_random_uuid(), ${playlistId}, ${songData.id}, NOW()
          WHERE NOT EXISTS (
            SELECT 1 FROM "PlaylistSong"
            WHERE "playlistId" = ${playlistId} AND "songId" = ${songData.id}
          )
        `;

        // Get updated playlist data
        console.log('Fetching updated playlist data...');
        const playlistData = await tx.$queryRaw<Array<PlaylistWithSongs>>`
          SELECT p.*,
                 COALESCE(
                   json_agg(
                     json_build_object(
                       'videoId', s."videoId",
                       'title', s."title",
                       'artist', s."artist",
                       'thumbnail', s."thumbnail"
                     )
                   ) FILTER (WHERE s."videoId" IS NOT NULL),
                   '[]'
                 ) as songs
          FROM "Playlist" p
          LEFT JOIN "PlaylistSong" ps ON p.id = ps."playlistId"
          LEFT JOIN "Song" s ON ps."songId" = s."videoId"
          WHERE p.id = ${playlistId}
          GROUP BY p.id
        `;

        if (!playlistData || playlistData.length === 0) {
          throw new Error('Failed to fetch updated playlist');
        }
        console.log('Successfully fetched updated playlist');

        return playlistData[0];
      });

      console.log('Transaction completed successfully');
      
      // Emit song added event
      if (typeof window !== 'undefined') {
        const { emitSongAdded } = await import('../../../../../lib/events');
        emitSongAdded(playlistId, result);
      }
      
      return NextResponse.json(result);
    } catch (error) {
      console.error('Error in song addition:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        { error: 'Failed to add song to playlist', details: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/playlists/[playlistId]/songs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ playlistId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { playlistId } = await params;
    if (!playlistId) {
      throw new Error('No playlistId available');
    }

    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { songId } = await request.json();
    if (!songId) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
    }

    // Verify playlist exists and belongs to user
    const playlist = await prisma.playlist.findFirst({
      where: {
        id: playlistId,
        userId: user.id,
      },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found or unauthorized' },
        { status: 404 }
      );
    }

    try {
      // Remove song from playlist and get updated playlist
      const result = await prisma.$transaction(async (tx) => {
        // Remove connection between song and playlist
        await tx.$executeRaw`
          DELETE FROM "PlaylistSong"
          WHERE "playlistId" = ${playlistId} AND "songId" = ${songId}
        `;

        // Get updated playlist data
        const playlistData = await tx.$queryRaw<Array<PlaylistWithSongs>>`
          SELECT p.*,
                 COALESCE(
                   json_agg(
                     json_build_object(
                       'videoId', s."videoId",
                       'title', s."title",
                       'artist', s."artist",
                       'thumbnail', s."thumbnail"
                     )
                   ) FILTER (WHERE s."videoId" IS NOT NULL),
                   '[]'
                 ) as songs
          FROM "Playlist" p
          LEFT JOIN "PlaylistSong" ps ON p.id = ps."playlistId"
          LEFT JOIN "Song" s ON ps."songId" = s."videoId"
          WHERE p.id = ${playlistId}
          GROUP BY p.id
        `;

        if (!playlistData || playlistData.length === 0) {
          throw new Error('Failed to fetch updated playlist');
        }

        return playlistData[0];
      });

      return NextResponse.json(result);
    } catch (error) {
      console.error('Error removing song from playlist:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        { error: 'Failed to remove song from playlist', details: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in DELETE /api/playlists/[playlistId]/songs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: errorMessage },
      { status: 500 }
    );
  }
}
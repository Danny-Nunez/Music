import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';

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
  context: { params: { playlistId: string } }
) {
  try {
    console.log('Starting mobile song addition process...');
    
    // Get token from custom header
    const sessionToken = request.headers.get('x-session-token');
    console.log('Session token from custom header:', sessionToken);

    if (!sessionToken) {
      console.log('No session token provided');
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
    console.log('Session lookup result:', session ? { 
      id: session.id, 
      userId: session.userId,
      expires: session.expires 
    } : 'not found');

    if (!session?.user) {
      console.log('Invalid session');
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const { playlistId } = context.params;
    if (!playlistId) {
      throw new Error('No playlistId available');
    }

    // Parse and validate request body
    let songData;
    try {
      const body = await request.json();
      console.log('Received request body:', body);
      
      if (!body?.song?.videoId || !body?.song?.title) {
        console.log('Missing required fields:', body);
        return NextResponse.json(
          { error: 'Missing required song data fields (videoId or title)' },
          { status: 400 }
        );
      }

      // Create songData with required fields and ensure artist has a value
      songData = {
        id: body.song.videoId,
        title: body.song.title,
        artist: body.song.artist || 'Unknown Artist',
        thumbnail: body.song.thumbnail || ''
      };
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (!songData) {
      return NextResponse.json(
        { error: 'Failed to process song data' },
        { status: 400 }
      );
    }

    try {
      console.log('Starting database transaction...');
      const result = await prisma.$transaction(async (tx) => {
        // First verify playlist ownership
        console.log('Verifying playlist ownership...');
        const playlistCheck = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM "Playlist"
          WHERE id = ${playlistId} AND "userId" = ${session.user.id}
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
    console.error('Error in POST /api/playlists/mobile/[playlistId]/songs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token'
    }
  });
}

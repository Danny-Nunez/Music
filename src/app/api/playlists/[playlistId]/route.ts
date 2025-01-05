import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

// GET /api/playlists/[playlistId] - Get a specific playlist
export async function GET(
  request: Request,
  { params }: { params: Promise<{ playlistId: string }> }
) {
  try {
    const { playlistId } = await params;
    if (!playlistId) {
      throw new Error('No playlistId available');
    }

    // Get playlist with songs using raw query for better control
    const playlistData = await prisma.$queryRaw`
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

    if (!playlistData || !Array.isArray(playlistData) || playlistData.length === 0) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(playlistData[0]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching playlist:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to fetch playlist', details: errorMessage },
      { status: 500 }
    );
  }
}

// PATCH /api/playlists/[playlistId] - Update a playlist
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ playlistId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { playlistId } = await params;
    if (!playlistId) {
      throw new Error('No playlistId available');
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // First, try to find the user by email
    let user = await prisma.user.findUnique({
      where: {
        email: session.user.email!
      }
    });

    if (!user) {
      // If no user found by email, try to find by ID
      user = await prisma.user.findUnique({
        where: {
          id: session.user.id
        }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
    }

    // Verify playlist ownership and update
    const playlist = await prisma.playlist.findUnique({
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

    // Update the playlist name
    const updatedPlaylist = await prisma.playlist.update({
      where: {
        id: playlistId,
      },
      data: {
        name: body.name,
      },
    });

    return NextResponse.json(updatedPlaylist);
  } catch (error) {
    console.error('Error updating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to update playlist' },
      { status: 500 }
    );
  }
}

// DELETE /api/playlists/[playlistId] - Delete a playlist
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ playlistId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { playlistId } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, try to find the user by email
    let user = await prisma.user.findUnique({
      where: {
        email: session.user.email!
      }
    });

    if (!user) {
      // If no user found by email, try to find by ID
      user = await prisma.user.findUnique({
        where: {
          id: session.user.id
        }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
    }

    // Verify playlist ownership
    const playlist = await prisma.playlist.findUnique({
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

    // Delete the playlist
    await prisma.playlist.delete({
      where: {
        id: playlistId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return NextResponse.json(
      { error: 'Failed to delete playlist' },
      { status: 500 }
    );
  }
}
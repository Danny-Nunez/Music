import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '../../../lib/prisma';
import { authOptions } from '../../../lib/auth';

// GET /api/playlists - Get all playlists
export async function GET(request: Request) {
  try {
    console.log('GET /api/playlists - Starting...');
    
    const { searchParams } = new URL(request.url);
    const userOnly = searchParams.get('userOnly') === 'true';
    
    const session = await getServerSession(authOptions);
    const user = session?.user?.email ? 
      await prisma.user.findUnique({ where: { email: session.user.email } }) : 
      null;

    console.log('Fetching playlists for user:', user?.id);
    
    const playlists = await prisma.playlist.findMany({
      where: userOnly && user?.id ? { userId: user.id } : undefined,
      include: {
        user: {
          select: {
            name: true,
          },
        },
        songs: {
          include: {
            song: true,
          },
        },
      },
    });

    // Transform the data to match the expected format
    const formattedPlaylists = playlists.map(playlist => ({
      id: playlist.id,
      name: playlist.name,
      userId: playlist.userId,
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
      userName: playlist.user?.name || '',
      songs: playlist.songs.map(ps => ({
        videoId: ps.song.videoId,
        title: ps.song.title,
        artist: ps.song.artist,
        thumbnail: ps.song.thumbnail,
      })),
    }));

    console.log('Fetched playlists:', formattedPlaylists);
    return NextResponse.json(formattedPlaylists);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in GET /api/playlists:', errorMessage);
    
    return NextResponse.json(
      { error: 'Failed to fetch playlists', details: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/playlists - Create a new playlist
export async function POST(request: Request) {
  try {
    console.log('POST /api/playlists - Starting playlist creation...');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('No user email in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', body);

    const { name } = body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      console.log('Invalid playlist name:', name);
      return NextResponse.json(
        { error: 'Valid playlist name is required' },
        { status: 400 }
      );
    }

    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      console.log('User not found for email:', session.user.email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create new playlist
    const newPlaylist = await prisma.playlist.create({
      data: {
        name: name.trim(),
        userId: user.id,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // Format the response
    const formattedPlaylist = {
      id: newPlaylist.id,
      name: newPlaylist.name,
      userId: newPlaylist.userId,
      createdAt: newPlaylist.createdAt,
      updatedAt: newPlaylist.updatedAt,
      userName: newPlaylist.user?.name || '',
      songs: [],
    };

    console.log('Created playlist:', formattedPlaylist);
    return NextResponse.json(formattedPlaylist);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in POST /api/playlists:', errorMessage);
    
    return NextResponse.json(
      { error: 'Failed to create playlist', details: errorMessage },
      { status: 500 }
    );
  }
}
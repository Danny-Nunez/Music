import { NextResponse } from 'next/server';
import YTMusic from 'ytmusic-api';
import { fetchAlbumViaRapidYoutubeMusic3 } from '@/lib/rapidYoutubeMusic3Album';

interface Thumbnail {
  url: string;
  width: number;
  height: number;
}

interface Artist {
  artistId: string | null;
  name: string;
}

interface PlaylistSong {
  type: 'SONG';
  videoId: string;
  name: string;
  artist: Artist;
  album: {
    albumId: string;
    name: string;
  };
  duration: number;
  thumbnails: Thumbnail[];
}

interface PlaylistResponse {
  type: 'ALBUM';
  albumId: string;
  name: string;
  playlistId: string;
  artist: Artist;
  year: number;
  thumbnails: Thumbnail[];
  songs: PlaylistSong[];
}

interface AlbumResponse {
  type: 'ALBUM';
  albumId: string;
  name: string;
  playlistId?: string;
  artist: Artist;
  year?: number;
  thumbnails: Thumbnail[];
  songs: PlaylistSong[];
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const albumId = url.searchParams.get('albumId');

  if (!albumId) {
    return NextResponse.json(
      { error: 'Missing albumId query parameter' },
      { status: 400 }
    );
  }

  const isPlaylist = albumId.startsWith('PL') || albumId.startsWith('VLPL');
  const cleanId = albumId;

  if (!isPlaylist) {
    const rapidAlbum = await fetchAlbumViaRapidYoutubeMusic3(albumId);
    if (rapidAlbum) {
      console.log('[getalbum] source: rapid youtube-music-api3', albumId);
      return NextResponse.json(rapidAlbum, { status: 200 });
    }
  }

  const ytmusic = new YTMusic();

  try {
    console.log('Initializing YTMusic API...');
    await ytmusic.initialize();

    console.log(`Fetching details for ID: ${albumId}`);

    let result: AlbumResponse;
    if (isPlaylist) {
      // Add VL prefix if not present for playlist fetch
      const playlistId = cleanId.startsWith('VL') ? cleanId : `VL${cleanId}`;
      const playlistResponse = await ytmusic.getPlaylist(playlistId) as unknown as PlaylistResponse;
      console.log('Full playlist data:', playlistResponse);

      if (!playlistResponse) {
        throw new Error('Playlist not found');
      }

      // Return the playlist response directly since it matches our AlbumResponse format
      result = {
        type: 'ALBUM',
        albumId: playlistResponse.albumId,
        name: playlistResponse.name,
        playlistId: cleanId,
        artist: playlistResponse.artist,
        year: playlistResponse.year,
        thumbnails: playlistResponse.thumbnails,
        songs: playlistResponse.songs || []
      };
    } else {
      const albumData = await ytmusic.getAlbum(albumId);
      result = {
        type: 'ALBUM',
        albumId: albumData.albumId,
        name: albumData.name,
        playlistId: albumData.playlistId,
        artist: {
          artistId: albumData.artist?.artistId || null,
          name: albumData.artist?.name || ''
        },
        year: albumData.year || undefined,
        thumbnails: albumData.thumbnails,
        songs: (albumData.songs || []).map(song => ({
          type: 'SONG',
          videoId: song.videoId,
          name: song.name,
          artist: {
            artistId: song.artist?.artistId || null,
            name: song.artist?.name || ''
          },
          album: {
            albumId: song.album?.albumId || albumData.albumId,
            name: song.album?.name || albumData.name
          },
          duration: song.duration || 0,
          thumbnails: song.thumbnails || []
        }))
      };
    }

    console.log('Transformed Result:', result);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error in proxy API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch album data from YTMusic API' },
      { status: 500 }
    );
  }
}

import { NextRequest } from 'next/server';
import { playlist_info, validate } from 'play-dl';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const playlistUrl = searchParams.get('url');

  if (!playlistUrl) {
    return new Response(
      JSON.stringify({ error: 'Missing playlist url. Provide a playlist URL using the "url" query parameter.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Extract playlist ID from URL
    const playlistId = playlistUrl.split('list=')[1]?.split('&')[0];
    
    if (!playlistId || !validate(playlistId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid playlist URL. Please provide a valid YouTube playlist URL.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const playlistInfo = await playlist_info(playlistUrl, { incomplete: true });
    const videos = await playlistInfo.all_videos();

    const playlist = videos.map(video => ({
      id: video.id,
      title: video.title,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      thumbnail: video.thumbnails[0]?.url,
      duration: video.durationInSec,
      channel: {
        name: video.channel?.name,
        url: video.channel?.url
      }
    }));

    return new Response(
      JSON.stringify({
        title: playlistInfo.title,
        thumbnail: playlistInfo.thumbnail?.url,
        videos: playlist,
        totalVideos: playlist.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch playlist data. Please ensure the playlist is public and the URL is correct.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

import { NextRequest } from 'next/server';
import { playlist_info, validate } from 'play-dl';

interface PlayDLVideo {
  id: string;
  title: string;
  thumbnails: Array<{ url: string }>;
  durationInSec: number;
  channel?: {
    name: string;
    url: string;
  };
}

// Default timeout of 30 seconds
const TIMEOUT = 30000;
// Maximum of 60 videos per playlist
const MAX_VIDEOS = 100;

export async function GET(req: NextRequest) {
  // Create a timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Request timeout'));
    }, TIMEOUT);
  });

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

    // Get playlist info
    const playlistInfo = await Promise.race([
      playlist_info(playlistUrl, { incomplete: true }),
      timeoutPromise
    ]) as Awaited<ReturnType<typeof playlist_info>>;

    // Get only the first page of videos
    const videos = await Promise.race([
      (async () => {
        const firstPage = await playlistInfo.next();
        return firstPage?.slice(0, MAX_VIDEOS) || [];
      })(),
      timeoutPromise
    ]) as PlayDLVideo[];
    
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
        totalVideos: playlistInfo.total_videos || videos.length,
        returnedVideos: videos.length,
        limited: (playlistInfo.total_videos || videos.length) > videos.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching playlist:', error);
    const errorMessage = error instanceof Error && error.message === 'Request timeout'
      ? 'Request timed out. The playlist might be too large or there might be connection issues.'
      : 'Failed to fetch playlist data. Please ensure the playlist is public and the URL is correct.';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

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

// Single timeout value for all operations
const TIMEOUT = 15000;
// Maximum videos to return
const MAX_VIDEOS = 65;

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

    // Get playlist info
    const playlistInfo = await Promise.race([
      playlist_info(playlistUrl, { incomplete: true }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), TIMEOUT))
    ]) as Awaited<ReturnType<typeof playlist_info>>;

    // Always try all_videos first with a quick timeout
    let videos: PlayDLVideo[] = [];
    try {
      videos = await Promise.race([
        playlistInfo.all_videos(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Quick timeout')), 5000))
      ]) as PlayDLVideo[];
    } catch {
      // If quick all_videos fails, try next() with full timeout
      const firstPage = await Promise.race([
        playlistInfo.next(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), TIMEOUT))
      ]) as PlayDLVideo[];
      videos = firstPage || [];
    }

    // Ensure we don't exceed MAX_VIDEOS
    const limitedVideos = videos.slice(0, MAX_VIDEOS);
    
    const playlist = limitedVideos.map(video => ({
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
        returnedVideos: playlist.length,
        limited: (playlistInfo.total_videos || videos.length) > playlist.length
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

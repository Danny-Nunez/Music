import { NextRequest } from 'next/server';
import { playlist_info, yt_validate } from 'play-dl';
import YoutubeMusicApi from 'youtube-music-api';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ytlist = require('youtube-playlist') as (
  url: string,
  opt?: string | string[]
) => Promise<{ data: { name?: string; playlist: Array<{ id?: string; name?: string; url?: string; duration?: number }> } }>;
import YTMusic from 'ytmusic-api';

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

/** Normalized shape returned by the API */
interface NormalizedPlaylist {
  title: string;
  thumbnail?: string;
  videos: Array<{
    id: string;
    title: string;
    url: string;
    thumbnail?: string;
    duration: number;
    channel: { name: string; url?: string };
  }>;
}

// Single timeout value for all operations
const TIMEOUT = 15000;
// Maximum videos to return
const MAX_VIDEOS = 65;

// YouTube auto-generated / Mix / Radio playlists use different IDs and aren't supported by play-dl
const UNSUPPORTED_PLAYLIST_PREFIXES = ['RD', 'RDCL', 'OL', 'LL', 'FL'];
function isUnsupportedPlaylistType(playlistId: string): boolean {
  return UNSUPPORTED_PLAYLIST_PREFIXES.some((prefix) =>
    playlistId.toUpperCase().startsWith(prefix)
  );
}

function buildJsonResponse(payload: NormalizedPlaylist & { totalVideos?: number; returnedVideos?: number; limited?: boolean; source?: string }) {
  const body = {
    ...payload,
    totalVideos: payload.totalVideos ?? payload.videos.length,
    returnedVideos: payload.videos.length,
    limited: (payload.totalVideos ?? payload.videos.length) > payload.videos.length,
  };
  console.log('[getplaylist] response:', JSON.stringify(body, null, 2));
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

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
    // Extract and clean playlist ID from URL (avoid encoding/extra params issues)
    let playlistIdRaw = playlistUrl.split('list=')[1]?.split('&')[0]?.split('#')[0]?.trim();
    if (playlistIdRaw) {
      try {
        playlistIdRaw = decodeURIComponent(playlistIdRaw);
      } catch {
        // keep as-is if decode fails
      }
    }
    const playlistId = playlistIdRaw ?? '';
    const cleanPlaylistUrl = `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`;
    console.log('[getplaylist] cleaned URL:', cleanPlaylistUrl, 'playlistId:', playlistId);

    if (!playlistId || yt_validate(cleanPlaylistUrl) !== 'playlist') {
      return new Response(
        JSON.stringify({ error: 'Invalid playlist URL. Please provide a valid YouTube playlist URL.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1) Try play-dl first (skip for known unsupported types to save time)
    if (!isUnsupportedPlaylistType(playlistId)) {
      try {
        const playlistInfo = await Promise.race([
          playlist_info(cleanPlaylistUrl, { incomplete: true }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), TIMEOUT))
        ]) as Awaited<ReturnType<typeof playlist_info>>;

        let videos: PlayDLVideo[] = [];
        try {
          videos = await Promise.race([
            playlistInfo.all_videos(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Quick timeout')), 5000))
          ]) as PlayDLVideo[];
        } catch {
          const firstPage = await Promise.race([
            playlistInfo.next(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), TIMEOUT))
          ]) as PlayDLVideo[];
          videos = firstPage || [];
        }

        const limitedVideos = videos.slice(0, MAX_VIDEOS);
        const normalized: NormalizedPlaylist = {
          title: playlistInfo.title ?? 'Playlist',
          thumbnail: playlistInfo.thumbnail?.url,
          videos: limitedVideos.map((video) => ({
            id: video.id,
            title: video.title,
            url: `https://www.youtube.com/watch?v=${video.id}`,
            thumbnail: video.thumbnails[0]?.url,
            duration: video.durationInSec,
            channel: { name: video.channel?.name ?? '', url: video.channel?.url }
          }))
        };
        console.log('[getplaylist] source=play-dl raw playlistInfo.title:', playlistInfo.title, 'videosCount:', limitedVideos.length);
        return buildJsonResponse({ ...normalized, totalVideos: playlistInfo.total_videos ?? videos.length, source: 'play-dl' });
      } catch (playDlError) {
        console.log('[getplaylist] play-dl failed:', playDlError instanceof Error ? playDlError.message : String(playDlError));
      }
    }

    // 2) Fallback: youtube-music-api
    try {
      const api = new YoutubeMusicApi();
      await api.initalize();
      const browseId = playlistId.startsWith('VL') ? playlistId : `VL${playlistId}`;
      const result = await api.getPlaylist(browseId, MAX_VIDEOS);
      console.log('[getplaylist] source=youtube-music-api raw response:', JSON.stringify(result, null, 2));
      if (result && !('error' in result) && Array.isArray(result.content)) {
        const normalized: NormalizedPlaylist = {
          title: (result as { title?: string }).title ?? 'Playlist',
          thumbnail: (result as { thumbnails?: Array<{ url: string }> }).thumbnails?.[0]?.url,
          videos: (result as { content: Array<{ videoId: string; name: string; author?: { name: string } | Array<{ name: string }>; duration?: number; thumbnails?: Array<{ url: string }> }> }).content.slice(0, MAX_VIDEOS).map((item) => {
            const author = item.author;
            const name = Array.isArray(author) ? author[0]?.name : author?.name;
            return {
              id: item.videoId,
              title: item.name,
              url: `https://www.youtube.com/watch?v=${item.videoId}`,
              thumbnail: item.thumbnails?.[0]?.url,
              duration: typeof item.duration === 'number' ? Math.round(item.duration / 1000) : 0,
              channel: { name: name ?? '' }
            };
          })
        };
        return buildJsonResponse({ ...normalized, source: 'youtube-music-api' });
      }
    } catch (e) {
      console.log('[getplaylist] youtube-music-api fallback failed:', e instanceof Error ? e.message : String(e));
    }

    // 3) Fallback: youtube-playlist (scraper) – use clean URL
    try {
      const result = await ytlist(cleanPlaylistUrl, ['id', 'name', 'url', 'duration']);
      console.log('[getplaylist] source=youtube-playlist raw response:', JSON.stringify(result, null, 2));
      const data = result?.data;
      if (data?.playlist && Array.isArray(data.playlist) && data.playlist.length > 0) {
        const normalized: NormalizedPlaylist = {
          title: (data.name && data.name.trim()) ? data.name : 'Playlist',
          videos: data.playlist.slice(0, MAX_VIDEOS).map((item: { id?: string; name?: string; url?: string; duration?: number }) => ({
            id: item.id ?? '',
            title: item.name ?? '',
            url: item.url ?? `https://www.youtube.com/watch?v=${item.id ?? ''}`,
            duration: typeof item.duration === 'number' ? item.duration : 0,
            channel: { name: '' }
          }))
        };
        return buildJsonResponse({ ...normalized, source: 'youtube-playlist' });
      }
    } catch (e) {
      console.log('[getplaylist] youtube-playlist fallback failed:', e instanceof Error ? e.message : String(e));
    }

    // 4) Fallback: ytmusic-api
    try {
      const ytmusic = new YTMusic();
      await ytmusic.initialize();
      const playlistIdForYtMusic = playlistId.startsWith('VL') ? playlistId : `VL${playlistId}`;
      const [meta, videosList] = await Promise.all([
        ytmusic.getPlaylist(playlistIdForYtMusic),
        ytmusic.getPlaylistVideos(playlistIdForYtMusic)
      ]);
      console.log('[getplaylist] source=ytmusic-api raw meta:', JSON.stringify(meta, null, 2));
      console.log('[getplaylist] source=ytmusic-api raw videos (first 3):', JSON.stringify(videosList?.slice(0, 3), null, 2));
      if (meta && Array.isArray(videosList)) {
        const normalized: NormalizedPlaylist = {
          title: meta.name ?? 'Playlist',
          thumbnail: meta.thumbnails?.[0]?.url,
          videos: videosList.slice(0, MAX_VIDEOS).map((v: { videoId: string; name: string; artist?: { name: string }; duration?: number | null; thumbnails?: Array<{ url: string }> }) => ({
            id: v.videoId,
            title: v.name,
            url: `https://www.youtube.com/watch?v=${v.videoId}`,
            thumbnail: v.thumbnails?.[0]?.url,
            duration: typeof v.duration === 'number' ? Math.round(v.duration / 1000) : 0,
            channel: { name: v.artist?.name ?? '' }
          }))
        };
        return buildJsonResponse({ ...normalized, totalVideos: meta.videoCount, source: 'ytmusic-api' });
      }
    } catch (e) {
      console.log('[getplaylist] ytmusic-api fallback failed:', e instanceof Error ? e.message : String(e));
    }

    // All sources failed
    const fallbackError =
      "Could not load playlist with play-dl or fallbacks (youtube-music-api, youtube-playlist, ytmusic-api). If this is a Mix/Radio playlist, try a regular playlist.";
    return new Response(JSON.stringify({ error: fallbackError }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error fetching playlist:', err.message, err.stack);
    const isTimeout = err.message === 'Request timeout' || err.message === 'Quick timeout';
    const isPlaylistTypeError =
      err.message.includes("reading 'browseId'") || err.message.includes('browseId');
    let errorMessage: string;
    let status = 500;
    if (isTimeout) {
      errorMessage =
        'Request timed out. The playlist might be too large or there might be connection issues.';
    } else if (isPlaylistTypeError) {
      status = 422;
      errorMessage =
        "This playlist type isn't supported (e.g. YouTube Mix or Radio). Try a regular playlist.";
    } else {
      errorMessage = `Failed to fetch playlist: ${err.message}`;
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

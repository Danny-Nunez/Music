import { NextRequest } from 'next/server';
import { playlist_info, yt_validate } from 'play-dl';
import { Client, MixPlaylist, Playlist } from 'youtubei';
import type { VideoCompact } from 'youtubei';
import { isUnsupportedPlaylistType } from '@/lib/youtubePlaylistSupport';
import { fetchPlaylistViaRapidApi138 } from '@/lib/rapidApiYoutube138';
import {
  getCachedPlaylistJson,
  isPlaylistCacheEnabled,
  setCachedPlaylistJson,
} from '@/lib/redisPlaylistCache';
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

async function fetchPlaylistViaYoutubei(cleanPlaylistUrl: string): Promise<(NormalizedPlaylist & { totalVideos?: number }) | null> {
  console.log('[getplaylist] youtubei request:', cleanPlaylistUrl);
  const client = new Client();
  let playlist: Playlist | MixPlaylist | undefined;
  try {
    playlist = (await Promise.race([
      client.getPlaylist(cleanPlaylistUrl),
      new Promise<undefined>((_, reject) => setTimeout(() => reject(new Error('Request timeout')), TIMEOUT)),
    ])) as Playlist | MixPlaylist | undefined;
  } catch (e) {
    console.log('[getplaylist] youtubei getPlaylist threw:', e instanceof Error ? e.message : String(e));
    if (e instanceof Error && e.stack) console.log('[getplaylist] youtubei stack:', e.stack);
    return null;
  }

  if (!playlist) {
    console.log('[getplaylist] youtubei getPlaylist returned undefined');
    return null;
  }

  const isMix = playlist instanceof MixPlaylist;
  const isPl = playlist instanceof Playlist;
  let rawSummary: Record<string, unknown> = {
    constructorName: playlist.constructor?.name,
    instanceofMixPlaylist: isMix,
    instanceofPlaylist: isPl,
    id: playlist.id,
    title: playlist.title,
    videoCount: playlist.videoCount,
  };
  if (playlist instanceof MixPlaylist) {
    rawSummary = { ...rawSummary, mixVideosArrayLength: playlist.videos?.length ?? 0 };
  } else if (playlist instanceof Playlist) {
    rawSummary = {
      ...rawSummary,
      continuableItemsLength: playlist.videos.items.length,
      continuation: playlist.videos.continuation ?? null,
    };
  } else {
    rawSummary = {
      ...rawSummary,
      note: 'not Playlist or MixPlaylist — instanceof check failed (possible bundle duplicate)',
    };
  }
  console.log('[getplaylist] youtubei raw playlist:', JSON.stringify(rawSummary, null, 2));

  let videoItems: VideoCompact[] = [];

  if (playlist instanceof MixPlaylist) {
    const raw = playlist.videos ?? [];
    const priv = raw.filter((v) => v.isPrivateOrDeleted);
    videoItems = raw.filter((v) => !v.isPrivateOrDeleted);
    console.log(
      '[getplaylist] youtubei MixPlaylist videos:',
      'raw',
      raw.length,
      'after dropping private/deleted',
      videoItems.length,
      'privateOrDeleted',
      priv.length
    );
    if (raw[0]) {
      console.log('[getplaylist] youtubei first mix item sample:', {
        id: raw[0].id,
        title: raw[0].title,
        isPrivateOrDeleted: raw[0].isPrivateOrDeleted,
      });
    }
  } else if (playlist instanceof Playlist) {
    let pages = 0;
    console.log(
      '[getplaylist] youtubei Playlist initial continuable length:',
      playlist.videos.items.length,
      'continuation:',
      playlist.videos.continuation ?? 'none'
    );
    while (playlist.videos.items.length < MAX_VIDEOS && pages < 12) {
      const before = playlist.videos.items.length;
      try {
        await playlist.videos.next(1);
      } catch (nextErr) {
        console.log(
          '[getplaylist] youtubei playlist.videos.next(1) stopped:',
          nextErr instanceof Error ? nextErr.message : String(nextErr)
        );
        break;
      }
      pages += 1;
      console.log(
        '[getplaylist] youtubei after next page',
        pages,
        'items:',
        playlist.videos.items.length,
        'continuation:',
        playlist.videos.continuation ?? 'none'
      );
      if (playlist.videos.items.length <= before) break;
    }
    const raw = playlist.videos.items;
    videoItems = raw.filter((v) => !v.isPrivateOrDeleted);
    console.log(
      '[getplaylist] youtubei Playlist final items:',
      raw.length,
      'usable (not private/deleted):',
      videoItems.length
    );
    if (raw[0]) {
      console.log('[getplaylist] youtubei first playlist item sample:', {
        id: raw[0].id,
        title: raw[0].title,
        isPrivateOrDeleted: raw[0].isPrivateOrDeleted,
      });
    }
  } else {
    console.log('[getplaylist] youtubei unknown type; keys:', Object.keys(playlist as object));
    return null;
  }

  if (videoItems.length === 0) {
    console.log('[getplaylist] youtubei bailing: zero usable videos after filters');
    return null;
  }

  const limited = videoItems.slice(0, MAX_VIDEOS);
  const playlistThumbnail =
    playlist instanceof Playlist
      ? playlist.thumbnails?.best ?? playlist.thumbnails?.min
      : limited[0]?.thumbnails?.best ?? limited[0]?.thumbnails?.min;

  const normalized: NormalizedPlaylist = {
    title: playlist.title || 'Playlist',
    thumbnail: playlistThumbnail,
    videos: limited.map((video) => ({
      id: video.id,
      title: video.title,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      thumbnail: video.thumbnails?.best ?? video.thumbnails?.min,
      duration: typeof video.duration === 'number' ? video.duration : 0,
      channel: { name: video.channel?.name ?? '', url: video.channel?.url },
    })),
  };
  return { ...normalized, totalVideos: playlist.videoCount };
}

async function respondPlaylistSuccess(
  playlistId: string,
  payload: NormalizedPlaylist & { totalVideos?: number; source?: string }
): Promise<Response> {
  const body = {
    ...payload,
    totalVideos: payload.totalVideos ?? payload.videos.length,
    returnedVideos: payload.videos.length,
    limited: (payload.totalVideos ?? payload.videos.length) > payload.videos.length,
  };
  const json = JSON.stringify(body);
  console.log(
    '[getplaylist] success source=',
    body.source,
    'videos=',
    body.returnedVideos,
    process.env.REDIS_URL ? '(caching)' : '(no REDIS_URL)'
  );
  await setCachedPlaylistJson(playlistId, json);
  return new Response(json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Playlist-Cache': 'MISS',
    },
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

    if (isPlaylistCacheEnabled()) {
      console.log('[getplaylist] redis: GET beatinbox:playlist:v1:' + playlistId);
    }
    const cachedJson = await getCachedPlaylistJson(playlistId);
    if (cachedJson) {
      console.log('[getplaylist] redis: HIT (served from cache)');
      return new Response(cachedJson, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Playlist-Cache': 'HIT',
        },
      });
    }
    if (isPlaylistCacheEnabled()) {
      console.log('[getplaylist] redis: MISS — resolving playlist upstream');
    }

    // Mix/Radio/etc.: try RapidAPI youtube138 (works on Vercel; needs RAPIDAPI_KEY).
    if (isUnsupportedPlaylistType(playlistId)) {
      try {
        const fromRapid = await fetchPlaylistViaRapidApi138(playlistId, MAX_VIDEOS, TIMEOUT);
        if (fromRapid) {
          console.log(
            '[getplaylist] source=rapidapi-youtube138 (mix/special) title:',
            fromRapid.title,
            'videos:',
            fromRapid.videos.length
          );
          return respondPlaylistSuccess(playlistId, {
            title: fromRapid.title,
            thumbnail: fromRapid.thumbnail,
            videos: fromRapid.videos,
            totalVideos: fromRapid.totalVideos,
            source: 'rapidapi-youtube138',
          });
        }
      } catch (e) {
        console.log('[getplaylist] rapidapi (mix/special) error:', e instanceof Error ? e.message : String(e));
      }
      return new Response(
        JSON.stringify({
          error:
            'This mix/radio playlist could not be loaded. Add RAPIDAPI_KEY for youtube138 (RapidAPI), or save the mix as a normal playlist on YouTube and open that link.',
          code: 'UNSUPPORTED_PLAYLIST_TYPE',
        }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1) youtubei (InnerTube)
    try {
      const fromYoutubei = await fetchPlaylistViaYoutubei(cleanPlaylistUrl);
      if (fromYoutubei) {
        console.log(
          '[getplaylist] source=youtubei title:',
          fromYoutubei.title,
          'videos:',
          fromYoutubei.videos.length
        );
        return respondPlaylistSuccess(playlistId, { ...fromYoutubei, source: 'youtubei' });
      }
    } catch (e) {
      console.log('[getplaylist] youtubei fallback failed:', e instanceof Error ? e.message : String(e));
    }

    // 2) RapidAPI youtube138
    try {
      const fromRapid = await fetchPlaylistViaRapidApi138(playlistId, MAX_VIDEOS, TIMEOUT);
      if (fromRapid) {
        console.log(
          '[getplaylist] source=rapidapi-youtube138 title:',
          fromRapid.title,
          'videos:',
          fromRapid.videos.length
        );
        return respondPlaylistSuccess(playlistId, {
          title: fromRapid.title,
          thumbnail: fromRapid.thumbnail,
          videos: fromRapid.videos,
          totalVideos: fromRapid.totalVideos,
          source: 'rapidapi-youtube138',
        });
      }
    } catch (e) {
      console.log('[getplaylist] rapidapi fallback failed:', e instanceof Error ? e.message : String(e));
    }

    // 3) play-dl
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
      return respondPlaylistSuccess(playlistId, {
        ...normalized,
        totalVideos: playlistInfo.total_videos ?? videos.length,
        source: 'play-dl',
      });
    } catch (playDlError) {
      console.log('[getplaylist] play-dl failed:', playDlError instanceof Error ? playDlError.message : String(playDlError));
    }

    // 4) Fallback: youtube-music-api
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
        return respondPlaylistSuccess(playlistId, { ...normalized, source: 'youtube-music-api' });
      }
    } catch (e) {
      console.log('[getplaylist] youtube-music-api fallback failed:', e instanceof Error ? e.message : String(e));
    }

    // 5) Fallback: youtube-playlist (scraper) – use clean URL
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
        return respondPlaylistSuccess(playlistId, { ...normalized, source: 'youtube-playlist' });
      }
    } catch (e) {
      console.log('[getplaylist] youtube-playlist fallback failed:', e instanceof Error ? e.message : String(e));
    }

    // 6) Fallback: ytmusic-api
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
        return respondPlaylistSuccess(playlistId, {
          ...normalized,
          totalVideos: meta.videoCount,
          source: 'ytmusic-api',
        });
      }
    } catch (e) {
      console.log('[getplaylist] ytmusic-api fallback failed:', e instanceof Error ? e.message : String(e));
    }

    const fallbackError =
      'Could not load this playlist (youtubei, RapidAPI, play-dl, and other sources failed). Check RAPIDAPI_KEY, or the playlist may be private or unavailable.';
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

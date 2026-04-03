/**
 * YouTube138 on RapidAPI — playlist videos.
 * https://rapidapi.com/Glavier/api/youtube138
 *
 * Env: RAPID_API_KEY or RAPIDAPI_KEY (albums use RAPID_YT_MUSIC_KEY in rapidYoutubeMusic3Album).
 */

function getRapidApiKey(): string | undefined {
  return process.env.RAPID_API_KEY || process.env.RAPIDAPI_KEY;
}

function extractText(field: unknown): string {
  if (typeof field === 'string') return field;
  if (field && typeof field === 'object' && 'text' in field && typeof (field as { text: unknown }).text === 'string') {
    return (field as { text: string }).text;
  }
  if (Array.isArray(field) && field[0] && typeof field[0] === 'object' && field[0] !== null && 'text' in field[0]) {
    const t = (field[0] as { text?: string }).text;
    return typeof t === 'string' ? t : '';
  }
  return '';
}

function pickThumbnail(obj: Record<string, unknown>): string | undefined {
  const thumbs = obj.thumbnail ?? obj.thumbnails;
  if (!thumbs) return undefined;
  if (typeof thumbs === 'string') return thumbs;
  if (Array.isArray(thumbs) && thumbs.length > 0) {
    const last = thumbs[thumbs.length - 1] as { url?: string };
    return typeof last?.url === 'string' ? last.url : undefined;
  }
  if (thumbs && typeof thumbs === 'object' && 'thumbnails' in thumbs) {
    const inner = (thumbs as { thumbnails?: Array<{ url?: string }> }).thumbnails;
    if (Array.isArray(inner) && inner.length > 0) {
      const u = inner[inner.length - 1]?.url;
      return typeof u === 'string' ? u : undefined;
    }
  }
  return undefined;
}

function extractChannelName(obj: Record<string, unknown>): string {
  const author = obj.author;
  if (typeof author === 'string') return author;
  if (author && typeof author === 'object') {
    const a = author as Record<string, unknown>;
    return extractText(a.name) || extractText(a.text) || '';
  }
  const channel = obj.channel;
  if (channel && typeof channel === 'object') {
    const c = channel as Record<string, unknown>;
    return extractText(c.name) || extractText(c.title) || '';
  }
  return typeof obj.uploader === 'string' ? obj.uploader : '';
}

function parseDurationSeconds(obj: Record<string, unknown>): number {
  const d = obj.lengthSeconds ?? obj.duration ?? obj.length;
  if (typeof d === 'number' && !Number.isNaN(d)) return d;
  if (typeof d === 'string') {
    const n = parseInt(d, 10);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

/** Pull video rows from various possible YouTube138 / InnerTube-style shapes */
function extractVideoRows(data: unknown): Record<string, unknown>[] {
  const root = data as Record<string, unknown>;
  const candidates = [
    root.contents,
    root.videos,
    root.items,
    root.data,
    root.results,
    (root.data as Record<string, unknown> | undefined)?.contents,
  ];
  for (const c of candidates) {
    if (Array.isArray(c) && c.length > 0) {
      return c.filter((x): x is Record<string, unknown> => x !== null && typeof x === 'object');
    }
  }
  return [];
}

function rowToVideo(row: Record<string, unknown>): {
  id: string;
  title: string;
  duration: number;
  thumbnail?: string;
  channel: { name: string; url?: string };
} | null {
  const v = (row.video as Record<string, unknown> | undefined) ?? row;
  if (!v || typeof v !== 'object') return null;

  const id =
    typeof v.videoId === 'string'
      ? v.videoId
      : typeof v.id === 'string'
        ? v.id
        : typeof v.video_id === 'string'
          ? v.video_id
          : '';
  if (!id) return null;

  const title = extractText(v.title) || extractText(v.name) || 'Unknown';
  const duration = parseDurationSeconds(v);
  const thumbnail = pickThumbnail(v) || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  const name = extractChannelName(v);
  let channelUrl: string | undefined;
  const ch = v.channel;
  if (ch && typeof ch === 'object' && typeof (ch as { id?: string }).id === 'string') {
    channelUrl = `https://www.youtube.com/channel/${(ch as { id: string }).id}`;
  }

  return {
    id,
    title,
    duration,
    thumbnail,
    channel: { name: name, url: channelUrl },
  };
}

function extractPlaylistTitle(data: unknown): string {
  const root = data as Record<string, unknown>;
  if (typeof root.title === 'string' && root.title.trim()) return root.title;
  if (typeof root.playlistTitle === 'string' && root.playlistTitle.trim()) return root.playlistTitle;
  const header = root.header;
  if (header && typeof header === 'object') {
    const h = header as Record<string, unknown>;
    const t = extractText(h.title);
    if (t) return t;
  }
  const meta = root.metadata;
  if (meta && typeof meta === 'object') {
    const t = extractText((meta as Record<string, unknown>).title);
    if (t) return t;
  }
  return 'Playlist';
}

function extractContinuation(data: unknown): string | undefined {
  const root = data as Record<string, unknown>;
  const c = root.continuation ?? root.nextContinuation ?? root.continuationToken;
  return typeof c === 'string' && c.length > 0 ? c : undefined;
}

export interface RapidPlaylistResult {
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
  totalVideos?: number;
}

export async function fetchPlaylistViaRapidApi138(
  playlistId: string,
  maxVideos: number,
  timeoutMs: number
): Promise<RapidPlaylistResult | null> {
  const key = getRapidApiKey();
  if (!key) {
    console.log('[getplaylist] rapidapi: set RAPID_API_KEY or RAPIDAPI_KEY (RapidAPI → youtube138)');
    return null;
  }

  const base = 'https://youtube138.p.rapidapi.com/playlist/videos/';
  const collected: RapidPlaylistResult['videos'] = [];
  let continuation: string | undefined;
  let playlistTitle = 'Playlist';
  let pages = 0;
  const maxPages = 8;

  while (collected.length < maxVideos && pages < maxPages) {
    const url = new URL(base);
    url.searchParams.set('id', playlistId);
    url.searchParams.set('hl', 'en');
    url.searchParams.set('gl', 'US');
    if (continuation) {
      url.searchParams.set('continuation', continuation);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'x-rapidapi-key': key,
          'x-rapidapi-host': 'youtube138.p.rapidapi.com',
        },
        signal: controller.signal,
      });
    } catch (e) {
      clearTimeout(timer);
      console.log('[getplaylist] rapidapi fetch error:', e instanceof Error ? e.message : String(e));
      return collected.length > 0 ? buildResult(playlistTitle, collected, maxVideos) : null;
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.log('[getplaylist] rapidapi HTTP', res.status, errBody.slice(0, 400));
      return collected.length > 0 ? buildResult(playlistTitle, collected, maxVideos) : null;
    }

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      console.log('[getplaylist] rapidapi: response is not JSON');
      return collected.length > 0 ? buildResult(playlistTitle, collected, maxVideos) : null;
    }

    if (pages === 0) {
      playlistTitle = extractPlaylistTitle(data);
    }

    const rows = extractVideoRows(data);
    if (pages === 0 && rows.length === 0) {
      console.log(
        '[getplaylist] rapidapi: no known video array in response; top-level keys:',
        data && typeof data === 'object' ? Object.keys(data as object) : []
      );
    }
    for (const row of rows) {
      const video = rowToVideo(row);
      if (video) {
        collected.push({
          ...video,
          url: `https://www.youtube.com/watch?v=${video.id}`,
        });
        if (collected.length >= maxVideos) break;
      }
    }

    continuation = extractContinuation(data);
    pages += 1;

    if (!continuation || rows.length === 0) break;
  }

  if (collected.length === 0) {
    console.log('[getplaylist] rapidapi: zero videos parsed (check API response shape / playlist id)');
    return null;
  }

  return buildResult(playlistTitle, collected, maxVideos);
}

function buildResult(
  title: string,
  videos: RapidPlaylistResult['videos'],
  maxVideos: number
): RapidPlaylistResult {
  const slice = videos.slice(0, maxVideos);
  return {
    title,
    thumbnail: slice[0]?.thumbnail,
    videos: slice,
    totalVideos: videos.length,
  };
}

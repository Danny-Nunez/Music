/**
 * YouTube Music API3 on RapidAPI — album by browse id (e.g. MPREb_…).
 * https://rapidapi.com/ — host: youtube-music-api3.p.rapidapi.com
 *
 * Env: RAPID_YT_MUSIC_KEY only (playlist flows use RAPID_API_KEY / RAPIDAPI_KEY elsewhere).
 */

const RAPID_HOST = 'youtube-music-api3.p.rapidapi.com';

export function getYoutubeMusic3RapidKey(): string | undefined {
  return process.env.RAPID_YT_MUSIC_KEY;
}

interface RapidAlbumTrack {
  videoId: string;
  title: string;
  duration: string;
  isExplicit?: boolean;
  thumbnail: string;
  author: string;
}

interface RapidAlbumJson {
  title: string;
  albumType?: string;
  albumRelease?: string;
  albumAuthor: string;
  albumCover: string;
  albumDescription?: string;
  isExplicit?: boolean;
  results?: RapidAlbumTrack[];
}

export interface AlbumApiSong {
  type: 'SONG';
  videoId: string;
  name: string;
  artist: { artistId: string | null; name: string };
  album: { albumId: string; name: string };
  duration: number;
  thumbnails: { url: string; width: number; height: number }[];
}

export interface AlbumApiResponse {
  type: 'ALBUM';
  albumId: string;
  name: string;
  playlistId?: string;
  artist: { artistId: string | null; name: string };
  year?: number;
  thumbnails: { url: string; width: number; height: number }[];
  songs: AlbumApiSong[];
}

function parseTrackDurationSeconds(d: string): number {
  const parts = d.split(':').map((p) => Number(p.trim()));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function mapRapidToAlbumResponse(
  albumId: string,
  raw: RapidAlbumJson
): AlbumApiResponse {
  const yearNum = raw.albumRelease ? parseInt(raw.albumRelease, 10) : NaN;
  const year = Number.isFinite(yearNum) ? yearNum : undefined;
  const results = Array.isArray(raw.results) ? raw.results : [];

  return {
    type: 'ALBUM',
    albumId,
    name: raw.title,
    artist: { artistId: null, name: raw.albumAuthor || '' },
    year,
    thumbnails: raw.albumCover
      ? [{ url: raw.albumCover, width: 544, height: 544 }]
      : [],
    songs: results.map((r) => ({
      type: 'SONG' as const,
      videoId: r.videoId,
      name: r.title,
      artist: {
        artistId: null,
        name: r.author || raw.albumAuthor || '',
      },
      album: { albumId, name: raw.title },
      duration: parseTrackDurationSeconds(r.duration),
      thumbnails: r.thumbnail
        ? [{ url: r.thumbnail, width: 120, height: 120 }]
        : [],
    })),
  };
}

/**
 * Fetches album from RapidAPI youtube-music-api3. Returns null if no key, bad status, or invalid body.
 */
export async function fetchAlbumViaRapidYoutubeMusic3(
  albumId: string
): Promise<AlbumApiResponse | null> {
  const key = getYoutubeMusic3RapidKey();
  if (!key) return null;

  const url = `https://${RAPID_HOST}/getAlbum?id=${encodeURIComponent(albumId)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'x-rapidapi-key': key,
        'x-rapidapi-host': RAPID_HOST,
      },
      next: { revalidate: 3600 },
    });

    const text = await res.text();
    if (!res.ok) {
      console.error(
        '[getalbum] rapid youtube-music-api3:',
        res.status,
        text.slice(0, 200)
      );
      return null;
    }

    let json: unknown;
    try {
      json = JSON.parse(text) as RapidAlbumJson;
    } catch {
      return null;
    }

    const raw = json as RapidAlbumJson;
    if (!raw?.title || !Array.isArray(raw.results)) {
      console.error('[getalbum] rapid youtube-music-api3: unexpected shape');
      return null;
    }

    return mapRapidToAlbumResponse(albumId, raw);
  } catch (e) {
    console.error('[getalbum] rapid youtube-music-api3 fetch error:', e);
    return null;
  }
}

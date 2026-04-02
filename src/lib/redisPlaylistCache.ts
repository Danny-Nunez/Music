import Redis from 'ioredis';

const KEY_PREFIX = 'beatinbox:playlist:v1:';

/** Host only — never log full REDIS_URL (contains password). */
function redisHostForLogs(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return '(unparseable REDIS_URL)';
  }
}

let loggedMissingUrl = false;
function logMissingRedisUrlOnce() {
  if (loggedMissingUrl) return;
  loggedMissingUrl = true;
  console.log('[redis] REDIS_URL not set — playlist cache disabled');
}

function ttlSeconds(): number {
  const raw = process.env.PLAYLIST_REDIS_TTL_SECONDS;
  const n = raw ? parseInt(raw, 10) : NaN;
  if (Number.isFinite(n) && n >= 60) return n;
  return 86400; // 24h default
}

type GlobalRedis = typeof globalThis & { __playlistRedisClient?: Redis | null };

function getRedisClient(): Redis | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    logMissingRedisUrlOnce();
    return null;
  }

  const g = globalThis as GlobalRedis;
  if (g.__playlistRedisClient === null) return null;
  if (g.__playlistRedisClient) return g.__playlistRedisClient;

  try {
    const host = redisHostForLogs(url);
    const client = new Redis(url, {
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
    });
    client.on('error', (err) => {
      console.error('[redis] connection error:', host, '|', err.message);
    });
    client.once('ready', () => {
      void client
        .ping()
        .then((pong) => {
          console.log('[redis] connected — PING', pong, '| host', host);
        })
        .catch((err) => {
          console.error(
            '[redis] PING failed | host',
            host,
            '|',
            err instanceof Error ? err.message : String(err)
          );
        });
    });
    g.__playlistRedisClient = client;
    return client;
  } catch (e) {
    console.error('[redis] failed to create client:', e instanceof Error ? e.message : e);
    g.__playlistRedisClient = null;
    return null;
  }
}

export function isPlaylistCacheEnabled(): boolean {
  return Boolean(process.env.REDIS_URL?.trim());
}

export async function getCachedPlaylistJson(playlistId: string): Promise<string | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  try {
    return await redis.get(KEY_PREFIX + playlistId);
  } catch (e) {
    console.log('[redis] GET playlist cache:', e instanceof Error ? e.message : String(e));
    return null;
  }
}

export async function setCachedPlaylistJson(playlistId: string, json: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    await redis.setex(KEY_PREFIX + playlistId, ttlSeconds(), json);
  } catch (e) {
    console.log('[redis] SET playlist cache:', e instanceof Error ? e.message : String(e));
  }
}

/** YouTube Mix, Radio, Liked music, Watch later, etc. — not listable like normal playlists in third-party APIs */
const UNSUPPORTED_PLAYLIST_PREFIXES = ['RD', 'RDCL', 'OL', 'LL', 'FL'] as const;

export function isUnsupportedPlaylistType(playlistId: string): boolean {
  const upper = playlistId.toUpperCase();
  return UNSUPPORTED_PLAYLIST_PREFIXES.some((prefix) => upper.startsWith(prefix));
}

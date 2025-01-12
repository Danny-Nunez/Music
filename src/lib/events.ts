// Custom event for playlist updates
export const PLAYLIST_UPDATED_EVENT = 'playlistUpdated';
export const PLAYLIST_CREATED_EVENT = 'playlistCreated';
export const SONG_ADDED_EVENT = 'songAdded';

export const emitPlaylistUpdated = (playlistId: string, newName: string) => {
  const event = new CustomEvent(PLAYLIST_UPDATED_EVENT, {
    detail: { playlistId, newName }
  });
  window.dispatchEvent(event);
};

import { Video } from '../types/video';

export const emitPlaylistCreated = (playlist: { id: string; name: string; songs: Video[] }) => {
  const event = new CustomEvent(PLAYLIST_CREATED_EVENT, {
    detail: { playlist }
  });
  window.dispatchEvent(event);
};

export const emitSongAdded = (playlistId: string, updatedPlaylist: { id: string; name: string; songs: Array<{ videoId: string; title: string; artist: string; thumbnail: string | null }> }) => {
  const event = new CustomEvent(SONG_ADDED_EVENT, {
    detail: { playlistId, updatedPlaylist }
  });
  window.dispatchEvent(event);
};
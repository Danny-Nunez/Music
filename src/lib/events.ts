// Custom event for playlist updates
export const PLAYLIST_UPDATED_EVENT = 'playlistUpdated';
export const PLAYLIST_CREATED_EVENT = 'playlistCreated';

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
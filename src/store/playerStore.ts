import { create } from 'zustand';

interface Track {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  artist: string;
  playlistId?: string;
}

interface PlayerStore {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  volume: number;
  setCurrentTrack: (track: Track) => void;
  setQueue: (songs: Track[]) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  playNext: () => void;
  playPrevious: () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  volume: 100,
  
  setCurrentTrack: (track: Track) => {
    const normalizedTrack = {
      ...track,
      id: track.videoId || track.id,
      videoId: track.id || track.videoId,
    };
    set({ 
      currentTrack: normalizedTrack,
      isPlaying: true // Auto-play when setting a new track
    });

    // If the track isn't in the queue, add it
    const { queue } = get();
    const isInQueue = queue.some((t: Track) => t.videoId === normalizedTrack.videoId);
    if (!isInQueue) {
      set({ queue: [...queue, normalizedTrack] });
    }
  },
  
  setQueue: (songs: Track[]) => {
    const normalizedSongs = songs.map((song: Track) => ({
      ...song,
      id: song.videoId || song.id,
      videoId: song.id || song.videoId,
    }));
    set({ queue: normalizedSongs });

    // If no current track, start playing the first song
    const { currentTrack } = get();
    if (!currentTrack && normalizedSongs.length > 0) {
      set({ 
        currentTrack: normalizedSongs[0],
        isPlaying: true
      });
    }
  },
  
  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
  
  setVolume: (volume: number) => set({ volume }),
  
  playNext: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack || queue.length === 0) return;
    
    const currentIndex = queue.findIndex(
      (track: Track) => track.videoId === currentTrack.videoId
    );
    
    if (currentIndex === -1 || currentIndex === queue.length - 1) {
      // If current track not in queue or is last track, play first track
      set({ 
        currentTrack: queue[0],
        isPlaying: true
      });
    } else {
      // Play next track in queue
      set({ 
        currentTrack: queue[currentIndex + 1],
        isPlaying: true
      });
    }
  },
  
  playPrevious: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack || queue.length === 0) return;
    
    const currentIndex = queue.findIndex(
      (track: Track) => track.videoId === currentTrack.videoId
    );
    
    if (currentIndex === -1 || currentIndex === 0) {
      // If current track not in queue or is first track, play last track
      set({ 
        currentTrack: queue[queue.length - 1],
        isPlaying: true
      });
    } else {
      // Play previous track in queue
      set({ 
        currentTrack: queue[currentIndex - 1],
        isPlaying: true
      });
    }
  }
}));
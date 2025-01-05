'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
}

interface PlayerContextType {
  currentVideo: Video | null;
  playlist: Video[];
  setCurrentVideo: (video: Video, playlist: Video[]) => void;
  isPlaying: boolean;
  togglePlayPause: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentVideo, setCurrentVideoState] = useState<Video | null>(null);
  const [playlist, setPlaylist] = useState<Video[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const setCurrentVideo = (video: Video, newPlaylist: Video[]) => {
    setCurrentVideoState(video);
    setPlaylist(newPlaylist);
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    if (!currentVideo || playlist.length === 0) return;
    const currentIndex = playlist.findIndex(v => v.id === currentVideo.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentVideoState(playlist[nextIndex]);
  };

  const previousTrack = () => {
    if (!currentVideo || playlist.length === 0) return;
    const currentIndex = playlist.findIndex(v => v.id === currentVideo.id);
    const previousIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    setCurrentVideoState(playlist[previousIndex]);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentVideo,
        playlist,
        setCurrentVideo,
        isPlaying,
        togglePlayPause,
        nextTrack,
        previousTrack,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
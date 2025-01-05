'use client';

import { useCallback } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { PlayIcon } from '@heroicons/react/24/outline';

interface Track {
  encryptedVideoId: string;
  name: string;
  thumbnail: {
    thumbnails: { url: string }[];
  };
  artists: { name: string }[];
}

interface PlayButtonProps {
  track: Track;
  allTracks?: Track[];
  className?: string;
}

export default function PlayButton({ track, allTracks = [], className = '' }: PlayButtonProps) {
  const { 
    setCurrentTrack, 
    setQueue, 
    setIsPlaying, 
    setHasUserInteracted,
    isMobileDevice,
    incrementForcePlayAttempts
  } = usePlayerStore();

  const handlePlay = useCallback(async () => {
    // Set user interaction first
    setHasUserInteracted(true);

    // Format current track
    const formattedTrack = {
      id: track.encryptedVideoId,
      videoId: track.encryptedVideoId,
      title: track.name,
      thumbnail: track.thumbnail.thumbnails[0].url,
      artist: track.artists.map(a => a.name).join(', ')
    };

    // Set current track
    setCurrentTrack(formattedTrack);

    // If allTracks is provided, set up the queue
    if (allTracks.length > 0) {
      // Format all tracks
      const formattedTracks = allTracks.map(t => ({
        id: t.encryptedVideoId,
        videoId: t.encryptedVideoId,
        title: t.name,
        thumbnail: t.thumbnail.thumbnails[0].url,
        artist: t.artists.map(a => a.name).join(', ')
      }));

      // Find current track index
      const currentIndex = formattedTracks.findIndex(
        t => t.id === formattedTrack.id
      );

      // Reorder queue to start from current track
      const reorderedQueue = [
        ...formattedTracks.slice(currentIndex),
        ...formattedTracks.slice(0, currentIndex)
      ];

      setQueue(reorderedQueue);
    } else {
      // If no allTracks provided, just add current track to queue
      setQueue([formattedTrack]);
    }

    // For mobile devices, we need to be more aggressive with playback
    if (isMobileDevice) {
      incrementForcePlayAttempts();
    }
    setIsPlaying(true);
  }, [
    track, 
    allTracks, 
    setCurrentTrack, 
    setQueue, 
    setIsPlaying, 
    setHasUserInteracted,
    isMobileDevice,
    incrementForcePlayAttempts
  ]);

  return (
    <button
      onClick={handlePlay}
      className={`flex items-center justify-center bg-black/60 transition-opacity ${className}`}
    >
      <PlayIcon className="h-8 w-8" />
    </button>
  );
}
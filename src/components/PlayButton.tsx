'use client';

import { useCallback } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/outline';

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
  isCurrentTrack?: boolean;
}

export default function PlayButton({ track, allTracks = [], className = '', isCurrentTrack = false }: PlayButtonProps) {
  const { isPlaying, setCurrentTrack, setQueue, setIsPlaying } = usePlayerStore();

  const handleToggle = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isCurrentTrack) {
      // If this is the current track, just toggle play/pause
      const player = document.querySelector('iframe')?.contentWindow;
      if (player) {
        try {
          if (isPlaying) {
            player.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            setIsPlaying(false);
          } else {
            player.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
            setIsPlaying(true);
          }
        } catch (error) {
          console.error('Error controlling video:', error);
        }
      }
      return;
    }

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
      const formattedTracks = allTracks.map(t => ({
        id: t.encryptedVideoId,
        videoId: t.encryptedVideoId,
        title: t.name,
        thumbnail: t.thumbnail.thumbnails[0].url,
        artist: t.artists.map(a => a.name).join(', ')
      }));

      const currentIndex = formattedTracks.findIndex(t => t.id === formattedTrack.id);
      const reorderedQueue = [
        ...formattedTracks.slice(currentIndex),
        ...formattedTracks.slice(0, currentIndex)
      ];

      setQueue(reorderedQueue);
    } else {
      setQueue([formattedTrack]);
    }

    setIsPlaying(true);
  }, [track, allTracks, setCurrentTrack, setQueue, setIsPlaying, isCurrentTrack, isPlaying]);

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center justify-center bg-red-600 p-1.5 rounded-full hover:bg-red-700 transition-colors ${className}`}
    >
      {isCurrentTrack && isPlaying ? (
        <PauseIcon className="h-5 w-5 text-white" />
      ) : (
        <PlayIcon className="h-5 w-5 text-white" />
      )}
    </button>
  );
}

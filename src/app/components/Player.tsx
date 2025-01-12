'use client';

declare global {
  interface Window {
    YT: typeof YT;
  }
}

import { useEffect, useRef, useState } from 'react';
import type { Player } from '../../types/youtube';
import { useSession } from 'next-auth/react';
import YouTube from 'react-youtube';
import SignInModal from '../../components/SignInModal';
import toast from 'react-hot-toast';
import { usePlayerStore } from '../../store/playerStore';
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from '@heroicons/react/24/solid';

export default function Player() {
  const { data: session } = useSession();
  const playerRef = useRef<YT.Player | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [hadButtonInteraction, setHadButtonInteraction] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('hadPlaybackInteraction') === 'true' : false
  );
  const [backgroundColor, setBackgroundColor] = useState('rgb(17, 24, 39)'); // Default dark color

  // Persist user interaction state
  useEffect(() => {
    if (hadButtonInteraction) {
      localStorage.setItem('hadPlaybackInteraction', 'true');
    }
  }, [hadButtonInteraction]);
  const { 
    currentTrack,
    queue,
    isPlaying,
    setIsPlaying,
    playNext,
    playPrevious,
    hasUserInteracted,
    setHasUserInteracted,
    isMobileDevice,
    setCurrentTrack
  } = usePlayerStore();

  // Handle mobile autoplay with mute/unmute
  const handleMobileAutoplay = async (fromUserAction = false) => {
    if (!playerRef.current || !isMobileDevice) return;

    try {
      // Always start muted to ensure autoplay works
      await playerRef.current.mute();
      await playerRef.current.playVideo();
      
      // Check if we should unmute based on interaction state
      const shouldUnmute = fromUserAction || hadButtonInteraction || hasUserInteracted ||
        localStorage.getItem('hadPlaybackInteraction') === 'true';
      
      if (shouldUnmute) {
        const attemptUnmute = async (attempt = 1, maxAttempts = 5) => {
          if (!playerRef.current || !isPlaying) return;
          
          try {
            // Wait for player to be ready and playing
            const state = await playerRef.current.getPlayerState();
            if (state !== YT.PlayerState.PLAYING) {
              throw new Error('Player not ready');
            }

            await playerRef.current.unMute();
            await playerRef.current.playVideo();
            
            // Store successful unmute state
            localStorage.setItem('hadPlaybackInteraction', 'true');
          } catch (error) {
            console.warn(`Unmute attempt ${attempt} failed:`, error);
            if (attempt < maxAttempts) {
              // Exponential backoff for retry
              const delay = Math.min(1000 * Math.pow(1.5, attempt - 1), 5000);
              setTimeout(() => attemptUnmute(attempt + 1, maxAttempts), delay);
            }
          }
        };

        // Start unmute attempts with a slight delay
        setTimeout(() => attemptUnmute(1), 500);
      }
    } catch (error) {
      console.warn('Error during mobile autoplay:', error);
      // Retry playback on error
      setTimeout(() => handleMobileAutoplay(fromUserAction), 1000);
    }
  };

  // Check for 30-second limit for non-authenticated users
  useEffect(() => {
    if (!session && currentTime >= 30 && isPlaying) {
      setIsPlaying(false);
      toast.error('Sign in to continue listening to full songs', {
        duration: 4000,
        position: 'bottom-center',
        style: {
          background: '#1f1f1f',
          color: '#fff',
          borderRadius: '8px',
          zIndex: 10000
        },
      });
      setTimeout(() => {
        setShowSignInModal(true);
      }, 1000);
    }
  }, [currentTime, session, isPlaying, setIsPlaying]);

  // Extract dominant color from thumbnail
  useEffect(() => {
    const extractDominantColor = async () => {
      if (currentTrack?.thumbnail) {
        try {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.src = currentTrack.thumbnail;
          
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const colorMap = new Map<string, number>();

            // Analyze colors in the image
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              
              // Skip near-grayscale colors
              const max = Math.max(r, g, b);
              const min = Math.min(r, g, b);
              if (max - min < 30) continue;

              // Group similar colors
              const key = `${Math.round(r/10)*10},${Math.round(g/10)*10},${Math.round(b/10)*10}`;
              colorMap.set(key, (colorMap.get(key) || 0) + 1);
            }

            // Find the most common vibrant color
            let maxCount = 0;
            let dominantColor = '0,0,0';
            
            colorMap.forEach((count, color) => {
              if (count > maxCount) {
                maxCount = count;
                dominantColor = color;
              }
            });

            const [r, g, b] = dominantColor.split(',').map(Number);
            // Darken the color by reducing RGB values
            const darkenFactor = 0.7; // 30% darker
            const darkR = Math.round(r * darkenFactor);
            const darkG = Math.round(g * darkenFactor);
            const darkB = Math.round(b * darkenFactor);
            setBackgroundColor(`rgb(${darkR}, ${darkG}, ${darkB})`);
          };
        } catch (error) {
          console.error('Error extracting color:', error);
        }
      }
    };
    
    extractDominantColor();
  }, [currentTrack?.thumbnail]);

  // Reset player state when song changes
  useEffect(() => {
    setIsPlayerReady(false);
    setCurrentTime(0);
    setDuration(0);
  }, [currentTrack?.videoId]);

  // Handle play/pause
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !isPlayerReady || !currentTrack) return;
  
    const handlePlay = async () => {
      try {
        if (isPlaying) {
          if (isMobileDevice) {
            await handleMobileAutoplay(hadButtonInteraction);
          } else {
            await player.playVideo();
          }
        } else {
          await player.pauseVideo();
        }
      } catch (error) {
        console.warn('Player is not ready to play yet:', error);
      }
    };
    
    handlePlay();
  }, [isPlaying, isPlayerReady, currentTrack, isMobileDevice, hadButtonInteraction]);

  // Update current time
  useEffect(() => {
    if (!isPlayerReady || !isPlaying || isDragging || !currentTrack) return;

    const interval = setInterval(async () => {
      try {
        if (playerRef.current) {
          const time = await playerRef.current.getCurrentTime();
          setCurrentTime(time);
        }
      } catch (error) {
        console.error('Error getting current time:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, isDragging, isPlayerReady, currentTrack]);

  const handleUserInteraction = async () => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }
    setHadButtonInteraction(true);

    if (playerRef.current && isPlayerReady) {
      try {
        if (isPlaying) {
          await playerRef.current.unMute();
          await playerRef.current.playVideo();
        } else {
          await playerRef.current.pauseVideo();
        }
      } catch (error) {
        console.warn('Error during playback interaction:', error);
      }
    }
  };

  const togglePlay = async () => {
    if (!isPlayerReady || !currentTrack || !playerRef.current) return;
    
    setHadButtonInteraction(true);
    if (isMobileDevice) {
      await handleUserInteraction();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = async () => {
    if (!playerRef.current || !isPlayerReady || !currentTrack) return;

    setHadButtonInteraction(true);
    try {
      if (isMuted) {
        await playerRef.current.unMute();
      } else {
        await playerRef.current.mute();
      }
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const handleSeek = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPlayerReady || !currentTrack || !playerRef.current) return;

    setHadButtonInteraction(true);
    const time = Number(e.target.value);
    setCurrentTime(time);
    
    try {
      await playerRef.current.seekTo(time, true);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const handleSeekMouseDown = () => {
    setIsDragging(true);
  };

  const handleSeekMouseUp = () => {
    setIsDragging(false);
  };

  const handleStateChange = async (event: { data: YT.PlayerState }) => {
    if (event.data === YT.PlayerState.ENDED) { // Video ended
      if (queue.length > 0) {
        playNext();
        setIsPlaying(true);
        
        // For mobile, handle autoplay for next track
        if (isMobileDevice) {
          await handleMobileAutoplay(hadButtonInteraction);
        }
      } else {
        setIsPlaying(false);
      }
    } else if (event.data === YT.PlayerState.PLAYING) { // Video playing
      setIsPlaying(true);
      try {
        if (playerRef.current) {
          const duration = await playerRef.current.getDuration();
          setDuration(duration);
          
          // Try to unmute if we've had interaction
          if (isMobileDevice && (hadButtonInteraction || hasUserInteracted)) {
            await playerRef.current.unMute();
          }
          
          // Update current track if playing from playlist
          if (currentTrack?.playlistId) {
            const playlistIndex = await playerRef.current.getPlaylistIndex();
            const playlist = await playerRef.current.getPlaylist();
            if (playlist[playlistIndex] !== currentTrack.videoId) {
              const newTrack = {
                ...currentTrack,
                videoId: playlist[playlistIndex]
              };
              setCurrentTrack(newTrack);
            }
          }
        }
      } catch (error) {
        console.error('Error getting duration:', error);
      }
    } else if (event.data === 2) { // Video paused
      setIsPlaying(false);
    } else if (event.data === -1 || event.data === 5) { // Unstarted or video cued
      setIsPlayerReady(true);
      if (isPlaying) {
        try {
          if (isMobileDevice) {
            await handleMobileAutoplay(hadButtonInteraction);
          } else {
            await playerRef.current?.playVideo();
          }
        } catch (error) {
          console.warn('Error during state change playback:', error);
        }
      }
    }
  };

  const handleReady = async (event: YT.PlayerEvent) => {
    playerRef.current = event.target;
    setIsPlayerReady(true);
   
    try {
      if (currentTrack) {
        // Always use playlist mode for continuous playback
        const videoIds = [currentTrack.videoId, ...queue.map(t => t.videoId)];
        if (isPlaying) {
          await event.target.loadPlaylist(videoIds, 0);
          if (isMobileDevice && !localStorage.getItem('hadPlaybackInteraction')) {
            await handleMobileAutoplay(hadButtonInteraction);
          } else {
            await event.target.playVideo();
          }
        } else {
          await event.target.cuePlaylist(videoIds, 0);
        }
      }
    } catch (error) {
      console.warn('Playback attempt failed:', error);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePrevious = async () => {
    if (!isPlayerReady || !currentTrack || !playerRef.current) return;

    setHadButtonInteraction(true);
    if (currentTime > 3) {
      try {
        await playerRef.current.seekTo(0, true);
        setCurrentTime(0);
      } catch (error) {
        console.error('Error seeking to start:', error);
      }
    } else {
      playPrevious();
      if (isMobileDevice) {
        await handleMobileAutoplay(true);
      }
    }
  };

  const handleNext = async () => {
    if (!queue.length) return;
    
    setHadButtonInteraction(true);
    playNext();
    if (isMobileDevice) {
      await handleMobileAutoplay(true);
    }
  };

  const handleError = () => {
    setIsPlayerReady(false);
  
    if (queue.length > 0) {
      playNext();
      if (isMobileDevice) {
        handleMobileAutoplay(hadButtonInteraction);
      }
    } else {
      setIsPlaying(false);
    }
  };
  
  if (!currentTrack) return null;

  return (
    <div
      className="fixed z-90 bottom-0 left-0 right-0 border-t border-gray-800 p-4 transition-colors duration-500"
      style={{
        backgroundColor: 'rgb(17, 24, 39)',
        backgroundImage: `linear-gradient(to bottom, ${backgroundColor} 0%, rgb(17, 24, 39) 90%)`,
        transition: 'all 0.5s ease-in-out'
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-12 text-right relative">
              {currentTrack?.artist === 'Live Radio' ? (
                <>
                  Live
                  <span className="ml-1 w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block" />
                </>
              ) : (
                formatTime(currentTime)
              )}
            </span>
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              onMouseDown={handleSeekMouseDown}
              onMouseUp={handleSeekMouseUp}
              className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              disabled={!isPlayerReady}
            />
            {currentTrack?.artist !== 'Live Radio' && (
              <span className="text-xs text-gray-400 w-12">
                {formatTime(duration)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-12 h-12 rounded object-cover"
              />
              <div className="max-w-[100px] md:max-w-[900px]">
                <h3 className="text-white font-medium truncate">{currentTrack.title}</h3>
                {currentTrack.artist && (
                  <p className="text-gray-400 text-sm truncate">{currentTrack.artist}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handlePrevious}
                className="text-white hover:text-red-500 transition-colors"
                disabled={!isPlayerReady}
              >
                <BackwardIcon className="h-8 w-8" />
              </button>

              <button
                onClick={togglePlay}
                className="text-white hover:text-red-500 transition-colors"
                disabled={!isPlayerReady}
              >
                {isPlaying ? (
                  <PauseIcon className="h-8 w-8" />
                ) : (
                  <PlayIcon className="h-8 w-8" />
                )}
              </button>

              <button
                onClick={handleNext}
                className={`text-white transition-colors ${queue.length > 0 ? 'hover:text-red-500' : 'opacity-50 cursor-not-allowed'}`}
                disabled={queue.length === 0 || !isPlayerReady}
              >
                <ForwardIcon className="h-8 w-8" />
              </button>

              <button
                onClick={toggleMute}
                className="text-white hover:text-red-500 transition-colors"
                disabled={!isPlayerReady}
              >
                {isMuted ? (
                  <SpeakerXMarkIcon className="h-8 w-8" />
                ) : (
                  <SpeakerWaveIcon className="h-8 w-8" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="hidden">
          {currentTrack && (
            <YouTube
              videoId={currentTrack.videoId}
              id={`youtube-player-${currentTrack.videoId}`}
              opts={{
                height: '0',
                width: '0',
                playerVars: {
                  autoplay: 1,
                  controls: 0,
                  disablekb: 1,
                  enablejsapi: 1,
                  fs: 0,
                  iv_load_policy: 3,
                  modestbranding: 1,
                  origin: typeof window !== 'undefined' ? window.location.origin : undefined,
                  playsinline: 1,
                  rel: 0,
                  showinfo: 0,
                  mute: isMobileDevice && !localStorage.getItem('hadPlaybackInteraction') ? 1 : 0,
                  playlist: queue.map(t => t.videoId).join(',') // Add queue as playlist for continuous playback
                },
              }}
              onStateChange={handleStateChange}
              onReady={handleReady}
              onError={handleError}
              className="absolute"
              iframeClassName="absolute"
              loading="eager"
              title={currentTrack.title}
            />
          )}
        </div>
      </div>
      {showSignInModal && (
        <SignInModal onClose={() => setShowSignInModal(false)} />
      )}
    </div>
  );
}
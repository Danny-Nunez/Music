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
import Image from 'next/image';
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
  const [isLoading, setIsLoading] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('rgb(17, 24, 39)'); // Default dark color
  const {
    currentTrack,
    queue,
    isPlaying,
    setIsPlaying,
    playNext,
    playPrevious
  } = usePlayerStore();

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
          const img = document.createElement('img');
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

  const togglePlay = async () => {
    if (!isPlayerReady || !currentTrack || !playerRef.current) return;
    
    const player = playerRef.current;
    try {
      if (!isPlaying) {
        await player.playVideo();
        setIsPlaying(true);
      } else {
        await player.pauseVideo();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  const toggleMute = async () => {
    if (!playerRef.current || !isPlayerReady || !currentTrack) return;
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
    if (event.data === YT.PlayerState.ENDED) {
      if (queue.length > 0) {
        playNext();
      } else {
        setIsPlaying(false);
      }
    } else if (event.data === YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      if (playerRef.current) {
        const duration = await playerRef.current.getDuration();
        setDuration(duration);
      }
    } else if (event.data === YT.PlayerState.PAUSED) {
      setIsPlaying(false);
    } else if (event.data === YT.PlayerState.UNSTARTED || event.data === YT.PlayerState.CUED) {
      setIsPlayerReady(true);
      if (isPlaying) {
        try {
          await playerRef.current?.playVideo();
        } catch (error) {
          console.warn('Error during state change playback:', error);
        }
      }
    }
  };

  const handleReady = async (event: YT.PlayerEvent) => {
    const player = event.target;
    playerRef.current = player;
    setIsPlayerReady(true);
    setIsLoading(true);
   
    if (!currentTrack || !player) {
      setIsLoading(false);
      return;
    }

    try {
      // Always start by cueing the video
      await player.cueVideoById(currentTrack.videoId);
      // Add a small delay for mobile devices
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if player is still valid
      if (playerRef.current === player && isPlaying) {
        await player.playVideo();
      }
    } catch (error) {
      console.error('Initial playback failed:', error);
      try {
        // If playback fails, try one more time with a longer delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Check if player is still valid
        if (playerRef.current === player) {
          await player.cueVideoById(currentTrack.videoId);
          if (isPlaying) {
            await player.playVideo();
          }
        }
      } catch (retryError) {
        console.error('Video reinitialization failed:', retryError);
      }
    } finally {
      if (playerRef.current === player) {
        setIsLoading(false);
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePrevious = async () => {
    if (!isPlayerReady || !currentTrack || !playerRef.current || isLoading) return;

    if (currentTime > 3) {
      const player = playerRef.current;
      try {
        if (playerRef.current === player) {
          await player.seekTo(0, true);
          setCurrentTime(0);
        }
      } catch (error) {
        console.error('Error seeking to start:', error);
      }
    } else {
      setIsLoading(true);
      playPrevious();
      const player = playerRef.current;
      if (!player || !currentTrack) {
        setIsLoading(false);
        return;
      }

      try {
        if (playerRef.current === player) {
          await player.cueVideoById(currentTrack.videoId);
          await new Promise(resolve => setTimeout(resolve, 500));
          if (playerRef.current === player) {
            await player.playVideo();
          }
        }
      } catch (error) {
        console.error('Error playing previous video:', error);
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (playerRef.current === player) {
            await player.cueVideoById(currentTrack.videoId);
            await player.playVideo();
          }
        } catch (retryError) {
          console.error('Error during retry:', retryError);
        }
      } finally {
        if (playerRef.current === player) {
          setIsLoading(false);
        }
      }
    }
  };

  const handleNext = async () => {
    if (!queue.length || isLoading) return;
    
    setIsLoading(true);
    playNext();
    
    const player = playerRef.current;
    if (!player || !currentTrack) {
      setIsLoading(false);
      return;
    }

    try {
      if (playerRef.current === player) {
        await player.cueVideoById(currentTrack.videoId);
        await new Promise(resolve => setTimeout(resolve, 500));
        if (playerRef.current === player) {
          await player.playVideo();
        }
      }
    } catch (error) {
      console.error('Error playing next video:', error);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (playerRef.current === player) {
          await player.cueVideoById(currentTrack.videoId);
          await player.playVideo();
        }
      } catch (retryError) {
        console.error('Error during retry:', retryError);
      }
    } finally {
      if (playerRef.current === player) {
        setIsLoading(false);
      }
    }
  };

  const handleError = () => {
    console.error('Player error occurred');
    setIsPlayerReady(false);
    setIsPlaying(false);
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
              <div className="relative w-12 h-12 rounded overflow-hidden">
                <YouTube
                  videoId={currentTrack.videoId}
                  id={`youtube-player-${currentTrack.videoId}`}
                  opts={{
                    height: '48',
                    width: '48',
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
                      showinfo: 0
                    },
                  }}
                  onStateChange={handleStateChange}
                  onReady={handleReady}
                  onError={handleError}
                  className="absolute inset-0 w-full h-full scale-[2]"
                  iframeClassName="absolute inset-0 w-full h-full object-cover"
                  loading="eager"
                  title={currentTrack.title}
                />
                <div className="absolute inset-0 bg-black/50">
                  <Image
                    src={currentTrack.thumbnail}
                    alt={currentTrack.title}
                    fill
                    className="object-cover opacity-0"
                    priority
                  />
                </div>
              </div>
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
      </div>
      {showSignInModal && (
        <SignInModal onClose={() => setShowSignInModal(false)} />
      )}
    </div>
  );
}
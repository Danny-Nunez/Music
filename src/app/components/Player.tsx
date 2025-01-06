'use client';

import { useEffect, useRef, useState } from 'react';
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
  const { 
    currentTrack, 
    queue, 
    isPlaying, 
    setIsPlaying, 
    playNext, 
    playPrevious,
    hasUserInteracted,
    setHasUserInteracted,
    isMobileDevice
  } = usePlayerStore();

  // Handle mobile autoplay with mute/unmute
  const handleMobileAutoplay = async () => {
    if (!playerRef.current || !isMobileDevice) return;

    try {
      // Start muted
      await playerRef.current.mute();
      await playerRef.current.playVideo();
      
      // Unmute after a delay if we have user interaction
      if (hasUserInteracted) {
        setTimeout(async () => {
          if (playerRef.current && isPlaying) {
            await playerRef.current.unMute();
            await playerRef.current.playVideo();
          }
        }, 1000);
      }
    } catch (error) {
      console.warn('Error during mobile autoplay:', error);
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
            await handleMobileAutoplay();
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
  }, [isPlaying, isPlayerReady, currentTrack, isMobileDevice, hasUserInteracted]);

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
    
    if (isMobileDevice) {
      await handleUserInteraction();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = async () => {
    if (!playerRef.current || !isPlayerReady || !currentTrack) return;

    if (isMobileDevice) {
      await handleUserInteraction();
    }

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

    if (isMobileDevice) {
      await handleUserInteraction();
    }

    const time = Number(e.target.value);
    setCurrentTime(time);
    
    try {
      await playerRef.current.seekTo(time);
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

  const handleStateChange = async (event: YT.PlayerEvent) => {
    if (event.data === 0) { // Video ended
      if (queue.length > 0) {
        playNext();
        setIsPlaying(true);
        
        // For mobile, handle autoplay for next track
        if (isMobileDevice) {
          await handleMobileAutoplay();
        }
      } else {
        setIsPlaying(false);
      }
    } else if (event.data === 1) { // Video playing
      setIsPlaying(true);
      try {
        if (playerRef.current) {
          const duration = await playerRef.current.getDuration();
          setDuration(duration);
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
            await handleMobileAutoplay();
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
      if (isPlaying) {
        if (isMobileDevice) {
          await handleMobileAutoplay();
        } else {
          await event.target.playVideo();
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

    if (isMobileDevice) {
      await handleUserInteraction();
    }

    if (currentTime > 3) {
      try {
        await playerRef.current.seekTo(0);
        setCurrentTime(0);
      } catch (error) {
        console.error('Error seeking to start:', error);
      }
    } else {
      playPrevious();
      if (isMobileDevice) {
        await handleMobileAutoplay();
      }
    }
  };

  const handleNext = async () => {
    if (!queue.length) return;
    
    playNext();
    if (isMobileDevice) {
      await handleMobileAutoplay();
    }
  };

  const handleError = () => {
    setIsPlayerReady(false);
  
    if (queue.length > 0) {
      playNext();
      if (isMobileDevice) {
        handleMobileAutoplay();
      }
    } else {
      setIsPlaying(false);
    }
  };
  
  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-12 text-right">
              {formatTime(currentTime)}
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
            <span className="text-xs text-gray-400 w-12">
              {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-12 h-12 rounded object-cover"
              />
              <div className="max-w-[100px] md:max-w-[900px]" >
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
                  autoplay: isMobileDevice ? 1 : 0, // Enable autoplay for mobile
                  controls: 0,
                  disablekb: 1,
                  enablejsapi: 1,
                  fs: 0,
                  iv_load_policy: 3,
                  modestbranding: 1,
                  origin: typeof window !== 'undefined' ? window.location.origin : undefined,
                  playsinline: 1, // Required for iOS
                  rel: 0,
                  showinfo: 0,
                  mute: isMobileDevice ? 1 : 0 // Start muted on mobile
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
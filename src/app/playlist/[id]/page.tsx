'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PauseIcon, PlayIcon } from '@heroicons/react/24/outline';
import { usePlayerStore } from '../../../store/playerStore';
import ArtistPageAddToPlaylistButton from '../../../components/ArtistPageAddToPlaylistButton';

interface PlaylistVideo {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: number;
  channel: {
    name: string;
    url: string;
  };
}

interface PlaylistData {
  title: string;
  videos: PlaylistVideo[];
}

type PlaylistFetchError =
  | { kind: 'unsupported_mix'; listId: string }
  | { kind: 'other'; message: string };

export default function PlaylistPage() {
  const params = useParams();
  const { currentTrack, isPlaying, setIsPlaying, setCurrentTrack, setQueue } = usePlayerStore();
  const [playlistData, setPlaylistData] = useState<PlaylistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<PlaylistFetchError | null>(null);

  useEffect(() => {
    const raw = params?.id;
    const id =
      typeof raw === 'string'
        ? raw
        : Array.isArray(raw) && typeof raw[0] === 'string'
          ? raw[0]
          : '';
    if (!id) {
      setLoading(false);
      setFetchError({ kind: 'other', message: 'Missing playlist id' });
      return;
    }

    setPlaylistData(null);
    setFetchError(null);
    setLoading(true);

    const fetchPlaylistData = async () => {
      try {
        const playlistUrl = `https://www.youtube.com/playlist?list=${id}`;
        const response = await fetch(`/api/getplaylist?url=${encodeURIComponent(playlistUrl)}`);
        let data: unknown;
        try {
          data = await response.json();
        } catch {
          setFetchError({
            kind: 'other',
            message: !response.ok
              ? `Failed to fetch playlist (${response.status})`
              : 'Invalid response from server',
          });
          return;
        }
        if (!response.ok) {
          const code = (data as { code?: string }).code;
          if (code === 'UNSUPPORTED_PLAYLIST_TYPE') {
            setFetchError({ kind: 'unsupported_mix', listId: id });
            return;
          }
          const message =
            data && typeof (data as { error?: string }).error === 'string'
              ? (data as { error: string }).error
              : `Failed to fetch playlist (${response.status})`;
          setFetchError({ kind: 'other', message });
          return;
        }
        setPlaylistData(data as PlaylistData);
      } catch (err) {
        console.error('Error fetching playlist data:', err);
        setFetchError({
          kind: 'other',
          message: err instanceof Error ? err.message : 'An error occurred',
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchPlaylistData();
  }, [params?.id]);

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-900 to-black text-white pt-20 rounded-lg max-w-screen-lg">
        <div className="p-8">
          <div className="flex items-center gap-8 mb-8">
            <div className="md:w-48 md:h-48 w-32 h-32 bg-white/10 rounded animate-pulse"></div>
            <div className="flex-1">
              <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-4"></div>
              <div className="h-6 w-32 bg-white/10 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/10 rounded animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 w-48 bg-white/10 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-32 bg-white/10 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    if (fetchError.kind === 'unsupported_mix') {
      const ytPlaylistUrl = `https://www.youtube.com/playlist?list=${encodeURIComponent(fetchError.listId)}`;
      return (
        <div className="flex flex-1 items-center justify-center min-h-[50vh] px-6 py-16">
          <div className="max-w-md text-center space-y-4">
            <p className="text-lg font-medium text-amber-400">This mix cannot be played inside Beatinbox</p>
            <p className="text-zinc-400 text-sm leading-relaxed">
              The link works on YouTube because only YouTube can load this personalized stream. We cannot list or stream those tracks here. Use a saved playlist (starts with <span className="text-zinc-300">PL…</span>) to play it in the app.
            </p>
            <a
              href={ytPlaylistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium hover:bg-zinc-200 transition-colors"
            >
              Open on YouTube
            </a>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-1 items-center justify-center min-h-[50vh] px-6 py-16">
        <div className="max-w-md text-center space-y-3">
          <p className="text-lg font-medium text-red-400">Could not load playlist</p>
          <p className="text-zinc-400 text-sm leading-relaxed">{fetchError.message}</p>
        </div>
      </div>
    );
  }

  if (!playlistData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">No playlist data found</div>
      </div>
    );
  }

  // Use the first video's thumbnail as the playlist artwork
  const playlistArtwork = playlistData.videos[0]?.thumbnail ? 
    `/api/proxy-image?url=${encodeURIComponent(playlistData.videos[0].thumbnail)}` : 
    '/defaultcover.png';

  const handlePlayPause = (video: PlaylistVideo, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    // Format all videos for the queue
    const formattedVideos = playlistData.videos.map((v) => ({
      id: v.id,
      videoId: v.id,
      title: v.title,
      artist: v.channel.name,
      thumbnail: v.thumbnail ? `/api/proxy-image?url=${encodeURIComponent(v.thumbnail)}` : playlistArtwork
    }));

    // Find current video index
    const currentIndex = formattedVideos.findIndex(
      s => s.videoId === video.id
    );

    // Set queue first
    const reorderedQueue = [
      ...formattedVideos.slice(currentIndex),
      ...formattedVideos.slice(0, currentIndex)
    ];
    setQueue(reorderedQueue);

    // Set current track and play
    setCurrentTrack(formattedVideos[currentIndex]);
    const player = document.querySelector('iframe')?.contentWindow;
    if (player) {
      try {
        player.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing video:', error);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#121212] to-black text-white mx-4 rounded-xl max-w-screen-lg">
      {/* Playlist Header */}
      <div className="p-8">
        <div className="flex items-start gap-8 mb-8">
          {playlistData.videos.length >= 4 ? (
            <div className="grid grid-cols-2 grid-rows-2 gap-1 md:w-48 md:h-48 w-32 h-32 rounded-lg overflow-hidden shadow-xl">
              {playlistData.videos.slice(0, 4).map((video, index) => (
                <img
                  key={video.id}
                  src={video.thumbnail ? `/api/proxy-image?url=${encodeURIComponent(video.thumbnail)}` : '/defaultcover.png'}
                  alt={`${playlistData.title} - Image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = '/defaultcover.png';
                  }}
                />
              ))}
            </div>
          ) : (
            <img
              src={playlistArtwork}
              alt={playlistData.title}
              className="md:w-48 md:h-48 w-32 h-32 object-cover rounded-lg shadow-xl"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = '/defaultcover.png';
              }}
            />
          )}
          <div className="flex-1 mt-4">
            <h1 className="md:text-4xl text-2xl font-bold mb-2">{playlistData.title}</h1>
            <p className="text-gray-400 md:text-lg text-md mb-1">
              {playlistData.videos.length} {playlistData.videos.length === 1 ? 'video' : 'videos'}
            </p>
           
          </div>
        </div>

        {/* Videos List */}
        <div className="grid grid-cols-1 gap-2">
          {playlistData.videos.length === 0 && (
            <p className="text-gray-400 text-center py-4">No videos available</p>
          )}
          {playlistData.videos.map((video) => {
            const thumbnail = video.thumbnail ? 
              `/api/proxy-image?url=${encodeURIComponent(video.thumbnail)}` : 
              playlistArtwork;
            
            return (
              <div
                key={video.id}
                className="flex items-center gap-4 p-4 rounded-lg hover:bg-white/10 transition-colors group"
              >
                <div className="relative w-16 h-16 flex-shrink-0">
                  <img
                    src={thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover rounded"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = playlistArtwork;
                    }}
                  />
                  {currentTrack?.videoId === video.id && isPlaying ? (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const player = document.querySelector('iframe')?.contentWindow;
                          if (player) {
                            try {
                              player.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                              setIsPlaying(false);
                            } catch (error) {
                              console.error('Error pausing video:', error);
                            }
                          }
                        }}
                        className="z-10"
                      >
                        <div className="bg-red-600 p-1.5 rounded-full hover:bg-red-700 transition-colors">
                          <PauseIcon className="h-5 w-5 text-white" />
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handlePlayPause(video, e)}
                        className="z-10"
                      >
                        <div className="bg-red-600 p-1.5 rounded-full hover:bg-red-700 transition-colors">
                          <PlayIcon className="h-5 w-5 text-white" />
                        </div>
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{video.title}</h3>
                  <p className="text-gray-400 text-sm truncate">{video.channel.name}</p>
                </div>
                <div className="text-gray-400 text-sm">
                  {formatDuration(video.duration)}
                </div>
                <ArtistPageAddToPlaylistButton
                  track={{
                    id: video.id,
                    videoId: video.id,
                    title: video.title,
                    thumbnail: thumbnail,
                    artist: video.channel.name
                  }}
                  className="opacity-0 group-hover:opacity-100"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 
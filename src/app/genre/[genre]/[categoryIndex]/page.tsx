'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PlayIcon, PauseIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { usePlayerStore } from '../../../../store/playerStore';
import toast from 'react-hot-toast';
import AddToPlaylistButton from '../../../../components/AddToPlaylistButton';

interface Song {
  title: string;
  videoId: string;
  playlistId: string;
  artists: string;
  thumbnail: string;
}

interface MusicCategory {
  title: string;
  contents: Song[];
}

interface GenreData {
  success: boolean;
  data: {
    musicItems: MusicCategory[];
  };
}

const GENRE_API_MAP: { [key: string]: string } = {
  pop: '/api/get-mobile-pop-feed-url',
  hiphop: '/api/get-mobile-hiphop-feed-url',
  rock: '/api/get-mobile-rock-feed-url',
  workout: '/api/get-mobile-workout-feed-url',
  electronic: '/api/get-mobile-electronic-feed-url',
  rnb: '/api/get-mobile-rnb-feed-url',
  reggae: '/api/get-mobile-reggae-feed-url',
  latin: '/api/get-mobile-latin-feed-url',
  party: '/api/get-mobile-party-feed-url',
  goodvibe: '/api/get-mobile-goodvibe-feed-url',
};

const GENRE_NAMES: { [key: string]: string } = {
  pop: 'Pop',
  hiphop: 'Hip Hop',
  rock: 'Rock',
  workout: 'Workout',
  electronic: 'Electronic',
  rnb: 'R&B',
  reggae: 'Reggae',
  latin: 'Latin',
  party: 'Party',
  goodvibe: 'Good Vibes',
};

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const [category, setCategory] = useState<MusicCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(1);
  const { currentTrack, isPlaying, setCurrentTrack, setQueue, setIsPlaying } = usePlayerStore();

  const genre = params.genre as string;
  const categoryIndex = parseInt(params.categoryIndex as string);
  const genreName = GENRE_NAMES[genre] || genre;

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const newOpacity = Math.max(1 - scrollTop / 300, 0);
      setOpacity(newOpacity);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const fetchCategoryData = useCallback(async () => {
    if (!genre || !GENRE_API_MAP[genre] || isNaN(categoryIndex)) {
      setError('Invalid genre or category');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(GENRE_API_MAP[genre]);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${genreName} music: ${response.status}`);
      }

      const data: GenreData = await response.json();
      
      if (!data.success || !data.data?.musicItems) {
        throw new Error('Invalid response structure');
      }

      const targetCategory = data.data.musicItems[categoryIndex];
      if (!targetCategory) {
        throw new Error('Category not found');
      }

      setCategory(targetCategory);
    } catch (err) {
      console.error('Error fetching category data:', err);
      setError(err instanceof Error ? err.message : `Failed to load ${genreName} category`);
    } finally {
      setLoading(false);
    }
  }, [genre, categoryIndex, genreName]);

  useEffect(() => {
    fetchCategoryData();
  }, [fetchCategoryData]);

  const playAll = () => {
    if (category && category.contents.length > 0) {
      const formattedSongs = category.contents.map(song => ({
        id: song.videoId,
        videoId: song.videoId,
        title: song.title,
        artist: song.artists || 'Unknown Artist',
        thumbnail: song.thumbnail ? `/api/proxy-image?url=${encodeURIComponent(song.thumbnail)}` : '/defaultcover.png'
      }));

      // Set the first song as current and the rest as queue
      setCurrentTrack(formattedSongs[0]);
      setQueue(formattedSongs);
      toast.success(`Playing ${category.title}`);
    }
  };

  const playSong = async (song: Song, index: number) => {
    if (!category) return;

    // Format all songs
    const formattedSongs = category.contents.map(s => ({
      id: s.videoId,
      videoId: s.videoId,
      title: s.title,
      artist: s.artists || 'Unknown Artist',
      thumbnail: s.thumbnail ? `/api/proxy-image?url=${encodeURIComponent(s.thumbnail)}` : '/defaultcover.png'
    }));

    // Set the clicked song as current
    setCurrentTrack(formattedSongs[index]);

    // Reorder queue to start from the clicked song
    const reorderedQueue = [
      ...formattedSongs.slice(index),
      ...formattedSongs.slice(0, index)
    ];
    setQueue(reorderedQueue);

    // Ensure the video starts playing
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

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-900 to-black text-white pt-20 rounded-lg max-w-screen-lg">
        <div className="flex items-center justify-center min-h-[300px] bg-[#121212]">
          <div className="animate-pulse w-16 h-16 rounded-full bg-white/10"></div>
        </div>
        <div className="p-8">
          <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-6"></div>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-white text-xl mb-4">{error}</p>
          <button 
            onClick={fetchCategoryData}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors mr-4"
          >
            Try Again
          </button>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!category || category.contents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">

        <div className="text-center">
          <p className="text-white text-xl mb-4">No songs found in this category</p>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-900 to-black text-white mx-4 rounded-xl mb-8 max-w-screen-lg">
      {/* Hero Banner */}
      <div className="relative h-[180px] md:h-[250px] w-full flex flex-col md:flex-row items-center">
        {category.contents.length >= 4 ? (
          <div className="grid grid-cols-2 grid-rows-2 gap-1 w-full md:w-1/4 h-full">
            {category.contents.slice(0, 4).map((song, index) => (
              <img
                key={song.videoId}
                src={song.thumbnail ? `/api/proxy-image?url=${encodeURIComponent(song.thumbnail)}` : '/defaultcover.png'}
                alt={`${category.title} - Image ${index + 1}`}
                className="w-full h-full object-cover"
                style={{
                  opacity,
                  transition: 'opacity 0.1s ease-in-out',
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex-shrink-0 w-full md:w-1/3 h-full relative">
            <img
              src={category.contents[0]?.thumbnail ? `/api/proxy-image?url=${encodeURIComponent(category.contents[0].thumbnail)}` : '/defaultcover.png'}
              alt={category.title}
              className="w-full h-full object-cover object-center"
              style={{
                opacity,
                transition: 'opacity 0.1s ease-in-out',
              }}
            />
          </div>
        )}
       
        <div className="w-[100%] flex-1 bg-gradient-to-b from-zinc-900 to-none bg-black/0 md:to-black md:bg-black/50 flex flex-col justify-center p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="text-gray-400 hover:text-white transition-colors"
                title="Go back"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-6xl font-black text-left">{category.title}</h1>
                <p className="text-gray-400 text-lg mt-2">{genreName}</p>
              </div>
            </div>
          </div>
          <div className="flex">
            <p className="text-white text-md mt-8 font-medium text-left md:text-center">
              {category.contents.length} {category.contents.length === 1 ? 'song' : 'songs'}
            </p>
            {category.contents.length > 0 && (
              <button
                onClick={playAll}
                className="mt-7 ml-4 flex items-center gap-2 bg-red-600 text-white px-2 py-2 rounded-full hover:bg-red-700 transition-colors"
              >
                <PlayIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Songs List */}
      <div className="p-4 bg-gradient-to-b from-black to-zinc-900 pt-52 md:pt-10">
        <div className="grid grid-cols-1 gap-4">
          {category.contents.map((song, index) => (
            <div
              key={song.videoId}
              className="flex items-center gap-4 p-4 rounded-lg hover:bg-white/10 transition-colors group"
            >
              <div className="relative w-16 h-16 flex-shrink-0">
                <img
                  src={song.thumbnail ? `/api/proxy-image?url=${encodeURIComponent(song.thumbnail)}` : '/defaultcover.png'}
                  alt={song.title}
                  className="w-full h-full object-cover rounded"
                />
                {currentTrack?.videoId === song.videoId && isPlaying ? (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center hover:bg-black/50 transition-colors">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const player = document.querySelector('iframe')?.contentWindow;
                        if (player) {
                          try {
                            player.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                          } catch (error) {
                            console.error('Error pausing video:', error);
                          }
                        }
                        setIsPlaying(false);
                      }}
                      className="z-10"
                    >
                      <div className="bg-red-600 p-1.5 rounded-full hover:bg-red-700 transition-colors">
                        <PauseIcon className="h-5 w-5 text-white" />
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors">
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => playSong(song, index)}
                        className="z-10"
                      >
                        <div className="bg-red-600 p-1.5 rounded-full hover:bg-red-700 transition-colors">
                          <PlayIcon className="h-5 w-5 text-white" />
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">{song.title}</h3>
                <p className="text-gray-400 text-sm truncate">{song.artists || 'Unknown Artist'}</p>
              </div>
              <div className="relative">
                <AddToPlaylistButton
                  track={{
                    videoId: song.videoId,
                    title: song.title,
                    thumbnail: song.thumbnail ? `/api/proxy-image?url=${encodeURIComponent(song.thumbnail)}` : '/defaultcover.png',
                    artist: song.artists || 'Unknown Artist'
                  }}
                  className="!relative !top-0 !right-0 !w-auto !h-auto p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 
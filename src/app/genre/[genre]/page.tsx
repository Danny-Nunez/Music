'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PlayIcon, PauseIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { usePlayerStore } from '../../../store/playerStore';
import AddToPlaylistButton from '../../../components/AddToPlaylistButton';
import type { Swiper as SwiperType } from 'swiper';

import 'swiper/css';
import 'swiper/css/navigation';

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

export default function GenrePage() {
  const params = useParams();
  const router = useRouter();
  const [categories, setCategories] = useState<MusicCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [hoveredSong, setHoveredSong] = useState<string | null>(null);
  const { currentTrack, isPlaying, setCurrentTrack, setQueue, setIsPlaying } = usePlayerStore();
  const swiperRefs = useRef<(SwiperType | null)[]>([]);

  const genre = params.genre as string;
  const genreName = GENRE_NAMES[genre] || genre;

  const fetchGenreData = useCallback(async () => {
    if (!genre || !GENRE_API_MAP[genre]) {
      setError('Invalid genre');
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

      setCategories(data.data.musicItems);
    } catch (err) {
      console.error('Error fetching genre data:', err);
      setError(err instanceof Error ? err.message : `Failed to load ${genreName} music`);
    } finally {
      setLoading(false);
    }
  }, [genre, genreName]);

  useEffect(() => {
    if (genre) {
      fetchGenreData();
    }
  }, [genre, fetchGenreData]);

  const handlePlaylistClick = (playlistId: string) => {
    // Remove "VL" prefix if it exists
    const cleanPlaylistId = playlistId.startsWith('VL') ? playlistId.substring(2) : playlistId;
    router.push(`/playlist/${cleanPlaylistId}`);
  };

  const playSong = async (song: Song, index: number, allSongs: Song[]) => {
    // Format all songs
    const formattedSongs = allSongs.map(s => ({
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

  const handlePrevSlide = (categoryIndex: number) => {
    if (swiperRefs.current[categoryIndex]) {
      swiperRefs.current[categoryIndex]?.slidePrev();
    }
  };

  const handleNextSlide = (categoryIndex: number) => {
    if (swiperRefs.current[categoryIndex]) {
      swiperRefs.current[categoryIndex]?.slideNext();
    }
  };

     const renderSongsSection = (category: MusicCategory) => {
     const songs = category.contents;
     const songsPerPage = 8; // Show 8 songs per page
     const maxPage = Math.ceil(songs.length / songsPerPage) - 1;
     const startIndex = currentPage * songsPerPage;
     const endIndex = startIndex + songsPerPage;
     const currentSongs = songs.slice(startIndex, endIndex);

     return (
       <div className="mb-10 w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white">{category.title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentPage > 0 && !isSliding) {
                  setIsSliding(true);
                  setTimeout(() => {
                    setCurrentPage(currentPage - 1);
                    setIsSliding(false);
                  }, 150);
                }
              }}
              className={`p-2 rounded-full transition-colors ${
                (currentPage > 0 && !isSliding)
                  ? 'bg-gray-800 hover:bg-gray-700' 
                  : 'bg-gray-800 opacity-50 cursor-not-allowed'
              }`}
              disabled={currentPage === 0 || isSliding}
              aria-label="Previous"
            >
              <ChevronLeftIcon className="h-4 w-4 text-white" />
            </button>
            <button
              onClick={() => {
                if (currentPage < maxPage && !isSliding) {
                  setIsSliding(true);
                  setTimeout(() => {
                    setCurrentPage(currentPage + 1);
                    setIsSliding(false);
                  }, 150);
                }
              }}
              className={`p-2 rounded-full transition-colors ${
                (currentPage < maxPage && !isSliding)
                  ? 'bg-gray-800 hover:bg-gray-700' 
                  : 'bg-gray-800 opacity-50 cursor-not-allowed'
              }`}
              disabled={currentPage >= maxPage || isSliding}
              aria-label="Next"
            >
              <ChevronRightIcon className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        <div className={`transition-all duration-300 ease-in-out ${isSliding ? 'transform -translate-x-4 opacity-80' : 'transform translate-x-0 opacity-100'}`}>
          {/* Mobile: Single column with 4 songs */}
          <div className="block md:hidden w-full">
            <div className="space-y-2 w-full">
              {currentSongs.slice(0, 4).map((song, index) => {
                const globalIndex = startIndex + index;
                return (
                  <div
                    key={`${song.videoId}-mobile-${globalIndex}`}
                    className="song-row flex items-center gap-2 p-2 rounded-lg bg-gray-950 border border-gray-900 hover:bg-gray-800/50 transition-colors cursor-pointer group w-full min-w-0"
                    onClick={() => playSong(song, globalIndex, songs)}
                    onMouseEnter={() => setHoveredSong(song.videoId)}
                    onMouseLeave={() => setHoveredSong(null)}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={song.thumbnail ? `/api/proxy-image?url=${encodeURIComponent(song.thumbnail)}` : '/defaultcover.png'}
                        alt={`Album cover for ${song.title}`}
                        className="w-10 h-10 object-cover rounded"
                      />
                      {currentTrack?.videoId === song.videoId ? (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
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
                            }}
                            className="text-white hover:text-red-400 transition-colors"
                          >
                            {isPlaying ? (
                              <PauseIcon className="h-3 w-3" />
                            ) : (
                              <PlayIcon className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className={`absolute inset-0 bg-black flex items-center justify-center rounded transition-opacity ${hoveredSong === song.videoId ? 'bg-opacity-50' : 'bg-opacity-0'}`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playSong(song, globalIndex, songs);
                            }}
                            className={`text-white transition-opacity ${hoveredSong === song.videoId ? 'opacity-100' : 'opacity-0'}`}
                          >
                            <PlayIcon className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h3 className="text-white font-medium text-sm truncate">{song.title}</h3>
                      <p className="text-gray-400 text-xs truncate mt-0.5">
                        {song.artists || 'Unknown Artist'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <AddToPlaylistButton
                        track={{
                          videoId: song.videoId,
                          title: song.title,
                          thumbnail: song.thumbnail ? `/api/proxy-image?url=${encodeURIComponent(song.thumbnail)}` : '/defaultcover.png',
                          artist: song.artists || 'Unknown Artist'
                        }}
                        className="!relative !top-0 !right-0 !w-auto !h-auto p-1.5 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop: Two columns with 4 songs each */}
          <div className="hidden md:block w-full">
            <div className="grid grid-cols-2 gap-4 w-full">
              {/* Left Column */}
              <div className="space-y-2 w-full min-w-0">
                {currentSongs.slice(0, 4).map((song, index) => {
                  const globalIndex = startIndex + index;
                  return (
                    <div
                      key={`${song.videoId}-left-${globalIndex}`}
                      className="song-row flex items-center gap-3 p-3 rounded-lg bg-gray-950 border border-gray-900 hover:bg-gray-800/50 transition-colors cursor-pointer group w-full min-w-0"
                      onClick={() => playSong(song, globalIndex, songs)}
                      onMouseEnter={() => setHoveredSong(song.videoId)}
                      onMouseLeave={() => setHoveredSong(null)}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={song.thumbnail ? `/api/proxy-image?url=${encodeURIComponent(song.thumbnail)}` : '/defaultcover.png'}
                          alt={`Album cover for ${song.title}`}
                          className="w-12 h-12 object-cover rounded"
                        />
                        {currentTrack?.videoId === song.videoId ? (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
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
                              }}
                              className="text-white hover:text-red-400 transition-colors"
                            >
                              {isPlaying ? (
                                <PauseIcon className="h-4 w-4" />
                              ) : (
                                <PlayIcon className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className={`absolute inset-0 bg-black flex items-center justify-center rounded transition-opacity ${hoveredSong === song.videoId ? 'bg-opacity-50' : 'bg-opacity-0'}`}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playSong(song, globalIndex, songs);
                              }}
                              className={`text-white transition-opacity ${hoveredSong === song.videoId ? 'opacity-100' : 'opacity-0'}`}
                            >
                              <PlayIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <h3 className="text-white font-medium text-sm truncate">{song.title}</h3>
                        <p className="text-gray-400 text-xs truncate mt-0.5">
                          {song.artists || 'Unknown Artist'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
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
                  );
                })}
              </div>

              {/* Right Column */}
              <div className="space-y-2 w-full min-w-0">
                {currentSongs.slice(4, 8).map((song, index) => {
                  const globalIndex = startIndex + index + 4;
                  return (
                    <div
                      key={`${song.videoId}-right-${globalIndex}`}
                      className="song-row flex items-center gap-3 p-3 rounded-lg bg-gray-950 border border-gray-900 hover:bg-gray-800/50 transition-colors cursor-pointer group w-full min-w-0"
                      onClick={() => playSong(song, globalIndex, songs)}
                      onMouseEnter={() => setHoveredSong(song.videoId)}
                      onMouseLeave={() => setHoveredSong(null)}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={song.thumbnail ? `/api/proxy-image?url=${encodeURIComponent(song.thumbnail)}` : '/defaultcover.png'}
                          alt={`Album cover for ${song.title}`}
                          className="w-12 h-12 object-cover rounded"
                        />
                        {currentTrack?.videoId === song.videoId ? (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
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
                              }}
                              className="text-white hover:text-red-400 transition-colors"
                            >
                              {isPlaying ? (
                                <PauseIcon className="h-4 w-4" />
                              ) : (
                                <PlayIcon className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className={`absolute inset-0 bg-black flex items-center justify-center rounded transition-opacity ${hoveredSong === song.videoId ? 'bg-opacity-50' : 'bg-opacity-0'}`}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playSong(song, globalIndex, songs);
                              }}
                              className={`text-white transition-opacity ${hoveredSong === song.videoId ? 'opacity-100' : 'opacity-0'}`}
                            >
                              <PlayIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <h3 className="text-white font-medium text-sm truncate">{song.title}</h3>
                        <p className="text-gray-400 text-xs truncate mt-0.5">
                          {song.artists || 'Unknown Artist'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
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
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPlaylistSection = (category: MusicCategory, categoryIndex: number) => {
     return (
       <div className="relative px-0 sm:px-0 py-2 -mx-4 sm:mx-6 overflow-hidden scrollbar-hide mb-8">
         <div className="max-w-[360px] sm:max-w-[580px] md:max-w-[780px] lg:max-w-[980px] xl:max-w-[1280px] mx-auto">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl sm:text-2xl font-bold text-white">{category.title}</h2>
             <div className="flex items-center gap-2">
               <button
                 onClick={() => handlePrevSlide(categoryIndex)}
                 className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                 aria-label="Previous"
               >
                 <ChevronLeftIcon className="h-4 w-4 text-white" />
               </button>
               <button
                 onClick={() => handleNextSlide(categoryIndex)}
                 className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                 aria-label="Next"
               >
                 <ChevronRightIcon className="h-4 w-4 text-white" />
               </button>
             </div>
           </div>

           <Swiper
             modules={[Navigation]}
             spaceBetween={8}
             slidesPerView={1.3}
             onSwiper={(swiper) => {
               swiperRefs.current[categoryIndex] = swiper;
             }}
             breakpoints={{
               330: { slidesPerView: 1.3, spaceBetween: 8 },
               480: { slidesPerView: 2, spaceBetween: 16 },
               640: { slidesPerView: 2.5, spaceBetween: 20 },
               768: { slidesPerView: 3, spaceBetween: 24 },
               1024: { slidesPerView: 4, spaceBetween: 28 },
             }}
             className={`playlist-cards-swiper-${categoryIndex}`}
           >
             {category.contents.map((item, itemIndex) => (
               <SwiperSlide key={`${categoryIndex}-item-${item.videoId}-${itemIndex}`}>
                 <div
                   onClick={() => handlePlaylistClick(item.playlistId)}
                   className="block group text-center w-full cursor-pointer"
                 >
                   <div className="flex flex-col items-center">
                     <div className="relative mb-2">
                       <div className="relative w-full aspect-square overflow-hidden rounded-lg">
                         <img
                           src={item.thumbnail ? `/api/proxy-image?url=${encodeURIComponent(item.thumbnail)}` : '/defaultcover.png'}
                           alt={item.title}
                           className="w-full h-full object-cover"
                         />
                         <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-colors"></div>
                       </div>
                     </div>
                     <div className="w-full px-2">
                       <h3 className="text-white group-hover:text-gray-400 font-medium text-xs sm:text-sm truncate transition-colors">
                         {item.title}
                       </h3>
                       <p className="text-gray-400 text-xs mt-1 truncate">
                         {item.artists || 'Unknown Artist'}
                       </p>
                     </div>
                   </div>
                 </div>
               </SwiperSlide>
             ))}
           </Swiper>
         </div>
       </div>
     );
   };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-900 to-black text-white pt-20 rounded-lg max-w-screen-lg">
        <div className="p-8">
          <div className="h-12 w-64 bg-white/10 rounded animate-pulse mb-8"></div>
                     <div className="space-y-8">
             {[...Array(3)].map((_, i) => (
               <div key={`loading-section-${i}`}>
                <div className="h-6 w-32 bg-white/10 rounded animate-pulse mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     {[...Array(8)].map((_, j) => (
                     <div key={`loading-item-${i}-${j}`} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <div className="w-12 h-12 bg-white/10 rounded animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 w-32 bg-white/10 rounded animate-pulse mb-1"></div>
                        <div className="h-3 w-24 bg-white/10 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
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
            onClick={fetchGenreData}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white">No {genreName} content found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-900 to-black text-white mx-4 rounded-xl mb-8 max-w-screen-lg">
      <div className="p-4 sm:p-8">
        <h1 className="text-4xl font-bold text-white mb-8">{genreName}</h1>
        
        {categories.map((category, categoryIndex) => {
          // Check if this is a Songs category (render as 2-column layout)
          const isSongsCategory = category.title.toLowerCase().includes('song');
          
          return (
            <div key={`category-${categoryIndex}-${category.title}`}>
              {isSongsCategory 
                ? renderSongsSection(category)
                : renderPlaylistSection(category, categoryIndex)}
            </div>
          );
        })}
      </div>
    </div>
  );
} 
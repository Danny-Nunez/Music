'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Swiper as SwiperType } from 'swiper';

import 'swiper/css';
import 'swiper/css/navigation';

interface PlaylistItem {
  title: string;
  videoId: string;
  playlistId: string;
  artists: string;
  thumbnail: string;
}

interface MusicCategory {
  title: string;
  contents: PlaylistItem[];
}

interface ApiResponse {
  success: boolean;
  data: {
    musicItems: MusicCategory[];
  };
}

export default function PlaylistCards() {
  const router = useRouter();
  const [musicCategories, setMusicCategories] = useState<MusicCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const swiperRefs = useRef<(SwiperType | null)[]>([]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchPlaylistData = async () => {
      try {
        if (!isMounted) return;
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/get-mobile-commute-feed-url', {
          signal: controller.signal
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch playlist data: ${response.status}`);
        }
        
        const data: ApiResponse = await response.json();
        
        if (!isMounted) return;
        
        if (data.success && data.data?.musicItems) {
          setMusicCategories(data.data.musicItems);
        } else {
          throw new Error('Invalid API response structure');
        }
      } catch (err) {
        if (!isMounted) return;
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error('Error fetching playlist data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load playlists');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPlaylistData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const handlePlaylistClick = (playlistId: string) => {
    router.push(`/playlist/${playlistId}`);
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

  if (isLoading) {
    return (
      <div className="space-y-8">
        {[...Array(3)].map((_, categoryIndex) => (
          <div key={categoryIndex} className="relative px-0 sm:px-0 py-2 -mx-4 sm:mx-6 overflow-hidden scrollbar-hide">
            <div className="max-w-[380px] sm:max-w-[580px] md:max-w-[780px] lg:max-w-[980px] xl:max-w-[1280px] mx-auto">
              <div className="flex justify-between items-center mb-4">
                <div className="h-6 bg-gray-700 rounded animate-pulse w-32"></div>
              </div>
              <div className="flex space-x-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-48 sm:w-56">
                    <div className="w-full aspect-square bg-gray-700 rounded-lg animate-pulse mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded animate-pulse mb-1"></div>
                    <div className="h-3 bg-gray-700 rounded animate-pulse w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative px-0 sm:px-0 py-2 -mx-4 sm:mx-6 overflow-hidden scrollbar-hide">
        <div className="max-w-[380px] sm:max-w-[580px] md:max-w-[780px] lg:max-w-[980px] xl:max-w-[1280px] mx-auto">
          <div className="text-red-400 text-center py-8">
            <p>Error loading playlists: {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (musicCategories.length === 0) {
    return (
      <div className="relative px-0 sm:px-0 py-2 -mx-4 sm:mx-6 overflow-hidden scrollbar-hide">
        <div className="max-w-[380px] sm:max-w-[580px] md:max-w-[780px] lg:max-w-[980px] xl:max-w-[1280px] mx-auto">
          <div className="text-gray-400 text-center py-8">
            <p>No playlists available</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {musicCategories.map((category, categoryIndex) => (
        <div key={categoryIndex} className="relative px-0 sm:px-0 py-2 -mx-4 sm:mx-6 overflow-hidden scrollbar-hide">
          <div className="max-w-[380px] sm:max-w-[580px] md:max-w-[780px] lg:max-w-[980px] xl:max-w-[1280px] mx-auto">
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
              spaceBetween={12}
              slidesPerView={1.5}
              onSwiper={(swiper) => {
                swiperRefs.current[categoryIndex] = swiper;
              }}
              breakpoints={{
                330: { slidesPerView: 1.5, spaceBetween: 12 },
                480: { slidesPerView: 2, spaceBetween: 16 },
                640: { slidesPerView: 2.5, spaceBetween: 20 },
                768: { slidesPerView: 3, spaceBetween: 24 },
                1024: { slidesPerView: 4, spaceBetween: 28 },
              }}
              className={`playlist-cards-swiper-${categoryIndex}`}
            >
              {category.contents.map((playlist, playlistIndex) => (
                <SwiperSlide key={playlistIndex}>
                  <div
                    onClick={() => handlePlaylistClick(playlist.playlistId)}
                    className="block group text-center w-full cursor-pointer"
                  >
                    <div className="flex flex-col items-center">
                      <div className="relative mb-2">
                        <div className="relative w-full aspect-square overflow-hidden rounded-lg">
                          <img
                            src={`/api/proxy-image?url=${encodeURIComponent(playlist.thumbnail)}`}
                            alt={playlist.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div className="bg-white bg-opacity-90 text-black p-2 rounded-full">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="w-full px-2">
                        <h3 className="text-white group-hover:text-gray-400 font-medium text-xs sm:text-sm truncate transition-colors">
                          {playlist.title}
                        </h3>
                        <p className="text-gray-400 text-xs mt-1 truncate">
                         
                        </p>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      ))}
    </div>
  );
} 
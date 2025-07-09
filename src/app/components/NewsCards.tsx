'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { usePlayerStore } from '../../store/playerStore';
import { PauseIcon, PlayIcon } from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';

import 'swiper/css';
import 'swiper/css/navigation';

interface NewsStream {
  id: string;
  title: string;
  videoId: string;
  thumbnail: string;
  watching: number;
  channel: {
    id: string;
    name: string;
    link: string;
    handle: string;
    verified: boolean;
    thumbnail: string;
  };
}

interface ApiResponse {
  [key: string]: {
    id: string;
    title: string;
    thumbnail: string;
    link: string;
    watching: number;
    channel: {
      id: string;
      name: string;
      link: string;
      handle: string;
      verified: boolean;
      thumbnail: string;
    };
  };
}

interface CachedNewsData {
  streams: NewsStream[];
  timestamp: number;
}

export default function NewsCards() {
  const { currentTrack, isPlaying, setCurrentTrack, setIsPlaying } = usePlayerStore();
  const [newsStreams, setNewsStreams] = useState<NewsStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchNewsStreams = async () => {
      try {
        if (!isMounted) return;
        setIsLoading(true);
        setError(null);
        
        // Check localStorage for cached data
        const cachedData = getCachedNewsData();
        if (cachedData) {
          setNewsStreams(cachedData.streams);
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/news', {
          signal: controller.signal
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch news streams: ${response.status}`);
        }
        
        const data: ApiResponse = await response.json();
        
        if (!isMounted) return;
        
        // Transform the API response to match our component's expected structure
        // Filter out null/undefined streams and ensure all required fields exist
        const transformedStreams: NewsStream[] = Object.entries(data)
          .filter(([key, stream]) => stream && stream.id && stream.title)
          .map(([key, stream]) => ({
            id: key,
            title: stream.title,
            videoId: stream.id,
            thumbnail: stream.thumbnail || `https://img.youtube.com/vi/${stream.id}/0.jpg`,
            watching: stream.watching || 0,
            channel: stream.channel || {
              id: '',
              name: 'Unknown',
              link: '',
              handle: '',
              verified: false,
              thumbnail: ''
            }
          }));
        
        if (isMounted) {
          // Cache the results
          setCachedNewsData(transformedStreams);
          setNewsStreams(transformedStreams);
        }
      } catch (err) {
        if (!isMounted) return;
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error('Error fetching news streams:', err);
        setError(err instanceof Error ? err.message : 'Failed to load news streams');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchNewsStreams();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // Cache management functions
  const getCachedNewsData = (): CachedNewsData | null => {
    try {
      const cached = localStorage.getItem('beatinbox_news_streams');
      if (!cached) return null;
      
      const parsedData: CachedNewsData = JSON.parse(cached);
      const now = Date.now();
      const twoHours = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
      
      if (now - parsedData.timestamp < twoHours) {
        return parsedData;
      }
      
      // Cache expired, remove it
      localStorage.removeItem('beatinbox_news_streams');
      return null;
    } catch (error) {
      console.error('Error reading cached news data:', error);
      return null;
    }
  };

  const setCachedNewsData = (streams: NewsStream[]): void => {
    try {
      const cacheData: CachedNewsData = {
        streams,
        timestamp: Date.now()
      };
      localStorage.setItem('beatinbox_news_streams', JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching news data:', error);
    }
  };

  const handlePlayPause = (stream: NewsStream, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const player = document.querySelector('iframe')?.contentWindow;
    if (currentTrack?.videoId === stream.videoId) {
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
    } else {
      setCurrentTrack({
        id: stream.videoId,
        videoId: stream.videoId,
        title: stream.title,
        artist: 'Live News',
        thumbnail: stream.thumbnail
      });
      if (player) {
        try {
          player.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
          setIsPlaying(true);
        } catch (error) {
          console.error('Error playing video:', error);
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="relative px-0 sm:px-0 py-2 -mx-4 sm:mx-6 overflow-hidden scrollbar-hide">
        <div className="max-w-[380px] sm:max-w-[580px] md:max-w-[780px] lg:max-w-[980px] xl:max-w-[1280px] mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Live News</h2>
          </div>
          <div className="flex space-x-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-48 sm:w-56">
                <div className="w-full aspect-video bg-gray-700 rounded-lg animate-pulse mb-2"></div>
                <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative px-0 sm:px-0 py-2 -mx-4 sm:mx-6 overflow-hidden scrollbar-hide">
        <div className="max-w-[380px] sm:max-w-[580px] md:max-w-[780px] lg:max-w-[980px] xl:max-w-[1280px] mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Live News</h2>
          </div>
          <div className="text-red-400 text-center py-8">
            <p>Error loading news streams: {error}</p>
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

  if (newsStreams.length === 0) {
    return (
      <div className="relative px-0 sm:px-0 py-2 -mx-4 sm:mx-6 overflow-hidden scrollbar-hide">
        <div className="max-w-[380px] sm:max-w-[580px] md:max-w-[780px] lg:max-w-[980px] xl:max-w-[1280px] mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Live News</h2>
          </div>
          <div className="text-gray-400 text-center py-8">
            <p>No news streams available</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative px-0 sm:px-0 py-2 -mx-4 sm:mx-6 overflow-hidden scrollbar-hide">
      <div className="max-w-[380px] sm:max-w-[580px] md:max-w-[780px] lg:max-w-[980px] xl:max-w-[1280px] mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Live News</h2>
        </div>

        <Swiper
          modules={[Navigation]}
          spaceBetween={12}
          slidesPerView={1.5}
          navigation
          breakpoints={{
            330: { slidesPerView: 1.5, spaceBetween: 12 },
            480: { slidesPerView: 2, spaceBetween: 16 },
            640: { slidesPerView: 2.5, spaceBetween: 20 },
            768: { slidesPerView: 3, spaceBetween: 24 },
            1024: { slidesPerView: 4, spaceBetween: 28 },
          }}
          className="news-cards-swiper"
        >
          {newsStreams.map((stream) => (
            <SwiperSlide key={stream.id}>
              <div
                onClick={() => handlePlayPause(stream)}
                className="block group text-center w-full cursor-pointer"
              >
                <div className="flex flex-col items-center">
                  <div className="relative mb-2">
                    <div className="relative w-full aspect-video overflow-hidden rounded-lg">
                      <img
                        src={stream.thumbnail}
                        alt={stream.title}
                        className="w-full h-full object-cover"
                      />
                      <div className={`absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-200 ${currentTrack?.videoId === stream.videoId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button
                          type="button"
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white p-2 sm:p-3 rounded-full hover:bg-red-700 transition-colors"
                          onClick={(e) => handlePlayPause(stream, e)}
                        >
                          {currentTrack?.videoId === stream.videoId ? (
                            isPlaying ? (
                              <PauseIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                            ) : (
                              <PlayIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                            )
                          ) : (
                            <PlayIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="w-full px-2">
                    <h3 className="text-white group-hover:text-gray-400 font-medium text-xs sm:text-sm truncate transition-colors">
                      {stream.title}
                    </h3>
                    <p className="text-gray-400 text-xs mt-1">
                      {stream.channel.name}
                      {stream.channel.verified && (
                        <span className="ml-1 text-blue-400">✓</span>
                      )}
                    </p>
                    {stream.watching > 0 && (
                      <p className="text-gray-400 text-xs mt-1">
                        {stream.watching.toLocaleString()} watching
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
} 
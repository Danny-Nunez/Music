'use client';

import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { useRouter } from 'next/navigation';

import 'swiper/css';
import 'swiper/css/navigation';

interface Playlist {
  type: string;
  browseId: string;
  title: string;
  author: string;
  trackCount: number;
  thumbnails: {
    url: string;
    width: number;
    height: number;
  }[];
}

interface ArtistPlaylistsProps {
  artistName: string;
  headerImage: string;
  onPlaylistCountChange?: (count: number) => void;
  onLoadingChange?: (loading: boolean) => void;
}

export default function ArtistPlaylists({ artistName, headerImage, onPlaylistCountChange, onLoadingChange }: ArtistPlaylistsProps) {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        onLoadingChange?.(true);
        const response = await fetch(`/api/youtubemusic?q=${encodeURIComponent(artistName)}&type=playlist`);
        if (!response.ok) {
          throw new Error('Failed to fetch playlists');
        }
        const data = await response.json();
        console.log('Playlist data:', data);
        const playlistsData = data.content || [];
        setPlaylists(playlistsData);
        onPlaylistCountChange?.(playlistsData.length);
      } catch (error) {
        console.error('Error fetching playlists:', error);
      } finally {
        setLoading(false);
        onLoadingChange?.(false);
      }
    };

    if (artistName) {
      fetchPlaylists();
    }
  }, [artistName, onLoadingChange]);

  if (loading) {
    return (
      <div className="relative px-0 sm:px-0 py-2 -mx-4 sm:mx-6">
        <div className="max-w-[380px] sm:max-w-[580px] md:max-w-[780px] lg:max-w-[980px] xl:max-w-[1280px] mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Playlists</h2>
          </div>
          <div className="flex gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-48 animate-pulse">
                <div className="aspect-square bg-white/10 rounded-lg mb-2"></div>
                <div className="h-4 bg-white/10 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-white/10 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!playlists.length) {
    return null;
  }

  return (
    <div className="relative px-0 sm:px-0 py-2 -mx-4 sm:mx-6 overflow-hidden scrollbar-hide">
      <div className="max-w-[380px] sm:max-w-[580px] md:max-w-[780px] lg:max-w-[980px] xl:max-w-[1280px] mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Playlists</h2>
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
          className="radio-cards-swiper"
        >
          {playlists.map((playlist) => (
            <SwiperSlide key={playlist.browseId}>
              <div 
                onClick={() => {
                  // Extract the actual ID from the browseId (remove VLPLy prefix if present)
                  const cleanId = playlist.browseId.replace(/^VLPL/, 'PL');
                  router.push(`/playlist/${cleanId}`);
                }}
                className="block group text-center w-full cursor-pointer"
              >
                <div className="flex flex-col items-center">
                  <div className="relative mb-2">
                    <div className="relative w-full aspect-square overflow-hidden rounded-lg">
                      <img
                        src={playlist.thumbnails[1]?.url ? 
                          `/api/proxy-image?url=${encodeURIComponent(playlist.thumbnails[1].url)}` : 
                          headerImage}
                        alt={playlist.title}
                        className="w-full h-52 object-cover"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.src = headerImage;
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-full px-2">
                    <h3 className="text-white group-hover:text-gray-400 font-medium text-xs sm:text-sm truncate transition-colors">
                      {playlist.title}
                    </h3>
                    <p className="text-gray-400 text-xs truncate">
                      {playlist.author} • {playlist.trackCount} {playlist.trackCount === 1 ? 'track' : 'tracks'}
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
}

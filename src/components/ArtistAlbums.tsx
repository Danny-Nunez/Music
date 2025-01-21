'use client';

import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { useRouter } from 'next/navigation';

import 'swiper/css';
import 'swiper/css/navigation';

interface Album {
  type: string;
  browseId: string;
  playlistId: string;
  name: string;
  artist: string;
  year: string;
  thumbnails: {
    url: string;
    width: number;
    height: number;
  }[];
}

interface ArtistAlbumsProps {
  artistName: string;
  headerImage: string;
}

export default function ArtistAlbums({ artistName, headerImage }: ArtistAlbumsProps) {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await fetch(`/api/youtubemusic?q=${encodeURIComponent(artistName)}&type=album`);
        if (!response.ok) {
          throw new Error('Failed to fetch albums');
        }
        const data = await response.json();
        console.log('Album data:', data);
        setAlbums(data.content || []);
      } catch (error) {
        console.error('Error fetching albums:', error);
      } finally {
        setLoading(false);
      }
    };

    if (artistName) {
      fetchAlbums();
    }
  }, [artistName]);

  useEffect(() => {
    if (albums.length > 0) {
      console.log('Albums state:', albums);
      albums.forEach(album => {
        console.log('Album details:', {
          name: album.name,
          thumbnails: album.thumbnails,
          selectedThumb: album.thumbnails[2]?.url
        });
      });
    }
  }, [albums]);

  if (loading) {
    return (
      <div className="relative px-0 sm:px-0 py-2 -mx-4 sm:mx-6">
        <div className="max-w-[380px] sm:max-w-[580px] md:max-w-[780px] lg:max-w-[980px] xl:max-w-[1280px] mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Albums</h2>
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

  if (!albums.length) {
    return null;
  }

  return (
    <div className="relative px-0 sm:px-0 py-2 -mx-4 sm:mx-6 overflow-hidden scrollbar-hide">
      <div className="max-w-[380px] sm:max-w-[580px] md:max-w-[780px] lg:max-w-[980px] xl:max-w-[1280px] mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Albums</h2>
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
          {albums.map((album) => (
            <SwiperSlide key={album.browseId}>
              <div 
                onClick={() => router.push(`/album/${album.browseId}`)}
                className="block group text-center w-full cursor-pointer"
              >
                <div className="flex flex-col items-center">
                  <div className="relative mb-2">
                    <div className="relative w-full aspect-square overflow-hidden rounded-lg">
                      <img
                        src={album.thumbnails[2]?.url || headerImage}
                        alt={album.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.src = headerImage;
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-full px-2">
                    <h3 className="text-white group-hover:text-gray-400 font-medium text-xs sm:text-sm truncate transition-colors">
                      {album.name}
                    </h3>
                    <p className="text-gray-400 text-xs truncate">
                      {album.year}
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

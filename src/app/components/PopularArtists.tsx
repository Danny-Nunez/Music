'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface YoutubeMusicArtist {
  type: string;
  name: string;
  thumbnails: {
    url: string;
    width: number;
    height: number;
  }[];
}

interface Artist {
  id: string;
  name: string;
  thumbnail: {
    thumbnails: { url: string }[];
  };
  alternativeImage?: string;
}

export default function PopularArtists() {
  const [artists, setArtists] = useState<Artist[]>([]);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const response = await fetch('/api/popular-artists', {
          method: 'POST'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const artists = data?.contents?.sectionListRenderer?.contents?.[0]?.musicAnalyticsSectionRenderer?.content?.artists?.[0]?.artistViews;
        if (!artists) throw new Error('Artists not found');

        const topArtists = artists
          .filter((artist: Artist) => artist?.thumbnail?.thumbnails?.[0]?.url)
          .map((artist: Artist) => ({
            id: artist.id,
            name: artist.name,
            thumbnail: artist.thumbnail,
          }))
          .slice(0, 10);

        // Fetch alternative images for each artist
        const artistsWithImages = await Promise.all(
          topArtists.map(async (artist: Artist) => {
            try {
              const response = await fetch(`/api/youtubemusic?q=${encodeURIComponent(artist.name)}&type=artist`);
              if (!response.ok) throw new Error('Failed to fetch alternative image');
              
              const data = await response.json();
              const matchingArtist = data.content?.find((item: YoutubeMusicArtist) => 
                item.type === 'artist' && 
                item.name.toLowerCase() === artist.name.toLowerCase()
              );
              
              return {
                ...artist,
                alternativeImage: matchingArtist?.thumbnails?.[1]?.url || null
              };
            } catch (error) {
              console.error(`Error fetching image for ${artist.name}:`, error);
              return artist;
            }
          })
        );

        setArtists(artistsWithImages);
      } catch (error) {
        console.error('Error fetching artists:', error);
      }
    };

    fetchArtists();
  }, []);

  return (
    <div className="relative px-0 sm:px-0 py-2 -mx-4 sm:mx-6 overflow-hidden scrollbar-hide">
      <div className="max-w-[380px] sm:max-w-[580px] md:max-w-[780px] lg:max-w-[980px] xl:max-w-[1280px] mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Popular Artists</h2>
        </div>

        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={8}
          slidesPerView={2}
          navigation
          breakpoints={{
            330: { slidesPerView: 2, spaceBetween: 12 },
            480: { slidesPerView: 2.5, spaceBetween: 16 },
            640: { slidesPerView: 3, spaceBetween: 20 },
            768: { slidesPerView: 5, spaceBetween: 20 },
            1024: { slidesPerView: 6, spaceBetween: 24 },
          }}
          className="popular-artists-swiper"
        >
          {artists.map((artist) => (
            <SwiperSlide key={artist.id}>
              <Link
                href={`/artist${artist.id}`}
                className="block group text-center w-full"
              >
                <div className="flex flex-col items-center">
                  <div className="relative mb-2">
                    {/* Border Animation Container */}
                    <div className="absolute inset-0 rounded-full border-2 border-transparent overflow-hidden">
                      <div className="absolute inset-0 rounded-full bg-transparent group-hover:bg-fill-circle transition-all"></div>
                    </div>
                    {/* Image Container */}
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 overflow-hidden rounded-full border-2 border-transparent">
                      <Image
                        src={artist.alternativeImage || '/defaultcover.png'}
                        alt={artist.name}
                        layout="fill"
                        className="object-cover rounded-full"
                        unoptimized
                      />
                      {/* Dark Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  </div>
                  {/* Gray Text on Hover */}
                  <div className="w-full px-2">
                    <h3 className="text-white group-hover:text-gray-400 font-medium text-xs sm:text-sm truncate mt-1 sm:mt-2">
                      {artist.name}
                    </h3>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}

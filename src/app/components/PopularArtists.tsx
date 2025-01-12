'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface Artist {
  id: string;
  name: string;
  thumbnail: {
    thumbnails: { url: string }[];
  };
}

export default function PopularArtists() {
  const [artists, setArtists] = useState<Artist[]>([]);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const response = await fetch('/top100-artists.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const artistViews =
          data?.contents?.sectionListRenderer?.contents?.[0]?.musicAnalyticsSectionRenderer?.content?.artists?.[0]?.artistViews;

        if (!artistViews) throw new Error('Artist views not found');

        const topArtists = artistViews
          .filter((artist: Artist) => artist?.thumbnail?.thumbnails?.[0]?.url)
          .map((artist: Artist) => ({
            id: artist.id,
            name: artist.name,
            thumbnail: artist.thumbnail,
          }))
          .slice(0, 20);

        setArtists(topArtists);
      } catch (error) {
        console.error('Error fetching artists:', error);
      }
    };

    fetchArtists();
  }, []);

  return (
    <div className="relative px-0 sm:px-0 py-2 -mx-4 sm:-mx-6 overflow-hidden scrollbar-hide">
      <div className="max-w-[380px] sm:max-w-[580px] md:max-w-[780px] lg:max-w-[980px] xl:max-w-[1280px] mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Popular Artists</h2>
        </div>

        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={8}
          slidesPerView={2.5}
          navigation
          breakpoints={{
            330: { slidesPerView: 2.5, spaceBetween: 8 },
            480: { slidesPerView: 3, spaceBetween: 12 },
            640: { slidesPerView: 4, spaceBetween: 16 },
            768: { slidesPerView: 5, spaceBetween: 20 },
            1024: { slidesPerView: 6, spaceBetween: 24 },
          }}
          className="popular-artists-swiper"
        >
          {artists.map((artist) => (
            <SwiperSlide key={artist.id}>
              <Link
                href={`/artist/${artist.id.split('/').pop()}`}
                className="block group text-center w-full"
              >
                <div className="flex flex-col items-center">
                  <div className="relative mb-2">
                    {/* Border Animation Container */}
                    <div className="absolute inset-0 rounded-full border-2 border-transparent overflow-hidden">
                      <div className="absolute inset-0 rounded-full bg-transparent group-hover:bg-fill-circle transition-all"></div>
                    </div>
                    {/* Image Container */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 overflow-hidden rounded-full border-2 border-transparent">
                      <Image
                        src={artist.thumbnail.thumbnails[0].url}
                        alt={artist.name}
                        layout="fill"
                        className="object-cover rounded-full"
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

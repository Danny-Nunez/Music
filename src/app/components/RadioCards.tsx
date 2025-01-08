'use client';

import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { usePlayerStore } from '../../store/playerStore';

import 'swiper/css';
import 'swiper/css/navigation';

interface RadioStream {
  id: string;
  title: string;
  videoId: string;
}

const radioStreams: RadioStream[] = [
  {
    id: 'radio1',
    title: 'Hits Radio 1',
    videoId: '8M0AvPvPg0A'
  },
  {
    id: 'radio2',
    title: '2000 Hip Hop Mix Radio',
    videoId: 'tB604VtXqyo'
  },
  {
    id: 'radio3',
    title: 'Rock Classic Mix Radio',
    videoId: 'N5M1kIdcKhE'
  },
  {
    id: 'radio4',
    title: 'Tomorrowland - One World Radio',
    videoId: 'ATkRj9XudOA'
  }
];

export default function RadioCards() {
  const { setCurrentTrack } = usePlayerStore();
  return (
    <div className="relative px-0 sm:px-0 py-2 ml-0 xl:max-w-[1024px] lg:max-w-[768px] md:max-w-[640px] max-w-[400px] overflow-hidden scrollbar-hide">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Live Radio</h2>
      </div>

      <Swiper
        modules={[Navigation]}
        spaceBetween={10}
        slidesPerView={2}
        navigation
        breakpoints={{
          480: { slidesPerView: 2, spaceBetween: 1 },
          640: { slidesPerView: 3, spaceBetween: 8 },
          768: { slidesPerView: 4, spaceBetween: 12 },
        }}
        className="radio-cards-swiper"
      >
        {radioStreams.map((stream) => (
          <SwiperSlide key={stream.id}>
            <button
              onClick={() => {
                setCurrentTrack({
                  id: stream.videoId,
                  videoId: stream.videoId,
                  title: stream.title,
                  artist: 'Live Radio',
                  thumbnail: `https://img.youtube.com/vi/${stream.videoId}/0.jpg`
                });
              }}
              className="block group text-center w-full"
            >
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <div className="relative w-full aspect-video overflow-hidden rounded-lg">
                    <img
                      src={`https://img.youtube.com/vi/${stream.videoId}/0.jpg`}
                      alt={stream.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </div>
                <div className="w-full px-2">
                  <h3 className="text-white group-hover:text-gray-400 font-medium text-sm truncate transition-colors">
                    {stream.title}
                  </h3>
                </div>
              </div>
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
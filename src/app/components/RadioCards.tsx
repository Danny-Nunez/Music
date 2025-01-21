'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { usePlayerStore } from '../../store/playerStore';
import { PauseIcon, PlayIcon } from '@heroicons/react/24/solid';

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
    videoId: 'Nt27aBceerI'
  },
  {
    id: 'radio4',
    title: 'Tomorrowland - One World Radio',
    videoId: 'ATkRj9XudOA'
  }
];

export default function RadioCards() {
  const { currentTrack, isPlaying, setCurrentTrack, setIsPlaying } = usePlayerStore();

  const handlePlayPause = (stream: RadioStream, e?: React.MouseEvent) => {
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
        artist: 'Live Radio',
        thumbnail: `https://img.youtube.com/vi/${stream.videoId}/0.jpg`
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
  
  return (
    <div className="relative px-0 sm:px-0 py-2 -mx-4 sm:mx-6 overflow-hidden scrollbar-hide">
      <div className="max-w-[380px] sm:max-w-[580px] md:max-w-[780px] lg:max-w-[980px] xl:max-w-[1280px] mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Live Radio</h2>
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
          {radioStreams.map((stream) => (
            <SwiperSlide key={stream.id}>
              <div
                onClick={() => handlePlayPause(stream)}
                className="block group text-center w-full cursor-pointer"
              >
                <div className="flex flex-col items-center">
                  <div className="relative mb-2">
                    <div className="relative w-full aspect-video overflow-hidden rounded-lg">
                      <img
                        src={`https://img.youtube.com/vi/${stream.videoId}/0.jpg`}
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

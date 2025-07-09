'use client';

import { useEffect, useState } from 'react';
import { PlayIcon, PauseIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { usePlayerStore } from '../store/playerStore';
import AddToPlaylistButton from '../components/AddToPlaylistButton';
import PopularArtists from './components/PopularArtists';
import RadioCards from './components/RadioCards';
import NewsCards from './components/NewsCards';
import PlaylistCards from './components/PlaylistCards';

interface Song {
  id: string;
  name: string;
  viewCount: string;
  encryptedVideoId: string;
  thumbnail: {
    thumbnails: { url: string }[];
  };
  artists: { name: string }[];
}

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [cloudinaryUrl, setCloudinaryUrl] = useState<string | null>(null);
  const { currentTrack, isPlaying, setCurrentTrack, setQueue, setIsPlaying } = usePlayerStore();
  const [currentPage, setCurrentPage] = useState(0);
  const [isSliding, setIsSliding] = useState(false);

  useEffect(() => {
    const fetchCloudinaryUrl = async () => {
      try {
        // Check for cached Cloudinary URL
        const cachedData = localStorage.getItem('trending-songs-cache');
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          const isExpired = Date.now() - parsed.timestamp > 2 * 60 * 60 * 1000; // 2 hours
          
          if (!isExpired && parsed.cloudinaryUrl) {
            setCloudinaryUrl(parsed.cloudinaryUrl);
            return;
          }
        }

        const response = await fetch('/api/get-latest-cloudinary-url?folder=top100-songs');
        if (!response.ok) {
          throw new Error(`Failed to fetch Cloudinary URL: ${response.statusText}`);
        }
        const data = await response.json();
        setCloudinaryUrl(data.url);
      } catch (error) {
        console.error('Error fetching Cloudinary URL:', error);
        setCloudinaryUrl(null);
      }
    };

    fetchCloudinaryUrl();
  }, []);

  useEffect(() => {
    const fetchSongs = async () => {
      if (!cloudinaryUrl) return; // Wait until Cloudinary URL is available
      
      try {
        // Check for cached songs data
        const cachedData = localStorage.getItem('trending-songs-cache');
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            const isExpired = Date.now() - parsed.timestamp > 2 * 60 * 60 * 1000; // 2 hours
            
            if (!isExpired && parsed.songs && parsed.cloudinaryUrl === cloudinaryUrl) {
              console.log('Loading songs from cache...');
              setSongs(parsed.songs);
              return;
            }
          } catch (parseError) {
            console.warn('Failed to parse cached data:', parseError);
            localStorage.removeItem('trending-songs-cache');
          }
        }

        console.log('Fetching trending songs...');
        const response = await fetch(cloudinaryUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (
          !data?.contents?.sectionListRenderer?.contents?.[0]?.musicAnalyticsSectionRenderer?.content?.trackTypes?.[0]?.trackViews
        ) {
          throw new Error('Invalid data structure');
        }
        const songList =
          data.contents.sectionListRenderer.contents[0].musicAnalyticsSectionRenderer.content.trackTypes[0].trackViews;
        
        console.log('Songs loaded:', songList.length);
        setSongs(songList);

        // Cache the data
        try {
          const cacheData = {
            timestamp: Date.now(),
            cloudinaryUrl,
            songs: songList
          };
          localStorage.setItem('trending-songs-cache', JSON.stringify(cacheData));
          console.log('Songs cached successfully');
        } catch (cacheError) {
          console.warn('Failed to cache songs data:', cacheError);
        }
      } catch (error) {
        console.error('Error loading songs:', error);
        setSongs([]);
      }
    };

    fetchSongs();
  }, [cloudinaryUrl]);

  const playSong = async (song: Song, index: number) => {
    const formattedSongs = songs.map((s) => ({
      id: s.encryptedVideoId,
      videoId: s.encryptedVideoId,
      title: s.name,
      artist: s.artists.map((a) => a.name).join(', '),
      thumbnail: s.thumbnail.thumbnails[0].url,
    }));

    setCurrentTrack(formattedSongs[index]);
    const reorderedQueue = [
      ...formattedSongs.slice(index),
      ...formattedSongs.slice(0, index),
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

  if (songs.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-white mb-6">Trending Songs</h1>
        <p className="text-gray-400">Loading trending songs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-6 bg-gradient-to-b from-zinc-900 to-black rounded-xl max-w-screen-lg w-full">
        

       <div className="mb-10">
          <PopularArtists />
        </div>

        <div className="mb-10">
          <div className="flex justify-between items-center mb-6" aria-label="Trending songs section">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Trending Songs</h2>
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
                  const maxPage = Math.ceil(songs.length / 8) - 1;
                  if (currentPage < maxPage && !isSliding) {
                    setIsSliding(true);
                    setTimeout(() => {
                      setCurrentPage(currentPage + 1);
                      setIsSliding(false);
                    }, 150);
                  }
                }}
                className={`p-2 rounded-full transition-colors ${
                  (currentPage < Math.ceil(songs.length / 8) - 1 && !isSliding)
                    ? 'bg-gray-800 hover:bg-gray-700' 
                    : 'bg-gray-800 opacity-50 cursor-not-allowed'
                }`}
                disabled={currentPage >= Math.ceil(songs.length / 8) - 1 || isSliding}
                aria-label="Next"
              >
                <ChevronRightIcon className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>

          <div className="overflow-hidden">
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300 ease-in-out ${isSliding ? 'transform -translate-x-4 opacity-80' : 'transform translate-x-0 opacity-100'}`}>
              {(() => {
                const songsPerPage = 8;
                const startIndex = currentPage * songsPerPage;
                const endIndex = startIndex + songsPerPage;
                const currentSongs = songs.slice(startIndex, endIndex);
                
                // Split current songs into 2 columns of 4 each
                const leftColumnSongs = currentSongs.slice(0, 4);
                const rightColumnSongs = currentSongs.slice(4, 8);
                
                return [leftColumnSongs, rightColumnSongs].map((columnSongs, columnIndex) => (
                  <div key={columnIndex} className="space-y-2">
                    {columnSongs.map((song, index) => {
                      const globalIndex = startIndex + (columnIndex * 4) + index;
                      return (
                        <div
                          key={`${song.id}-${globalIndex}`}
                          className="song-row flex items-center gap-3 p-3 rounded-lg bg-gray-950 border border-gray-900 hover:bg-gray-800/50 transition-colors cursor-pointer"
                          onClick={() => playSong(song, globalIndex)}

                        >
                          <div className="relative flex-shrink-0">
                            <img
                              src={song.thumbnail.thumbnails[0].url}
                              alt={`Album cover for ${song.name}`}
                              className="w-12 h-12 object-cover rounded"
                            />
                            {currentTrack?.videoId === song.encryptedVideoId ? (
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
                              <div className="absolute inset-0 bg-black bg-opacity-0 flex items-center justify-center rounded transition-opacity hover:bg-opacity-50">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playSong(song, globalIndex);
                                  }}
                                  className="text-white transition-opacity opacity-0 hover:opacity-100"
                                >
                                  <PlayIcon className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-medium text-sm truncate">{song.name}</h3>
                            <p className="text-gray-400 text-xs truncate mt-0.5">
                              {song.artists.map(a => a.name).join(', ')}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0 add-to-playlist-container">
                            <div className="relative opacity-100 transition-all duration-200" key={`playlist-btn-${song.encryptedVideoId}-${globalIndex}`}>
                              <AddToPlaylistButton
                                track={{
                                  videoId: song.encryptedVideoId,
                                  title: song.name,
                                  thumbnail: song.thumbnail.thumbnails[0].url,
                                  artist: song.artists.map(a => a.name).join(', ')
                                }}
                                className="!relative !top-0 !right-0 !w-auto !h-auto p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        <div className="mb-10">
          <RadioCards />
        </div> 

        <div className="mb-10">
          <NewsCards />
        </div>

        <div className="mb-10">
          <PlaylistCards />
        </div>
      </div>
    </div>
  );
}

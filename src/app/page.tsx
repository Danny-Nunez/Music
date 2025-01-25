'use client';

import { useEffect, useState } from 'react';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/outline';
import { usePlayerStore } from '../store/playerStore';
import AddToPlaylistButton from '../components/AddToPlaylistButton';
import PopularArtists from './components/PopularArtists';
import RadioCards from './components/RadioCards';

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
  const [focusedSong, setFocusedSong] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('.song-card')) {
        setFocusedSong(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCloudinaryUrl = async () => {
      try {
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
          <RadioCards />
        </div> 

        

        <div className="flex justify-between items-center mb-6" aria-label="Trending songs section">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Trending Songs</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
          {songs.map((song, index) => (
            <div
              key={song.id}
              className="bg-gray-800 rounded-lg overflow-hidden relative group w-full"
            >
              <div className="relative">
                {song.thumbnail?.thumbnails[0]?.url && (
                  <div className="relative">
                      <img
                      src={song.thumbnail.thumbnails[0].url}
                      alt={`Album cover for ${song.name} by ${song.artists[0].name}`}
                      className="w-full aspect-square object-cover"
                    />
                    {currentTrack?.videoId === song.encryptedVideoId ? (
                      <div className="absolute inset-0 bg-black bg-opacity-50">
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
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white p-2 sm:p-3 rounded-full hover:bg-red-700 transition-colors"
                        >
                          {isPlaying ? (
                            <PauseIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                          ) : (
                            <PlayIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                          )}
                        </button>
                        <AddToPlaylistButton
                          track={{
                            videoId: song.encryptedVideoId,
                            title: song.name,
                            thumbnail: song.thumbnail.thumbnails[0].url,
                            artist: song.artists.map(a => a.name).join(', ')
                          }}
                          className="absolute top-2 right-2"
                        />
                      </div>
                    ) : focusedSong === song.encryptedVideoId ? (
                      <div className="absolute inset-0 bg-black bg-opacity-50">
                        <button
                          onClick={() => playSong(song, index)}
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition-colors"
                        >
                          <PlayIcon className="h-6 w-6" />
                        </button>
                        <AddToPlaylistButton
                          track={{
                            videoId: song.encryptedVideoId,
                            title: song.name,
                            thumbnail: song.thumbnail.thumbnails[0].url,
                            artist: song.artists.map(a => a.name).join(', ')
                          }}
                          className="absolute top-2 right-2"
                        />
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => playSong(song, index)}
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition-colors"
                        >
                          <PlayIcon className="h-6 w-6" />
                        </button>
                        <AddToPlaylistButton
                          track={{
                            videoId: song.encryptedVideoId,
                            title: song.name,
                            thumbnail: song.thumbnail.thumbnails[0].url,
                            artist: song.artists.map(a => a.name).join(', ')
                          }}
                          className="absolute top-2 right-2"
                        />
                      </div>
                    )}
                    <div className="bottom-0 left-0 right-0 bg-zinc-800 p-2 sm:p-3">
                      <h3 className="text-white text-xs sm:text-sm font-medium truncate">{song.name}</h3>
                      <p className="text-gray-400 text-xs truncate mt-0.5">{song.artists[0].name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

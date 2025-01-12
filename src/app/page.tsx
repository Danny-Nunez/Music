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
    const fetchSongs = async () => {
      try {
        console.log('Fetching trending songs...');
        const response = await fetch('/top100-songs.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!data?.contents?.sectionListRenderer?.contents?.[0]?.musicAnalyticsSectionRenderer?.content?.trackTypes?.[0]?.trackViews) {
          throw new Error('Invalid data structure');
        }
        const songList = data.contents.sectionListRenderer.contents[0].musicAnalyticsSectionRenderer.content.trackTypes[0].trackViews;
        console.log('Songs loaded:', songList.length);
        setSongs(songList);
      } catch (error) {
        console.error('Error loading songs:', error);
        setSongs([]);
      }
    };

    fetchSongs();
  }, []);

  const playSong = (song: Song, index: number) => {
    const formattedSongs = songs.map(s => ({
      id: s.encryptedVideoId,
      videoId: s.encryptedVideoId,
      title: s.name,
      artist: s.artists.map(a => a.name).join(', '),
      thumbnail: s.thumbnail.thumbnails[0].url
    }));

    setCurrentTrack(formattedSongs[index]);
    const reorderedQueue = [
      ...formattedSongs.slice(index),
      ...formattedSongs.slice(0, index)
    ];
    setQueue(reorderedQueue);
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
      <div className="p-6 bg-gradient-to-b from-zinc-900 to-black rounded-xl mx-4 max-w-screen-lg">
        

       <div className="mb-10">
          <PopularArtists />
        </div>

        <div className="mb-10">
          <RadioCards />
        </div> 

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Trending Songs</h1>
        </div>

        <div className="flex flex-wrap gap-8">
          {songs.map((song, index) => (
            <div
              key={song.id}
              className="bg-gray-800 rounded-lg overflow-hidden relative group w-[150px]"
            >
              <div className="relative">
                {song.thumbnail?.thumbnails[0]?.url && (
                  <div className="relative">
                    <img
                      src={song.thumbnail.thumbnails[0].url}
                      alt={song.name}
                      className="w-[150px] h-[150px] object-cover"
                    />
                    {currentTrack?.videoId === song.encryptedVideoId ? (
                      <div className="absolute inset-0 bg-black bg-opacity-50">
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition-colors"
                        >
                          {isPlaying ? (
                            <PauseIcon className="h-6 w-6" />
                          ) : (
                            <PlayIcon className="h-6 w-6" />
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
                    <div className="bottom-0 left-0 right-0 bg-zinc-800 p-3">
                      <h3 className="text-white text-sm font-medium truncate">{song.name}</h3>
                      <p className="text-gray-400 text-xs truncate">{song.artists[0].name}</p>
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

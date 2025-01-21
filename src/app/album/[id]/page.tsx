'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PauseIcon, PlayIcon } from '@heroicons/react/24/outline';
import { usePlayerStore } from '../../../store/playerStore';
import ArtistPageAddToPlaylistButton from '../../../components/ArtistPageAddToPlaylistButton';

interface Artist {
  artistId: string;
  name: string;
}

interface Album {
  type: string;
  albumId: string;
  name: string;
  playlistId: string;
  artist: Artist;
  year: number;
  thumbnails: {
    url: string;
    width: number;
    height: number;
  }[];
  songs: Song[];
}

interface Song {
  type: string;
  videoId: string;
  name: string;
  artist: Artist;
  album: {
    albumId: string;
    name: string;
  };
  duration: number;
  thumbnails: {
    url: string;
    width: number;
    height: number;
  }[];
}

export default function AlbumPage() {
  const params = useParams();
  const { currentTrack, isPlaying, setIsPlaying, setCurrentTrack, setQueue } = usePlayerStore();
  const [albumData, setAlbumData] = useState<Album | null>(null);
  const [artistThumbnail, setArtistThumbnail] = useState<string>('/defaultcover.png');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch artist thumbnail
  useEffect(() => {
    const fetchArtistThumbnail = async (artistName: string) => {
      try {
        console.log('Fetching artist thumbnail for:', artistName);
        const response = await fetch(`/api/youtubemusic?q=${encodeURIComponent(artistName)}&type=artist`);
        if (response.ok) {
          const data = await response.json();
          console.log('Artist search response:', data);
          // Get the first artist result's highest quality thumbnail
          if (data.content?.[0]?.thumbnails?.length > 0) {
            const thumbnails = data.content[0].thumbnails;
            const bestThumbnail = thumbnails[thumbnails.length - 1].url;
            console.log('Found artist thumbnail:', bestThumbnail);
            setArtistThumbnail(bestThumbnail);
          }
        }
      } catch (error) {
        console.error('Error fetching artist thumbnail:', error);
      }
    };

    if (albumData?.artist?.name) {
      console.log('Album artist name:', albumData.artist.name);
      fetchArtistThumbnail(albumData.artist.name);
    } else {
      console.log('No artist name found in album data:', albumData?.artist);
    }
  }, [albumData?.artist?.name]);

  useEffect(() => {
    const fetchAlbumData = async () => {
      try {
        const response = await fetch(`/api/getalbum?albumId=${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch album data');
        }
        const data = await response.json();
        setAlbumData(data);
      } catch (err) {
        console.error('Error fetching album data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) {
      fetchAlbumData();
    }
  }, [params?.id]);

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-900 to-black text-white pt-20 rounded-lg">
        <div className="p-8">
          <div className="flex items-center gap-8 mb-8">
            <div className="md:w-48 md:h-48 w-32 h-32 bg-white/10 rounded animate-pulse"></div>
            <div className="flex-1">
              <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-4"></div>
              <div className="h-6 w-32 bg-white/10 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/10 rounded animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 w-48 bg-white/10 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-32 bg-white/10 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!albumData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">No album data found</div>
      </div>
    );
  }

  // Get the best available album thumbnail
  const getAlbumThumbnail = () => {
    if (albumData.thumbnails?.length > 0) {
      // Try to get the highest quality thumbnail
      for (const size of [2, 1, 0]) {
        if (albumData.thumbnails[size]?.url) {
          return albumData.thumbnails[size].url;
        }
      }
    }
    return artistThumbnail;
  };

  const albumThumbnail = getAlbumThumbnail();

  const handlePlayPause = (song: Song, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    // Format all songs for the queue
    const formattedSongs = albumData.songs.map((s) => ({
      id: s.videoId,
      videoId: s.videoId,
      title: s.name,
      artist: s.artist.name,
      thumbnail: s.thumbnails?.[0]?.url || albumThumbnail
    }));

    // Find current song index
    const currentIndex = formattedSongs.findIndex(
      s => s.videoId === song.videoId
    );

    // Set queue first
    const reorderedQueue = [
      ...formattedSongs.slice(currentIndex),
      ...formattedSongs.slice(0, currentIndex)
    ];
    setQueue(reorderedQueue);

    // Set current track and play
    setCurrentTrack(formattedSongs[currentIndex]);
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

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#121212] to-black text-white mx-4 rounded-xl">
      {/* Album Header */}
      <div className="p-8">
        <div className="flex items-start gap-8 mb-8">
          <img
            src={albumThumbnail}
            alt={albumData.name}
            className="md:w-48 md:h-48 w-32 h-32 object-cover rounded-lg shadow-xl"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.src = '/defaultcover.png';
            }}
          />
          <div className="flex-1 mt-4">
            <h1 className="text-4xl font-bold mb-2">{albumData.name}</h1>
            <p className="text-gray-400 md:text-lg text-md mb-1">{albumData.artist.name}</p>
            <p className="text-gray-400">{albumData.year}</p>
          </div>
        </div>

        {/* Songs List */}
        <div className="grid grid-cols-1 gap-2">
          {albumData.songs.map((song) => (
            <div
              key={song.videoId}
              className="flex items-center gap-4 p-4 rounded-lg hover:bg-white/10 transition-colors group"
            >
              <div className="relative w-16 h-16 flex-shrink-0">
                <img
                  src={song.thumbnails?.[0]?.url || albumThumbnail}
                  alt={song.name}
                  className="w-full h-full object-cover rounded"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = albumThumbnail;
                  }}
                />
                {currentTrack?.videoId === song.videoId && isPlaying ? (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const player = document.querySelector('iframe')?.contentWindow;
                        if (player) {
                          try {
                            player.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                            setIsPlaying(false);
                          } catch (error) {
                            console.error('Error pausing video:', error);
                          }
                        }
                      }}
                      className="z-10"
                    >
                      <div className="bg-red-600 p-1.5 rounded-full hover:bg-red-700 transition-colors">
                        <PauseIcon className="h-5 w-5 text-white" />
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handlePlayPause(song, e)}
                      className="z-10"
                    >
                      <div className="bg-red-600 p-1.5 rounded-full hover:bg-red-700 transition-colors">
                        <PlayIcon className="h-5 w-5 text-white" />
                      </div>
                    </button>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">{song.name}</h3>
                <p className="text-gray-400 text-sm truncate">{song.artist.name}</p>
              </div>
              <div className="text-gray-400 text-sm">
                {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
              </div>
              <ArtistPageAddToPlaylistButton
                track={{
                  id: song.videoId,
                  videoId: song.videoId,
                  title: song.name,
                  thumbnail: song.thumbnails?.[0]?.url || albumThumbnail,
                  artist: song.artist.name
                }}
                className="opacity-0 group-hover:opacity-100"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

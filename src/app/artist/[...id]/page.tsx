'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { PauseIcon, PlayIcon } from '@heroicons/react/24/outline';
import ArtistPageAddToPlaylistButton from '../../../components/ArtistPageAddToPlaylistButton';
import { usePlayerStore } from '../../../store/playerStore';
import ArtistAlbums from '../../../components/ArtistAlbums';
import ArtistPlaylists from '../../../components/ArtistPlaylists';

interface YoutubeMusicResponse {
  content: Array<{
    type: string;
    name: string;
    thumbnails: Array<{
      url: string;
      width: number;
      height: number;
    }>;
  }>;
}

interface YoutubeMusicSong {
  type: string;
  videoId: string;
  name: string;
  artist: {
    name: string;
    browseId: string;
  };
  album: {
    name: string;
    browseId: string[];
  };
  duration: number;
  thumbnails: Array<{
    url: string;
    width: number;
    height: number;
  }>;
}

interface YoutubeMusicSongsResponse {
  content: YoutubeMusicSong[];
}

interface ArtistData {
  contents: {
    sectionListRenderer: {
      contents: [{
        musicAnalyticsSectionRenderer: {
          content: {
            perspectiveMetadata: {
              entityId: string;
              name: string;
              heroMetadata: {
                title: string;
                heroBannerImageUrl: string;
              };
            };
            trackTypes: Array<{
              listType: string;
            }>;
          };
        };
      }];
    };
  };
}

export default function ArtistPage() {
  const params = useParams();
  const { currentTrack, isPlaying, setIsPlaying, setCurrentTrack, setQueue } = usePlayerStore();
  const [artistData, setArtistData] = useState<ArtistData | null>(null);
  const [topSongs, setTopSongs] = useState<YoutubeMusicSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [artistImage, setArtistImage] = useState<string | null>(null);

  const fetchArtistSongs = async (artistName: string) => {
    try {
      const response = await fetch(`/api/youtubemusic?q=${encodeURIComponent(artistName)}&type=song`);
      if (!response.ok) throw new Error('Failed to fetch artist songs');
      
      const data = await response.json();
      const songs = (data as YoutubeMusicSongsResponse).content
        .filter(item => item.type === 'song')
        .slice(0, 20);
      setTopSongs(songs);
    } catch (error) {
      console.error('Error fetching artist songs:', error);
    }
  };

  const fetchArtistImage = async (artistName: string) => {
    try {
      const response = await fetch(`/api/youtubemusic?q=${encodeURIComponent(artistName)}&type=artist`);
      if (!response.ok) throw new Error('Failed to fetch artist image');
      
      const data = await response.json();
      const matchingArtist = (data as YoutubeMusicResponse).content?.find((item) => 
        item.type === 'artist' && 
        item.name.toLowerCase() === artistName.toLowerCase()
      );
      
      if (matchingArtist?.thumbnails?.[1]?.url) {
        setArtistImage(matchingArtist.thumbnails[1].url);
      }
    } catch (error) {
      console.error('Error fetching artist image:', error);
    }
  };

  useEffect(() => {
    const fetchArtistData = async () => {
      try {
        const artistIdParam = params?.id;
        if (!artistIdParam) {
          throw new Error('Artist ID is required');
        }

        // Get the full path from the URL segments and ensure it starts with a slash
        const pathSegments = Array.isArray(artistIdParam) ? artistIdParam : [artistIdParam];
        const fullPath = pathSegments.join('/');
        const artistId = `/${fullPath}`;
        
        console.log('Artist page ID:', { 
          artistIdParam,
          pathSegments,
          fullPath,
          artistId
        });

        // Use the full path directly for the artist insights request
        const response = await fetch('/api/artist-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            browseId: artistId
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch artist insights');
        }

        const data = await response.json();
        setArtistData(data);
        
        // Fetch artist image after getting artist data
        const artistName = data.contents.sectionListRenderer.contents[0].musicAnalyticsSectionRenderer.content.perspectiveMetadata.name;
        await Promise.all([
          fetchArtistImage(artistName),
          fetchArtistSongs(artistName)
        ]);
      } catch (err) {
        console.error('Error fetching artist data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) {
      fetchArtistData();
    }
  }, [params?.id]);

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-900 to-black text-white pt-20 rounded-lg max-w-screen-lg">
        <div className="flex items-center justify-center min-h-[300px] bg-[#121212]">
          <div className="animate-pulse w-16 h-16 rounded-full bg-white/10"></div>
        </div>
        <div className="p-8">
          <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={`skeleton-${i}`} className="flex items-center gap-4">
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

  if (!artistData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">No artist data found</div>
      </div>
    );
  }

  const content = artistData.contents.sectionListRenderer.contents[0].musicAnalyticsSectionRenderer.content;
  const metadata = content.perspectiveMetadata;
  const artistName = metadata.name;
  const headerImage = metadata.heroMetadata.heroBannerImageUrl;

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#121212] to-black text-white mx-4 rounded-xl max-w-screen-lg">
      {/* Artist Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 p-8 bg-gradient-to-b from-zinc-800/50 to-black">
        {/* Artist Image */}
        <div className="relative w-52 h-52 md:w-60 md:h-60  flex-shrink-0 rounded-lg overflow-hidden">
          <Image
            src={artistImage ? `/api/proxy-image?url=${encodeURIComponent(artistImage)}` : headerImage}
            alt={artistName}
            fill
            sizes="(max-width: 768px) 256px, (max-width: 1024px) 320px, 384px"
            className="object-cover"
            priority
          />
        </div>
        {/* Artist Info */}
        <div className="flex flex-col justify-center md:justify-end h-full w-full text-center md:text-left">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4">{artistName}</h1>
          <div className="text-gray-300 text-lg md:text-xl">Artist</div>
        </div>
      </div>

      <div className="p-8">
        <h2 className="text-2xl font-bold mb-6">Top Songs</h2>
        <div className="grid grid-cols-1 gap-4">
          {topSongs.map((song) => {
            const thumbnail = song.thumbnails?.[1]?.url ? 
              `/api/proxy-image?url=${encodeURIComponent(song.thumbnails[1].url)}` : 
              '/defaultcover.png';
            const title = song.name || 'Unknown Title';
            const artist = song.artist?.name || 'Unknown Artist';
            const videoId = song.videoId;
            
            return (
              <div
                key={videoId}
                className="flex items-center gap-4 p-4 rounded-lg hover:bg-white/10 transition-colors group"
              >
                <div className="relative w-16 h-16 flex-shrink-0">
                  <Image
                    src={thumbnail}
                    alt={title}
                    fill
                    sizes="64px"
                    className="object-cover rounded"
                  />
                  {currentTrack?.videoId === videoId && isPlaying ? (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center hover:bg-black/50 transition-colors">
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
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors">
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Format all tracks
                            const formattedTracks = topSongs.map((s) => ({
                              id: s.videoId,
                              videoId: s.videoId,
                              title: s.name || 'Unknown Title',
                              artist: s.artist?.name || 'Unknown Artist',
                              thumbnail: s.thumbnails?.[1]?.url ? 
                                `/api/proxy-image?url=${encodeURIComponent(s.thumbnails[1].url)}` : 
                                '/defaultcover.png'
                            }));

                            // Find current track index
                            const currentIndex = formattedTracks.findIndex(
                              t => t.videoId === videoId
                            );

                            // Set queue first
                            const reorderedQueue = [
                              ...formattedTracks.slice(currentIndex),
                              ...formattedTracks.slice(0, currentIndex)
                            ];
                            setQueue(reorderedQueue);
                            
                            // Set current track and play
                            setCurrentTrack(formattedTracks[currentIndex]);
                            const player = document.querySelector('iframe')?.contentWindow;
                            if (player) {
                              try {
                                player.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                                setIsPlaying(true);
                              } catch (error) {
                                console.error('Error playing video:', error);
                              }
                            }
                          }}
                          className="z-10"
                        >
                          <div className="bg-red-600 p-1.5 rounded-full hover:bg-red-700 transition-colors">
                            <PlayIcon className="h-5 w-5 text-white" />
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{title}</h3>
                  <p className="text-gray-400 text-sm truncate">{artist}</p>
                </div>
                <ArtistPageAddToPlaylistButton
                  track={{
                    id: videoId,
                    videoId: videoId,
                    title: title,
                    thumbnail: thumbnail,
                    artist: artist
                  }}
                  className="opacity-0 group-hover:opacity-100"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Artist Albums */}
      <div className="ml-2">
        <ArtistAlbums artistName={artistName} headerImage={headerImage} />
        <ArtistPlaylists artistName={artistName} headerImage={headerImage} />
      </div>
    </div>
  );
}

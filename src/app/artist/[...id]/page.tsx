'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { PauseIcon, PlayIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
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
  const [albumCount, setAlbumCount] = useState<number>(0);
  const [playlistCount, setPlaylistCount] = useState<number>(0);
  const [albumLoading, setAlbumLoading] = useState<boolean>(true);
  const [playlistLoading, setPlaylistLoading] = useState<boolean>(true);
  const [currentSongsPage, setCurrentSongsPage] = useState(0);
  const [isSongsSliding, setIsSongsSliding] = useState(false);

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
          <div className="text-gray-300 text-lg md:text-xl mb-2">Artist</div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4">{artistName}</h1>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start text-gray-300 text-sm md:text-base">
            <div className="flex items-center gap-1">
              <span className="text-white font-semibold">{topSongs.length}</span>
              <span>Songs</span>
            </div>
            <div className="flex items-center gap-1">
              {playlistLoading ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span className="text-white font-semibold">{playlistCount}</span>
              )}
              <span>Playlists</span>
            </div>
            <div className="flex items-center gap-1">
              {albumLoading ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span className="text-white font-semibold">{albumCount}</span>
              )}
              <span>Albums</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Top Songs</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentSongsPage > 0 && !isSongsSliding) {
                  setIsSongsSliding(true);
                  setTimeout(() => {
                    setCurrentSongsPage(currentSongsPage - 1);
                    setIsSongsSliding(false);
                  }, 150);
                }
              }}
              className={`p-2 rounded-full transition-colors ${
                (currentSongsPage > 0 && !isSongsSliding)
                  ? 'bg-gray-800 hover:bg-gray-700' 
                  : 'bg-gray-800 opacity-50 cursor-not-allowed'
              }`}
              disabled={currentSongsPage === 0 || isSongsSliding}
              aria-label="Previous"
            >
              <ChevronLeftIcon className="h-4 w-4 text-white" />
            </button>
            <button
              onClick={() => {
                const maxPage = Math.ceil(topSongs.length / 8) - 1;
                if (currentSongsPage < maxPage && !isSongsSliding) {
                  setIsSongsSliding(true);
                  setTimeout(() => {
                    setCurrentSongsPage(currentSongsPage + 1);
                    setIsSongsSliding(false);
                  }, 150);
                }
              }}
              className={`p-2 rounded-full transition-colors ${
                (currentSongsPage < Math.ceil(topSongs.length / 8) - 1 && !isSongsSliding)
                  ? 'bg-gray-800 hover:bg-gray-700' 
                  : 'bg-gray-800 opacity-50 cursor-not-allowed'
              }`}
              disabled={currentSongsPage >= Math.ceil(topSongs.length / 8) - 1 || isSongsSliding}
              aria-label="Next"
            >
              <ChevronRightIcon className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
        
        <div className="overflow-hidden">
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300 ease-in-out ${isSongsSliding ? 'transform -translate-x-4 opacity-80' : 'transform translate-x-0 opacity-100'}`}>
            {(() => {
              // Split songs into 2 columns of 4 each (8 total) with pagination
              const songsPerPage = 8;
              const startIndex = currentSongsPage * songsPerPage;
              const endIndex = startIndex + songsPerPage;
              const currentPageSongs = topSongs.slice(startIndex, endIndex);
              
              const leftColumnSongs = currentPageSongs.slice(0, 4);
              const rightColumnSongs = currentPageSongs.slice(4, 8);
            
            return [leftColumnSongs, rightColumnSongs].map((columnSongs, columnIndex) => (
              <div key={columnIndex} className="space-y-2">
                {columnSongs.map((song, index) => {
                  const thumbnail = song.thumbnails?.[1]?.url ? 
                    `/api/proxy-image?url=${encodeURIComponent(song.thumbnails[1].url)}` : 
                    '/defaultcover.png';
                  const title = song.name || 'Unknown Title';
                  const artist = song.artist?.name || 'Unknown Artist';
                  const videoId = song.videoId;
                  const globalIndex = (columnIndex * 4) + index;
                  
                  return (
                    <div
                      key={`${videoId}-${globalIndex}`}
                      className="song-row flex items-center gap-3 p-3 rounded-lg bg-gray-950 border border-gray-900 hover:bg-gray-800/50 transition-colors cursor-pointer"
                      onClick={() => {
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
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={thumbnail}
                          alt={`Album cover for ${title}`}
                          className="w-12 h-12 object-cover rounded"
                        />
                        {currentTrack?.videoId === videoId ? (
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
                                // Same logic as clicking the row
                                const formattedTracks = topSongs.map((s) => ({
                                  id: s.videoId,
                                  videoId: s.videoId,
                                  title: s.name || 'Unknown Title',
                                  artist: s.artist?.name || 'Unknown Artist',
                                  thumbnail: s.thumbnails?.[1]?.url ? 
                                    `/api/proxy-image?url=${encodeURIComponent(s.thumbnails[1].url)}` : 
                                    '/defaultcover.png'
                                }));

                                const currentIndex = formattedTracks.findIndex(
                                  t => t.videoId === videoId
                                );

                                const reorderedQueue = [
                                  ...formattedTracks.slice(currentIndex),
                                  ...formattedTracks.slice(0, currentIndex)
                                ];
                                setQueue(reorderedQueue);
                                
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
                              className="text-white transition-opacity opacity-0 hover:opacity-100"
                            >
                              <PlayIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium text-sm truncate">{title}</h3>
                        <p className="text-gray-400 text-xs truncate mt-0.5">{artist}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0 add-to-playlist-container">
                        <div className="relative opacity-100 transition-all duration-200">
                          <ArtistPageAddToPlaylistButton
                            track={{
                              id: videoId,
                              videoId: videoId,
                              title: title,
                              thumbnail: thumbnail,
                              artist: artist
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

      {/* Artist Albums */}
      <div className="ml-2">
        <ArtistAlbums 
          artistName={artistName} 
          headerImage={headerImage} 
          onAlbumCountChange={setAlbumCount}
          onLoadingChange={setAlbumLoading}
        />
        <ArtistPlaylists 
          artistName={artistName} 
          headerImage={headerImage} 
          onPlaylistCountChange={setPlaylistCount}
          onLoadingChange={setPlaylistLoading}
        />
      </div>
    </div>
  );
}

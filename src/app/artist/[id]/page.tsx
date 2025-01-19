'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { PauseIcon, PlayIcon } from '@heroicons/react/24/outline';
import ArtistPageAddToPlaylistButton from '../../../components/ArtistPageAddToPlaylistButton';
import { usePlayerStore } from '../../../store/playerStore';

interface Track {
  musicResponsiveListItemRenderer: {
    thumbnail: {
      musicThumbnailRenderer: {
        thumbnail: {
          thumbnails: { url: string; width: number; height: number }[]
        }
      }
    };
    flexColumns: [
      {
        musicResponsiveListItemFlexColumnRenderer: {
          text: {
            runs: [{ text: string }]
          }
        }
      },
      {
        musicResponsiveListItemFlexColumnRenderer: {
          text: {
            runs: [{ text: string }]
          }
        }
      }
    ];
    playlistItemData: {
      videoId: string;
    };
  }
}

interface ArtistData {
  header: {
    musicImmersiveHeaderRenderer: {
      title: {
        runs: [{ text: string }]
      };
      description?: {
        runs: [{ text: string }]
      };
      thumbnail: {
        musicThumbnailRenderer: {
          thumbnail: {
            thumbnails: { url: string; width: number; height: number }[]
          }
        }
      };
      subscriptionButton: {
        subscribeButtonRenderer: {
          subscriberCountText: {
            runs: [{ text: string }]
          }
        }
      }
    }
  };
  contents: {
    singleColumnBrowseResultsRenderer: {
      tabs: [{
        tabRenderer: {
          content: {
            sectionListRenderer: {
              contents: [{
                musicShelfRenderer: {
                  title: { runs: [{ text: string }] };
                  contents: Track[];
                }
              }]
            }
          }
        }
      }]
    }
  }
}

export default function ArtistPage() {
  const params = useParams();
  const { currentTrack, isPlaying, setIsPlaying, setCurrentTrack, setQueue } = usePlayerStore();
  const [artistData, setArtistData] = useState<ArtistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const newOpacity = Math.max(1 - scrollTop / 300, 0);
      setOpacity(newOpacity);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const fetchArtistData = async () => {
      try {
        const artistIdParam = params?.id;
        if (!artistIdParam) {
          throw new Error('Artist ID is required');
        }

        // Get the encoded path from the URL and decode it
        const encodedPath = Array.isArray(artistIdParam) ? artistIdParam.join('/') : artistIdParam;
        // Decode the path and add leading slash
        const fullId = `/${decodeURIComponent(encodedPath)}`;
        
        console.log('Artist page ID:', { 
          artistIdParam,
          encodedPath,
          decodedId: fullId
        });

        // Use the decoded ID for the artist insights request
        const response = await fetch('/api/artist-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            context: {
              client: {
                hl: 'en',
                gl: 'US'
              }
            },
            browseId: fullId
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch artist insights');
        }

        const data = await response.json();
        setArtistData(data);
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

  if (!artistData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">No artist data found</div>
      </div>
    );
  }

  const header = artistData.header.musicImmersiveHeaderRenderer;
  const artistName = header.title.runs[0].text;
  const subscriberCount = header.subscriptionButton.subscribeButtonRenderer.subscriberCountText.runs[0].text;
  const headerImage = header.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails.slice(-1)[0].url;

  const tracks = artistData.contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].musicShelfRenderer.contents;

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#121212] to-black text-white mx-4 rounded-xl max-w-screen-lg">
      {/* Artist Header */}
      <div className="relative h-[400px] w-full">
        <Image
          style={{
            opacity,
            transition: 'opacity 0.1s ease-in-out',
          }}
          src={headerImage}
          alt={artistName}
          fill
          sizes="100vw"
          className="object-cover object-top"
          priority
        />
        <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-4">
          <h1 className="text-6xl font-black ml-2">{artistName}</h1>
          <p className="text-white text-md mt-4 ml-4 font-medium">
            {subscriberCount}
          </p>
        </div>
      </div>

      {/* Top Tracks */}
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-6">Top Songs</h2>
        <div className="grid grid-cols-1 gap-4">
          {tracks.map((track) => {
            const renderer = track.musicResponsiveListItemRenderer;
            const thumbnail = renderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails.slice(-1)[0].url;
            const title = renderer.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text;
            const artist = renderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text;
            const videoId = renderer.playlistItemData.videoId;
            
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
                          setIsPlaying(false);
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
                            const formattedTracks = tracks.map((t) => {
                              const r = t.musicResponsiveListItemRenderer;
                              return {
                                id: r.playlistItemData.videoId,
                                videoId: r.playlistItemData.videoId,
                                title: r.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text,
                                artist: r.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text,
                                thumbnail: r.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails.slice(-1)[0].url
                              };
                            });

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
                            
                            // Then set current track (this will auto-play)
                            setCurrentTrack(formattedTracks[currentIndex]);
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
    </div>
  );
}

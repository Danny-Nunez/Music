'use client';


import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { PauseIcon, PlayIcon } from '@heroicons/react/24/outline';
import ArtistPageAddToPlaylistButton from '../../../components/ArtistPageAddToPlaylistButton';
import { usePlayerStore } from '../../../store/playerStore';

interface Artist {
  name: string;
}

interface Track {
  id: string;
  name: string;
  viewCount: string;
  thumbnail: {
    thumbnails: { url: string }[];
  };
  encryptedVideoId: string;
  artists: Artist[];
}

interface ArtistData {
  contents: {
    sectionListRenderer: {
      contents: [{
        musicAnalyticsSectionRenderer: {
          content: {
            perspectiveMetadata: {
              name: string;
              heroMetadata: {
                title: string;
                heroBannerImageUrl: string;
              };
            };
            locations: {
              region: string;
              locationViews: { name: string; viewCount: string }[];
            }[];
            trackTypes: [{
              trackViews: Track[];
            }];
          };
        };
      }];
    };
  };
}

// interface ArtistEntry {
//   id: string;
//   name: string;
//   viewCount: string;
//   thumbnail: {
//     thumbnails: { url: string }[];
//   };
// }

const LOCAL_JSON_FILES = [
  '/dominican100-artists.json',
  '/custom-artists.json',
  '/colombia100-artists.json',
];

export default function ArtistPage() {
  const params = useParams();
  const { currentTrack, isPlaying, setIsPlaying, setCurrentTrack, setQueue } = usePlayerStore();
  const [artistData, setArtistData] = useState<ArtistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(1);
  const [top100Url, setTop100Url] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const newOpacity = Math.max(1 - scrollTop / 300, 0); // Adjust fade-out range
      setOpacity(newOpacity);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Fetch the latest Cloudinary URL
  useEffect(() => {
    const fetchCloudinaryUrl = async () => {
      try {
        const response = await fetch('/api/get-latest-cloudinary-url?folder=top100-artists');
        if (!response.ok) {
          throw new Error(`Failed to fetch Cloudinary URL: ${response.statusText}`);
        }
        const data = await response.json();
        setTop100Url(data.url);
      } catch (error) {
        console.error('Error fetching Cloudinary URL:', error);
        setTop100Url(null);
      }
    };

    fetchCloudinaryUrl();
  }, []);

  // Fetch artist data
  useEffect(() => {
    const fetchArtistData = async () => {
      try {
        const artistIdParam = params?.id;
        if (!artistIdParam) {
          throw new Error('Artist ID is required');
        }

        const fetchFromJson = async (jsonFilePath: string) => {
          console.log(`Fetching from: ${jsonFilePath}`);
          const response = await fetch(jsonFilePath);
          if (!response.ok) {
            throw new Error(`Failed to load ${jsonFilePath}`);
          }
          const data = await response.json();
          const artistViews =
            data.contents?.sectionListRenderer?.contents[0]?.musicAnalyticsSectionRenderer?.content?.artists?.[0]
              ?.artistViews;

          // Find the artist entry by ID
          const id = Array.isArray(artistIdParam) ? artistIdParam[0] : artistIdParam;
          return artistViews.find((artist: { id: string }) => artist.id.endsWith(id));
        };

        let artistEntry = top100Url ? await fetchFromJson(top100Url) : null;

        // If not found, fallback to local JSON files
        if (!artistEntry) {
          for (const localFile of LOCAL_JSON_FILES) {
            artistEntry = await fetchFromJson(localFile);
            if (artistEntry) break;
          }
        }

        if (!artistEntry) {
          throw new Error('Artist not found in any JSON files');
        }

        console.log('Found Artist Entry:', artistEntry);

        const response = await fetch('/api/artist-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            context: {
              client: {
                clientName: 'WEB_MUSIC_ANALYTICS',
                clientVersion: '2.0',
                hl: 'en',
                gl: 'US',
                theme: 'MUSIC',
              },
            },
            browseId: 'FEmusic_analytics_insights_artist',
            query: `perspective=ARTIST&artist_params_id=${encodeURIComponent(artistEntry.id)}`,
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

    if (params?.id && top100Url) {
      fetchArtistData();
    }
  }, [params?.id, top100Url]);
  

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

  const { perspectiveMetadata, trackTypes, locations } = artistData.contents.sectionListRenderer.contents[0].musicAnalyticsSectionRenderer.content;
  const topTracks = trackTypes[0]?.trackViews || [];

  const usViewCount = locations
  ?.find((location) => location.region === 'COUNTRY')
  ?.locationViews.find((view) => view.name === 'United States')?.viewCount;

  

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#121212] to-black text-white mx-4 rounded-xl max-w-screen-lg">
      {/* Artist Header */}
      <div className="relative h-[400px] w-full">
  <Image
   style={{
    opacity, // Replace dynamic opacity with a static value
    transition: 'opacity 0.1s ease-in-out',
  }}
    src={perspectiveMetadata.heroMetadata.heroBannerImageUrl}
    alt={perspectiveMetadata.name}
    fill
    sizes="100vw"
    className="object-cover object-top"
    priority
  />
  <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-4">
    <h1 className="text-6xl font-black ml-2">{perspectiveMetadata.name}</h1>
    {usViewCount && (
        <p className="text-white text-md mt-4 ml-4 font-medium">
           {parseInt(usViewCount).toLocaleString()} monthly listeners
        </p>
      )}
  </div>
</div>


      {/* Top Tracks */}
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-6">Top Songs</h2>
        <div className="grid grid-cols-1 gap-4">
          {topTracks.map((track: Track) => (
            <div
              key={track.id}
              className="flex items-center gap-4 p-4 rounded-lg hover:bg-white/10 transition-colors group"
            >
              <div className="relative w-16 h-16 flex-shrink-0">
                <Image
                  src={track.thumbnail?.thumbnails?.[0]?.url || '/defaultcover.png'}
                  alt={track.name || 'No image available'}
                  fill
                  sizes="64px"
                  className="object-cover rounded"
                />
                {currentTrack?.videoId === track.encryptedVideoId && isPlaying ? (
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
                          const player = document.querySelector('iframe')?.contentWindow;
                          if (player) {
                            try {
                              // Format all tracks
                              const formattedTracks = topTracks.map((t: Track) => ({
                                id: t.encryptedVideoId,
                                videoId: t.encryptedVideoId,
                                title: t.name,
                                artist: Array.isArray(t.artists)
                                  ? t.artists.map((a: Artist) => a.name).join(', ')
                                  : 'Unknown Artist',
                                thumbnail: t.thumbnail?.thumbnails?.[0]?.url || '/defaultcover.png'
                              }));

                              // Find current track index
                              const currentIndex = formattedTracks.findIndex(
                                t => t.videoId === track.encryptedVideoId
                              );

                              // Set current track
                              setCurrentTrack(formattedTracks[currentIndex]);

                              // Set queue starting from current track
                              const reorderedQueue = [
                                ...formattedTracks.slice(currentIndex),
                                ...formattedTracks.slice(0, currentIndex)
                              ];
                              setQueue(reorderedQueue);

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
                <h3 className="text-white font-medium truncate">{track.name}</h3>
                <p className="text-gray-400 text-sm truncate">
                {Array.isArray(track.artists)
                  ? track.artists.map((a: Artist) => a.name).join(', ')
                  : 'Unknown Artist'}
              </p>
              </div>
              <ArtistPageAddToPlaylistButton
              track={{
                id: track.encryptedVideoId,
                videoId: track.encryptedVideoId,
                title: track.name,
                thumbnail: track.thumbnail?.thumbnails?.[0]?.url || '/defaultcover.png',
                artist: Array.isArray(track.artists)
                  ? track.artists.map((a: Artist) => a.name).join(', ')
                  : 'Unknown Artist'
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
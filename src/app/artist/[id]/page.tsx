'use client';


import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import PlayButton from '../../../components/PlayButton';
import ArtistPageAddToPlaylistButton from '../../../components/ArtistPageAddToPlaylistButton';

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

interface ArtistEntry {
  id: string;
  name: string;
  viewCount: string;
  thumbnail: {
    thumbnails: { url: string }[];
  };
}

export default function ArtistPage() {
  const params = useParams();
  const [artistData, setArtistData] = useState<ArtistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(1);

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

  useEffect(() => {
    const fetchArtistData = async () => {
      try {
        const artistIdParam = params?.id;
        if (!artistIdParam) {
          throw new Error('Artist ID is required');
        }
  
        // Helper function to fetch artist data from a JSON file
        const fetchFromJson = async (jsonFilePath: string) => {
          const response = await fetch(jsonFilePath);
          if (!response.ok) {
            throw new Error(`Failed to load ${jsonFilePath}`);
          }
          const data = await response.json();
          const artistViews =
            data.contents.sectionListRenderer.contents[0].musicAnalyticsSectionRenderer.content.artists[0].artistViews;
  
          // Find the artist entry by ID
          const id = Array.isArray(artistIdParam) ? artistIdParam[0] : artistIdParam;
          return artistViews.find((artist: ArtistEntry) =>
            artist.id.endsWith(id)
          );
        };
  
        // Try fetching from `top100-artists.json`
        let artistEntry = await fetchFromJson('/top100-artists.json');
  
        // If not found, try fetching from `dominican100-artists.json`
        if (!artistEntry) {
          artistEntry = await fetchFromJson('/dominican100-artists.json');
        }
  
        if (!artistEntry) {
          throw new Error('Artist not found in both JSON files');
        }
  
        console.log('Found Artist Entry:', artistEntry);
  
        // Construct the payload with the correct ID
        const validatedArtistId = artistEntry.id; // Use the ID directly from the JSON
        const payload = {
          context: {
            client: {
              clientName: 'WEB_MUSIC_ANALYTICS',
              clientVersion: '2.0',
              hl: 'en',
              gl: 'US',
              experimentIds: [],
              experimentsToken: '',
              theme: 'MUSIC',
            },
            capabilities: {},
            request: {
              internalExperimentFlags: [],
            },
          },
          browseId: 'FEmusic_analytics_insights_artist',
          query: `perspective=ARTIST&entity_params_entity=ARTIST&artist_params_id=${encodeURIComponent(validatedArtistId)}`,
        };
  
        console.log('Payload:', JSON.stringify(payload, null, 2));
  
        // Make the API call
        const response = await fetch('/api/artist-insights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
  
        if (!response.ok) {
          throw new Error('Failed to fetch artist data');
        }
  
        const data = await response.json();
        console.log('API Response:', data);
  
        // Check for track data
        const trackTypes =
          data.contents?.sectionListRenderer?.contents[0]?.musicAnalyticsSectionRenderer?.content?.trackTypes || [];
  
        if (!trackTypes.length) {
          throw new Error('No track data found in API response');
        }
  
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
    opacity, // Dynamic opacity based on scroll
    transition: 'opacity 0.1s ease-in-out', // Smooth transition
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
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors">
                  <PlayButton
                    track={track}
                    allTracks={topTracks}
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  />
                </div>
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
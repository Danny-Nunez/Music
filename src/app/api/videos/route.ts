import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

// Define the structure for the transformed output
interface Video {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
}

// Define the structure for the source JSON (partially)
interface Artist {
  name: string;
}

interface TrackView {
  encryptedVideoId: string;
  name: string;
  artists: Artist[];
  thumbnail: {
    thumbnails: { url: string; width: number; height: number }[];
  };
}

interface SourceData {
  contents: {
    sectionListRenderer: {
      contents: {
        musicAnalyticsSectionRenderer: {
          content: {
            trackTypes: {
              trackViews: TrackView[];
            }[];
          };
        };
      }[];
    };
  };
}

export async function GET() {
  try {
    // Read and parse the JSON file
    const jsonPath = path.join(process.cwd(), 'public', 'top100-songs.json');
    const fileContent = await fs.readFile(jsonPath, 'utf-8');
    const sourceData: SourceData = JSON.parse(fileContent);

    // Extract track views from the JSON structure
    const trackViews = sourceData.contents?.sectionListRenderer?.contents[0]?.musicAnalyticsSectionRenderer?.content?.trackTypes[0]?.trackViews;

    if (!trackViews || trackViews.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'No track data found in JSON.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Transform the data into the desired format
    const videos: Video[] = trackViews.map((track) => ({
      id: track.encryptedVideoId,
      title: track.name,
      artist: track.artists.map((artist) => artist.name).join(', '), // Combine multiple artist names
      thumbnail: track.thumbnail.thumbnails[0]?.url || '', // Use the first thumbnail URL
    }));

    return new NextResponse(
      JSON.stringify(videos),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing JSON data:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Failed to process JSON data',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

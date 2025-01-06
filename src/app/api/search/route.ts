import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Artist {
  id: string;
  name: string;
  viewCount: string;
  thumbnail: {
    thumbnails: Array<{ url: string }>;
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Helper to search JSON data
    const searchInFile = (filePath: string) => {
      console.log(`Searching in file: ${filePath}`); // Debugging log
      try {
        const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const artists =
          fileData.contents.sectionListRenderer.contents[0].musicAnalyticsSectionRenderer.content.artists[0].artistViews;

        const filteredArtists = artists.filter((artist: Artist) =>
          artist.name.toLowerCase().includes(query.toLowerCase())
        );

        console.log(`Results from ${filePath}:`, filteredArtists); // Debugging log
        return filteredArtists;
      } catch (error) {
        console.error(`Error reading or searching file ${filePath}:`, error);
        return [];
      }
    };

    // Paths to the JSON files
    const top100Path = path.join(process.cwd(), 'public', 'top100-artists.json');
    const dominican100Path = path.join(process.cwd(), 'public', 'dominican100-artists.json');
    const customArtistPath = path.join(process.cwd(), 'public', 'custom-artists.json');

    // Search in `top100-artists.json`
    let matchingArtists = searchInFile(top100Path);

    // If no results found, search in `dominican100-artists.json`
    if (matchingArtists.length === 0) {
      console.log('No results in top100-artists.json. Searching in dominican100-artists.json...');
      matchingArtists = searchInFile(dominican100Path);
    }

    // If still no results, search in `custom-artist.json`
    if (matchingArtists.length === 0) {
      console.log('No results in dominican100-artists.json. Searching in custom-artist.json...');
      matchingArtists = searchInFile(customArtistPath);
    }

    // Final response
    return NextResponse.json({
      results: matchingArtists.map((artist: Artist) => ({
        id: artist.id,
        name: artist.name,
        viewCount: artist.viewCount,
        thumbnail: artist.thumbnail,
      })),
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search artists' },
      { status: 500 }
    );
  }
}

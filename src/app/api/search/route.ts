import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

interface Artist {
  id: string;
  name: string;
  viewCount: string;
  thumbnail: {
    thumbnails: Array<{ url: string }>;
  };
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to fetch the latest URL for `top100-artists.json` from Cloudinary
const getLatestCloudinaryUrl = async (folder: string): Promise<string | null> => {
  try {
    const resources = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      resource_type: 'raw',
      max_results: 1,
    });

    if (!resources.resources || resources.resources.length === 0) {
      console.error('No resources found in Cloudinary for folder:', folder);
      return null;
    }

    return resources.resources[0].secure_url;
  } catch (error) {
    console.error('Error fetching latest Cloudinary URL:', error);
    return null;
  }
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Helper to fetch and search JSON data from a URL
    const searchInCloudinary = async (url: string) => {
      try {
        console.log(`Fetching data from: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`Failed to fetch ${url}. Status: ${response.status}`);
          return [];
        }

        const fileData = await response.json();
        const artists =
          fileData.contents.sectionListRenderer.contents[0].musicAnalyticsSectionRenderer.content.artists[0].artistViews;

        const filteredArtists = artists.filter((artist: Artist) =>
          artist.name.toLowerCase().includes(query.toLowerCase())
        );

        console.log(`Results from ${url}:`, filteredArtists);
        return filteredArtists;
      } catch (error) {
        console.error(`Error fetching or searching data from ${url}:`, error);
        return [];
      }
    };

    const searchInFile = (filePath: string) => {
      try {
        console.log(`Searching in file: ${filePath}`);
        const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const artists =
          fileData.contents.sectionListRenderer.contents[0].musicAnalyticsSectionRenderer.content.artists[0].artistViews;

        const filteredArtists = artists.filter((artist: Artist) =>
          artist.name.toLowerCase().includes(query.toLowerCase())
        );

        console.log(`Results from ${filePath}:`, filteredArtists);
        return filteredArtists;
      } catch (error) {
        console.error(`Error reading or searching file ${filePath}:`, error);
        return [];
      }
    };

    // Fetch the latest URL for `top100-artists.json` from Cloudinary
    const latestCloudinaryUrl = await getLatestCloudinaryUrl('top100-artists');

    // Search in `top100-artists.json` from Cloudinary
    let matchingArtists = latestCloudinaryUrl
      ? await searchInCloudinary(latestCloudinaryUrl)
      : [];

    // Paths to other JSON files in the public folder
    const dominican100Path = path.join(process.cwd(), 'public', 'dominican100-artists.json');
    const customArtistPath = path.join(process.cwd(), 'public', 'custom-artists.json');
    const colombia100Path = path.join(process.cwd(), 'public', 'colombia100-artists.json');

    // If no results found, search in other local JSON files
    if (matchingArtists.length === 0) {
      console.log('No results in top100-artists.json. Searching in dominican100-artists.json...');
      matchingArtists = searchInFile(dominican100Path);
    }

    if (matchingArtists.length === 0) {
      console.log('No results in dominican100-artists.json. Searching in custom-artists.json...');
      matchingArtists = searchInFile(customArtistPath);
    }

    if (matchingArtists.length === 0) {
      console.log('No results in custom-artists.json. Searching in colombia100-artists.json...');
      matchingArtists = searchInFile(colombia100Path);
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

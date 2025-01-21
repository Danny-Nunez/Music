import { NextResponse } from 'next/server';
import YoutubeMusicApi from 'youtube-music-api'; // Use ES module import

export async function GET(req: Request): Promise<NextResponse> {
  const api = new YoutubeMusicApi();

  try {
    console.log('Initializing YouTube Music API...');
    await api.initalize();

    // Parse query parameters
    const url = new URL(req.url);
    const query = url.searchParams.get('q') || 'Dionni 6x'; // Default search query
    const type = url.searchParams.get('type') || 'song'; // Default search type

    console.log(`Fetching ${type} for query: ${query}...`);
    const result = await api.search(query, type);

    if (!result || !result.content) {
      return NextResponse.json(
        { error: 'No results found for the given query' },
        { status: 404 }
      );
    }

    // Log the results for debugging
    console.log('Search Results:', result);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error in proxy API:', error);

    return NextResponse.json(
      { error: 'Failed to fetch data from YouTube Music API', details: error },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import YTMusic from 'ytmusic-api'; // Import the new package

export async function GET(req: Request) {
  const ytmusic = new YTMusic();

  try {
    console.log('Initializing YTMusic API...');
    await ytmusic.initialize(); // Initialize the API (add cookies if needed)

    // Get query parameters
    const url = new URL(req.url);
    const albumId = url.searchParams.get('albumId'); // Fetch the albumId from query parameters

    if (!albumId) {
      return NextResponse.json(
        { error: 'Missing albumId query parameter' },
        { status: 400 }
      );
    }

    console.log(`Fetching album details for albumId: ${albumId}`);
    const result = await ytmusic.getAlbum(albumId); // Use the new API to fetch album details

    console.log('Fetched Album Details:', result);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error in proxy API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch album data from YTMusic API' },
      { status: 500 }
    );
  }
}

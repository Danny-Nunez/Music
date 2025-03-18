import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Fetching mobile feed data...');

    // Add timestamp to prevent caching
    const timestamp = Date.now();
    const cloudinaryUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/response-home-feed.json?t=${timestamp}`;
    console.log('📎 Fetching from:', cloudinaryUrl);

    // Fetch the JSON data with no-cache headers
    const response = await fetch(cloudinaryUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch JSON data: ${response.statusText}`);
    }

    const data = await response.json();

    const jsonResponse = NextResponse.json({
      success: true,
      data,
      url: cloudinaryUrl,
      timestamp: new Date().toISOString()
    });

    // Add cache control headers to prevent caching
    jsonResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    jsonResponse.headers.set('Pragma', 'no-cache');
    jsonResponse.headers.set('Expires', '0');
    jsonResponse.headers.set('Surrogate-Control', 'no-store');

    return jsonResponse;

  } catch (error) {
    console.error('❌ Error fetching mobile feed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorResponse = NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch mobile feed data',
        details: errorMessage
      },
      { status: 500 }
    );

    // Add cache control headers to error response
    errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    errorResponse.headers.set('Pragma', 'no-cache');
    errorResponse.headers.set('Expires', '0');
    errorResponse.headers.set('Surrogate-Control', 'no-store');

    return errorResponse;
  }
}

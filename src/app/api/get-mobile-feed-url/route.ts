import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Fetching mobile feed data...');

    // Get the fixed response-mobile file URL
    const cloudinaryUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/response-mobile.json`;
    console.log('📎 Fetching from:', cloudinaryUrl);

    // Fetch the JSON data from the URL
    const response = await fetch(cloudinaryUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch JSON data: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data,
      url: cloudinaryUrl,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching mobile feed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch mobile feed data',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

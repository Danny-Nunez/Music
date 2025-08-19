import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return new NextResponse('Image URL is required', { status: 400 });
    }

    // Check if the URL is already a proxy URL and extract the original URL
    const actualUrl = imageUrl.startsWith('/api/proxy-image?url=') 
      ? decodeURIComponent(imageUrl.replace('/api/proxy-image?url=', ''))
      : imageUrl;

    try {
      const response = await fetch(actualUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://music.youtube.com/'
        }
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        const buffer = await response.arrayBuffer();

        return new NextResponse(buffer, {
          headers: {
            'Content-Type': contentType || 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    } catch (fetchError) {
      console.warn(`Failed to fetch external image ${actualUrl}:`, fetchError);
    }

    // If external image fails, serve the default cover image
    try {
      const defaultImagePath = join(process.cwd(), 'public', 'defaultcover.png');
      const defaultImageBuffer = await readFile(defaultImagePath);
      
      return new NextResponse(defaultImageBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600', // Cache default image for 1 hour
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (defaultError) {
      console.error('Error serving default image:', defaultError);
      // If default image also fails, return a minimal 1x1 pixel PNG
      const fallbackPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
      return new NextResponse(fallbackPng, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  } catch (error) {
    console.error('Error in proxy-image route:', error);
    // Return a minimal 1x1 pixel PNG as ultimate fallback
    const fallbackPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    return new NextResponse(fallbackPng, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

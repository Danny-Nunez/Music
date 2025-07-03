import { NextResponse } from 'next/server';

// Allowed domains for image proxying - add your trusted image sources
const ALLOWED_DOMAINS = [
  'i.ytimg.com',
  'yt3.ggpht.com',
  'lh3.googleusercontent.com',
  'images.unsplash.com',
  'cdn.pixabay.com',
  // Add other trusted image domains as needed
];

// Blocked IP ranges (private networks, localhost, etc.)
const BLOCKED_IP_PATTERNS = [
  /^127\./, // localhost
  /^10\./, // private network
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // private network 172.16.0.0/12
  /^192\.168\./, // private network
  /^169\.254\./, // link-local
  /^::1$/, // IPv6 localhost
  /^fe80:/, // IPv6 link-local
  /^fc00:/, // IPv6 unique local
];

function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow HTTPS for security
    if (parsedUrl.protocol !== 'https:') {
      return false;
    }
    
    // Check if domain is in allowed list
    const hostname = parsedUrl.hostname.toLowerCase();
    const isAllowedDomain = ALLOWED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
    
    if (!isAllowedDomain) {
      return false;
    }
    
    // Check for blocked IP patterns
    const isBlockedIP = BLOCKED_IP_PATTERNS.some(pattern => 
      pattern.test(hostname)
    );
    
    if (isBlockedIP) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

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

    // Validate the URL to prevent SSRF attacks
    if (!isValidImageUrl(actualUrl)) {
      return new NextResponse('Invalid or unauthorized image URL', { status: 403 });
    }

    const response = await fetch(actualUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://music.youtube.com/'
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    
    // Validate content type to ensure it's actually an image
    if (!contentType || !contentType.startsWith('image/')) {
      return new NextResponse('Response is not an image', { status: 400 });
    }
    
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error proxying image:', error);
    return new NextResponse('Error fetching image', { status: 500 });
  }
}

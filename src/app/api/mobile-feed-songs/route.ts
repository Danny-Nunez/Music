import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import type { UploadApiResponse } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface YouTubeMusicSection {
  musicCarouselShelfRenderer?: {
    header?: {
      musicCarouselShelfBasicHeaderRenderer?: {
        title?: {
          runs?: Array<{
            text: string;
          }>;
        };
      };
    };
    contents?: YouTubeMusicItem[];
  };
}

interface YouTubeMusicItem {
  musicResponsiveListItemRenderer?: {
    playlistItemData?: {
      videoId: string;
    };
    flexColumns?: Array<{
      musicResponsiveListItemFlexColumnRenderer?: {
        text?: {
          runs?: Array<{
            text: string;
          }>;
        };
      };
    }>;
    thumbnail?: {
      musicThumbnailRenderer?: {
        thumbnail?: {
          thumbnails?: Array<{
            url: string;
          }>;
        };
      };
    };
  };
}

interface SongItem {
  videoId: string;
  title: string;
  thumbnail: string;
  sectionTitle: string;
  artist: string;
  plays: string;
}

interface SectionGroup {
  title: string;
  songs: SongItem[];
}

const YOUTUBE_MUSIC_URL =
  'https://music.youtube.com/youtubei/v1/browse?ctoken=4qmFsgKhAhIMRkVtdXNpY19ob21l...&type=next&itct=CBAQybcCIhMI39jm2ev3iwMVi4DkBh2KPx_J&prettyPrint=false';

const requestBody = {
  context: {
    client: {
      hl: 'en',
      gl: 'US',
      remoteHost: '96.244.37.40',
      deviceMake: 'Apple',
      deviceModel: '',
      visitorData: 'CgtxazJ6azlZeDZ4OCjH_bC-BjIKCgJVUxIEGgAgOA%3D%3D',
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36,gzip(gfe)',
      clientName: 'WEB_REMIX',
      clientVersion: '1.20250305.01.00',
      osName: 'Macintosh',
      osVersion: '10_15_7',
      originalUrl: 'https://music.youtube.com/',
      screenPixelDensity: 2,
      platform: 'DESKTOP',
    },
    user: { lockedSafetyMode: false },
    request: { useSsl: true, internalExperimentFlags: [], consistencyTokenJars: [] },
  },
};

export async function GET(): Promise<Response> {
  try {
    const response = await fetch(YOUTUBE_MUSIC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `YouTube API Error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract songs grouped by sections
    const sections: SectionGroup[] = [];

    // Helper function to process a section's contents
    const processSectionContents = (contents: YouTubeMusicItem[], sectionTitle: string) => {
      const songs: SongItem[] = [];
      contents?.forEach(item => {
        const renderer = item.musicResponsiveListItemRenderer;
        if (!renderer) return;

        // Get video ID from playlistItemData
        const videoId = renderer.playlistItemData?.videoId;
        if (!videoId) return;

        // Get title from first flex column
        const title = renderer.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text;
        if (!title) return;

        // Get artist and plays from second flex column
        const secondColumn = renderer.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
        
        // Extract all artist names and combine them
        const artistNames: string[] = [];
        let playsText = '0 plays';
        
        secondColumn.forEach(run => {
          if (run.text === ' & ' || run.text === ' • ') {
            return;
          }
          // If it ends with 'plays', it's the play count
          if (run.text.endsWith('plays')) {
            playsText = run.text;
          } else {
            artistNames.push(run.text);
          }
        });

        const artist = artistNames.join(' & ');

        // Get highest quality thumbnail
        const thumbnails = renderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
        const thumbnail = thumbnails[thumbnails.length - 1]?.url || '';

        songs.push({
          videoId,
          title,
          thumbnail,
          sectionTitle,
          artist,
          plays: playsText
        });
      });

      if (songs.length > 0) {
        sections.push({
          title: sectionTitle,
          songs
        });
      }
    };

    // Process continuation contents
    const continuationContents = data.continuationContents?.sectionListContinuation?.contents || [];
    continuationContents.forEach((section: YouTubeMusicSection) => {
      const renderer = section.musicCarouselShelfRenderer;
      if (renderer?.contents) {
        const sectionTitle = renderer.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.text || 'Unknown Section';
        processSectionContents(renderer.contents, sectionTitle);
      }
    });

    // Process tab contents
    const tabContents = data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
    tabContents.forEach((section: YouTubeMusicSection) => {
      const renderer = section.musicCarouselShelfRenderer;
      if (renderer?.contents) {
        const sectionTitle = renderer.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.text || 'Unknown Section';
        processSectionContents(renderer.contents, sectionTitle);
      }
    });

    console.log('📦 Processing YouTube Music data...');

    // Create a Readable stream from the sections data
    const dataStream = new Readable({
      read() {} // Required implementation
    });
    
    const jsonData = JSON.stringify({ sections }, null, 2);
    console.log(`📊 Data size: ${jsonData.length} bytes`);
    
    dataStream.push(jsonData);
    dataStream.push(null); // End the stream

    try {
      console.log('🚀 Uploading to Cloudinary...');
      // Upload JSON to Cloudinary
      const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            public_id: 'response-mobile-songs', // Different filename from mobile-feed
            resource_type: 'raw',       // Set as 'raw' for JSON files
            tags: ['mobile-feed', 'youtube-music', 'songs'], // Add tags for better organization
            overwrite: true,           // Ensure it overwrites the existing file
            format: 'json',            // Add format explicitly
            invalidate: true           // Invalidate CDN cache
          },
          (error, result) => {
            if (error || !result) {
              console.error('❌ Cloudinary Upload Error:', error || 'No result returned');
              reject(error || new Error('No upload result returned'));
            } else {
              console.log('✅ Successfully uploaded to Cloudinary');
              resolve(result);
            }
          }
        );

        // Pipe the data stream into the upload function
        dataStream.pipe(uploadStream);
      });

      console.log('📎 Cloudinary URL:', uploadResult.secure_url);

      const jsonResponse = NextResponse.json({
        success: true,
        sections,
        cloudinaryUrl: uploadResult.secure_url,
        timestamp: new Date().toISOString()
      });

      jsonResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      jsonResponse.headers.set('Pragma', 'no-cache');
      jsonResponse.headers.set('Expires', '0');
      jsonResponse.headers.set('Surrogate-Control', 'no-store');

      return jsonResponse;

    } catch (uploadError) {
      console.error('❌ Error uploading to Cloudinary:', uploadError);
      // If Cloudinary upload fails, still return the sections
      const errorResponse = NextResponse.json({
        success: true,
        sections,
        error: 'Failed to upload to Cloudinary, but data is still available',
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        }
      });
      return errorResponse;
    }

  } catch (error) {
    console.error('❌ Error fetching YouTube Music data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    const errorResponse = NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch YouTube Music data',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        }
      }
    );

    return errorResponse;
  }
}

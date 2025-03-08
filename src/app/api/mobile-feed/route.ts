import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import type { UploadApiResponse } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface SubtitleRun {
  text: string;
}

interface MusicThumbnail {
  url: string;
}

interface YouTubeMusicItem {
  title: string;
  id: string;
  playlistId: string;
  artists: string;
  thumbnail: string;
  type: string;
}

interface YouTubeMusicSection {
  title: string;
  strapline: string;
  thumbnail: string;
  moreLink: string;
  contents: YouTubeMusicItem[];
}

interface YouTubeTab {
  tabRenderer?: {
    content?: {
      sectionListRenderer?: {
        contents: YouTubeSection[];
      };
    };
  };
}

interface YouTubeSection {
  musicCarouselShelfRenderer: {
    header?: {
      musicCarouselShelfBasicHeaderRenderer?: {
        title?: {
          runs?: Array<{ text: string }>;
        };
        strapline?: {
          runs?: Array<{ text: string }>;
        };
        thumbnail?: {
          musicThumbnailRenderer?: {
            thumbnail?: {
              thumbnails?: MusicThumbnail[];
            };
          };
        };
        moreContentButton?: {
          buttonRenderer?: {
            navigationEndpoint?: {
              browseEndpoint?: {
                browseId?: string;
              };
            };
          };
        };
      };
    };
    contents?: Array<{
      musicTwoRowItemRenderer?: {
        title?: {
          runs?: Array<{ text: string }>;
        };
        navigationEndpoint?: {
          browseEndpoint?: {
            browseId?: string;
          };
        };
        menu?: {
          menuRenderer?: {
            items?: Array<{
              menuNavigationItemRenderer?: {
                navigationEndpoint?: {
                  watchPlaylistEndpoint?: {
                    playlistId?: string;
                  };
                };
              };
            }>;
          };
        };
        subtitle?: {
          runs?: SubtitleRun[];
        };
        thumbnailRenderer?: {
          musicThumbnailRenderer?: {
            thumbnail?: {
              thumbnails?: MusicThumbnail[];
            };
          };
        };
      };
    }>;
  };
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
      visitorData: 'CgtxazJ6azlZeDZ4OCirqqu-BjIKCgJVUxIEGgAgOA==',
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
      return new Response(
        JSON.stringify({ error: `YouTube API Error: ${response.status}` }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    // Combine all potential sections
    const sections = [
      ...(data.continuationContents?.sectionListContinuation?.contents || []) as YouTubeSection[],
      ...(data.contents?.singleColumnBrowseResultsRenderer?.tabs?.flatMap(
        (tab: YouTubeTab) => tab?.tabRenderer?.content?.sectionListRenderer?.contents || []
      ) || []) as YouTubeSection[],
    ];

    // Extract all music carousel sections
    const musicItems = sections
      .filter((section): section is YouTubeSection => Boolean(section.musicCarouselShelfRenderer))
      .map((section): YouTubeMusicSection => {
        const shelf = section.musicCarouselShelfRenderer;
        const header = shelf.header?.musicCarouselShelfBasicHeaderRenderer;
        
        if (!header || !shelf.contents) {
          return {
            title: 'Unknown Title',
            strapline: '',
            thumbnail: '',
            moreLink: '',
            contents: []
          };
        }

        const title = header.title?.runs?.[0]?.text || 'Unknown Title';
        const strapline = header.strapline?.runs?.[0]?.text || '';
        const thumbnail = header.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.[0]?.url || '';
        const moreLink = header.moreContentButton?.buttonRenderer?.navigationEndpoint?.browseEndpoint?.browseId || '';

        const contents = shelf.contents
          .map((item): YouTubeMusicItem | null => {
            const renderer = item.musicTwoRowItemRenderer;
            if (!renderer) return null;

            const playlistId = renderer.menu?.menuRenderer?.items?.[0]?.menuNavigationItemRenderer?.navigationEndpoint?.watchPlaylistEndpoint?.playlistId;
            if (!playlistId) return null;

            const itemThumbnails = renderer.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
            const subtitleRuns = renderer.subtitle?.runs || [];
            
            return {
              title: renderer.title?.runs?.[0]?.text || 'Unknown',
              id: renderer.navigationEndpoint?.browseEndpoint?.browseId || '',
              playlistId: renderer.menu?.menuRenderer?.items?.[0]?.menuNavigationItemRenderer?.navigationEndpoint?.watchPlaylistEndpoint?.playlistId || '',
              artists: subtitleRuns
                .filter((run: SubtitleRun) => run.text !== ' • ' && run.text !== 'Album' && run.text !== 'Single')
                .map((run: SubtitleRun) => run.text)
                .join(', '),
              thumbnail: itemThumbnails[itemThumbnails.length - 1]?.url || '',
              type: subtitleRuns.find((run: SubtitleRun) => run.text === 'Album' || run.text === 'Single')?.text || ''
            };
          })
          .filter((item): item is YouTubeMusicItem => item !== null && item.playlistId !== '');

        return {
          title,
          strapline,
          thumbnail,
          moreLink,
          contents
        };
      })
      .filter((section) => section.contents.length > 0);

    console.log('📦 Processing YouTube Music data...');

    // Create a Readable stream from the musicItems data
    const dataStream = new Readable({
      read() {} // Required implementation
    });
    
    const jsonData = JSON.stringify({ musicItems }, null, 2);
    console.log(`📊 Data size: ${jsonData.length} bytes`);
    
    dataStream.push(jsonData);
    dataStream.push(null); // End the stream

    try {
      console.log('🚀 Uploading to Cloudinary...');
      // Upload JSON to Cloudinary
      const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            public_id: 'response-mobile', // Fixed filename without extension
            resource_type: 'raw',       // Set as 'raw' for JSON files
            tags: ['mobile-feed', 'youtube-music'], // Add tags for better organization
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

      const response = new Response(
        JSON.stringify({ 
          success: true,
          musicItems,
          cloudinaryUrl: uploadResult.secure_url,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
          } 
        }
      );
      return response;
    } catch (uploadError) {
      console.error('❌ Error uploading to Cloudinary:', uploadError);
      // If Cloudinary upload fails, still return the music items
      const errorResponse = new Response(
        JSON.stringify({ 
          success: true,
          musicItems,
          error: 'Failed to upload to Cloudinary, but data is still available',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
          } 
        }
      );
      return errorResponse;
    }
  } catch (error) {
    console.error('❌ Error fetching YouTube Music data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const failureResponse = new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to fetch YouTube Music data',
        details: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        } 
      }
    );
    return failureResponse;
  }
}

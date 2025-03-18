import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import type { UploadApiResponse } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface MusicThumbnail {
  url: string;
  width: number;
  height: number;
}

interface YouTubeMusicItem {
  title: string;
  videoId: string;
  playlistId: string;
  artists: string;
  thumbnail: string;
}

interface YouTubeMusicSection {
  title: string;
  contents: YouTubeMusicItem[];
}

interface TextRun {
  text: string;
  navigationEndpoint?: {
    browseEndpoint?: {
      browseId: string;
    };
    watchEndpoint?: {
      videoId?: string;
      playlistId?: string;
    };
  };
}

interface FlexColumnText {
  runs: TextRun[];
}

interface FlexColumnRenderer {
  text?: FlexColumnText;
  displayPriority?: string;
}

interface YouTubeRenderer {
  flexColumns?: Array<{
    musicResponsiveListItemFlexColumnRenderer?: FlexColumnRenderer;
  }>;
  title?: {
    runs?: TextRun[];
  };
  subtitle?: {
    runs?: TextRun[];
  };
  thumbnail?: {
    musicThumbnailRenderer?: {
      thumbnail?: {
        thumbnails?: MusicThumbnail[];
      };
    };
  };
  thumbnailRenderer?: {
    musicThumbnailRenderer?: {
      thumbnail?: {
        thumbnails?: MusicThumbnail[];
      };
    };
  };
  overlay?: {
    musicItemThumbnailOverlayRenderer?: {
      content?: {
        musicPlayButtonRenderer?: {
          playNavigationEndpoint?: {
            watchEndpoint?: {
              videoId?: string;
              playlistId?: string;
            };
          };
        };
      };
    };
  };
  menu?: {
    menuRenderer?: {
      items?: Array<{
        menuNavigationItemRenderer?: {
          navigationEndpoint?: {
            watchPlaylistEndpoint?: {
              playlistId?: string;
              videoId?: string;
            };
            watchEndpoint?: {
              playlistId?: string;
              videoId?: string;
            };
          };
        };
      }>;
    };
  };
  navigationEndpoint?: {
    browseEndpoint?: {
      browseId: string;
    };
    watchEndpoint?: {
      videoId?: string;
      playlistId?: string;
    };
  };
  playlistId?: string;
  videoId?: string;
}

interface YouTubeShelfRenderer {
  header?: {
    musicCarouselShelfBasicHeaderRenderer?: {
      title?: {
        runs?: TextRun[];
      };
    };
    musicImmersiveCarouselShelfBasicHeaderRenderer?: {
      title?: {
        runs?: TextRun[];
      };
    };
  };
  contents?: Array<{
    musicTwoRowItemRenderer?: YouTubeRenderer;
    musicResponsiveListItemRenderer?: YouTubeRenderer;
  }>;
}

interface YouTubeSection {
  musicCarouselShelfRenderer?: YouTubeShelfRenderer;
  musicImmersiveCarouselShelfRenderer?: YouTubeShelfRenderer;
  gridRenderer?: YouTubeShelfRenderer;
  sectionListRenderer?: {
    contents?: YouTubeSection[];
  };
}

interface YouTubeResponse {
  contents?: {
    singleColumnBrowseResultsRenderer?: {
      tabs?: Array<{
        tabRenderer?: {
          content?: {
            sectionListRenderer?: {
              contents?: YouTubeSection[];
            };
          };
        };
      }>;
    };
  };
  continuationContents?: {
    sectionListContinuation?: {
      contents: YouTubeSection[];
    };
  };
}

function processRenderer(renderer: YouTubeRenderer): YouTubeMusicItem | null {
  try {
    console.log('📝 Processing renderer:', JSON.stringify(renderer, null, 2));

    // Get videoId from various possible locations
    const videoId = renderer.videoId ||
                   renderer.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId ||
                   renderer.navigationEndpoint?.watchEndpoint?.videoId ||
                   renderer.title?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId || '';

    // Get playlistId from various possible locations
    const playlistId = renderer.playlistId ||
                      renderer.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.playlistId ||
                      renderer.navigationEndpoint?.watchEndpoint?.playlistId ||
                      renderer.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId ||
                      renderer.menu?.menuRenderer?.items?.[0]?.menuNavigationItemRenderer?.navigationEndpoint?.watchPlaylistEndpoint?.playlistId ||
                      'default';

    // Get thumbnails from various possible locations
    const thumbnails = renderer.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
                      renderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];

    // Extract title and artists from flexColumns
    let title = 'Unknown';
    let artists = '';

    if (renderer.flexColumns) {
      // First column usually contains the title
      const titleColumn = renderer.flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer;
      if (titleColumn?.text?.runs?.[0]) {
        title = titleColumn.text.runs[0].text;
      }

      // Second column usually contains the artists
      const artistColumn = renderer.flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer;
      if (artistColumn?.text?.runs) {
        artists = artistColumn.text.runs.map(run => run.text).join('');
      }
    } else {
      // Fallback to old method if flexColumns not present
      title = renderer.title?.runs?.[0]?.text || 'Unknown';
      artists = renderer.subtitle?.runs?.map(run => run.text).join('') || '';
    }
    
    const result: YouTubeMusicItem = {
      title,
      videoId,
      playlistId,
      artists,
      thumbnail: thumbnails[thumbnails.length - 1]?.url || ''
    };

    console.log('✅ Processed content:', result);
    return result;
  } catch (error) {
    console.error('❌ Error processing renderer:', error);
    return null;
  }
}

function processShelfRenderer(shelf: YouTubeShelfRenderer): YouTubeMusicSection {
  const header = shelf.header?.musicCarouselShelfBasicHeaderRenderer || 
                shelf.header?.musicImmersiveCarouselShelfBasicHeaderRenderer;
  
  console.log('📝 Processing section header:', header);
  
  if (!header || !shelf.contents) {
    console.log('⚠️ Missing header or contents');
    return {
      title: 'Unknown Title',
      contents: []
    };
  }

  const title = header.title?.runs?.[0]?.text || 'Unknown Title';
  console.log('📝 Section title:', title);

  const contents = shelf.contents
    .map((content): YouTubeMusicItem | null => {
      const renderer = content.musicTwoRowItemRenderer || content.musicResponsiveListItemRenderer;
      if (!renderer) {
        console.log('⚠️ Missing renderer for content');
        return null;
      }
      return processRenderer(renderer);
    })
    .filter((content): content is YouTubeMusicItem => content !== null);

  console.log('📝 Section contents count:', contents.length);

  return {
    title,
    contents
  };
}

function extractMusicSections(sections: YouTubeSection[]): YouTubeMusicSection[] {
  return sections.flatMap((section): YouTubeMusicSection[] => {
    // Handle nested sections
    if (section.sectionListRenderer?.contents) {
      return extractMusicSections(section.sectionListRenderer.contents);
    }

    // Handle different types of shelf renderers
    if (section.musicCarouselShelfRenderer) {
      return [processShelfRenderer(section.musicCarouselShelfRenderer)];
    }

    if (section.musicImmersiveCarouselShelfRenderer) {
      return [processShelfRenderer(section.musicImmersiveCarouselShelfRenderer)];
    }

    if (section.gridRenderer) {
      return [processShelfRenderer(section.gridRenderer)];
    }

    console.log('⚠️ Unknown section type:', Object.keys(section));
    return [];
  }).filter(section => section.contents.length > 0);
}

export async function GET(): Promise<Response> {
  try {
    console.log('🚀 Fetching YouTube Music data...');
    const response = await fetch('https://music.youtube.com/youtubei/v1/browse', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Origin': 'https://music.youtube.com',
        'Referer': 'https://music.youtube.com/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
        'X-YouTube-Client-Name': '67',
        'X-YouTube-Client-Version': '1.20210101.00.00'
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'WEB_REMIX',
            clientVersion: '1.20210101.00.00',
            hl: 'en',
            gl: 'US'
          }
        },
        browseId: 'FEmusic_home'
      }),
    });

    if (!response.ok) {
      throw new Error(`YouTube API Error: ${response.status}`);
    }

    const data = await response.json() as YouTubeResponse;
    console.log('📥 Response Structure:', JSON.stringify({
      hasContinuationContents: Boolean(data.continuationContents),
      hasMainContents: Boolean(data.contents),
      sections: data.continuationContents?.sectionListContinuation?.contents?.length || 
               data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.length || 0
    }, null, 2));

    // Get sections from either continuationContents or main contents
    const sections = data.continuationContents?.sectionListContinuation?.contents || 
                    data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

    // Extract all music sections recursively
    const musicItems = extractMusicSections(sections);

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
        const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              public_id: 'response-home-feed',
              resource_type: 'raw',
              tags: ['home-feed', 'youtube-music'],
              overwrite: true,
              format: 'json',
              invalidate: true
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

          dataStream.pipe(uploadStream);
        });

        console.log('📎 Cloudinary URL:', uploadResult.secure_url);

        return new Response(
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
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
            } 
          }
        );
      } catch (uploadError) {
        console.error('❌ Error uploading to Cloudinary:', uploadError);
        return new Response(
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
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
            } 
          }
        );
      }
    } catch (error) {
      console.error('❌ Error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch YouTube Music data',
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    
    // Validate required context values
    if (!body.context?.client || !body.context?.user || !body.context?.request || !body.context?.clickTracking || !body.context?.adSignalsInfo) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required context fields',
          required: ['context.client', 'context.user', 'context.request', 'context.clickTracking', 'context.adSignalsInfo']
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate browseId
    if (!body.browseId) {
      body.browseId = "FEmusic_home";
    }

    const requiredClientFields = [
      'hl',
      'gl',
      'remoteHost',
      'deviceMake',
      'deviceModel',
      'visitorData',
      'userAgent',
      'clientName',
      'clientVersion',
      'osName',
      'osVersion',
      'originalUrl',
      'screenPixelDensity',
      'platform',
      'clientFormFactor',
      'configInfo',
      'screenDensityFloat',
      'timeZone',
      'browserName',
      'browserVersion',
      'acceptHeader',
      'deviceExperimentId',
      'screenWidthPoints',
      'screenHeightPoints',
      'utcOffsetMinutes',
      'userInterfaceTheme',
      'musicAppInfo'
    ];

    const missingFields = requiredClientFields.filter(field => !body.context.client[field]);
    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required client fields',
          missingFields
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate configInfo fields
    const requiredConfigFields = ['appInstallData', 'coldConfigData', 'coldHashData', 'hotHashData'];
    const missingConfigFields = requiredConfigFields.filter(field => !body.context.client.configInfo[field]);
    if (missingConfigFields.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required configInfo fields',
          missingConfigFields
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://music.youtube.com/youtubei/v1/browse', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Origin': 'https://music.youtube.com',
        'Referer': 'https://music.youtube.com/',
        'User-Agent': body.context.client.userAgent,
        'X-Goog-Visitor-Id': body.context.client.visitorData,
        'X-YouTube-Client-Name': '67',
        'X-YouTube-Client-Version': body.context.client.clientVersion,
        'X-Origin': 'https://music.youtube.com'
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`YouTube API Error: ${response.status}`);
    }

    const data = await response.json() as YouTubeResponse;

    // Get sections from either continuationContents or main contents
    const sections = data.continuationContents?.sectionListContinuation?.contents || 
                    data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

    // Extract all music sections recursively
    const musicItems = extractMusicSections(sections);

    return new Response(
      JSON.stringify({ 
        success: true,
        musicItems,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        } 
      }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to fetch YouTube Music data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

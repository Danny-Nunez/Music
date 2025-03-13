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

interface YouTubeRenderer {
  title?: {
    runs?: Array<{
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
    }>;
  };
  subtitle?: {
    runs?: Array<{
      text: string;
    }>;
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
  flexColumns?: Array<{
    musicResponsiveListItemFlexColumnRenderer?: {
      text?: {
        runs?: Array<{
          text: string;
          navigationEndpoint?: {
            browseEndpoint?: {
              browseId: string;
            };
          };
        }>;
      };
    };
  }>;
}

interface YouTubeShelfRenderer {
  header?: {
    musicCarouselShelfBasicHeaderRenderer?: {
      title?: {
        runs?: Array<{ text: string }>;
      };
    };
    musicImmersiveCarouselShelfBasicHeaderRenderer?: {
      title?: {
        runs?: Array<{ text: string }>;
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

const YOUTUBE_MUSIC_URL = 'https://music.youtube.com/youtubei/v1/browse?prettyPrint=false';

const defaultRequestBody = {
  "context": {
    "client": {
      "hl": "en",
      "gl": "US",
      "remoteHost": "96.244.37.40",
      "deviceMake": "Apple",
      "deviceModel": "",
      "visitorData": "CgtxazJ6azlZeDZ4OCi71MW-BjIKCgJVUxIEGgAgOA%3D%3D",
      "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36,gzip(gfe)",
      "clientName": "WEB_REMIX",
      "clientVersion": "1.20250305.01.00",
      "osName": "Macintosh",
      "osVersion": "10_15_7",
      "originalUrl": "https://music.youtube.com/moods_and_genres",
      "screenPixelDensity": 2,
      "platform": "DESKTOP",
      "clientFormFactor": "UNKNOWN_FORM_FACTOR",
      "configInfo": {
        "appInstallData": "CLvUxb4GENPhrwUQ4OD_EhDW8v8SELvZzhwQ_LLOHBCJ9_8SEPCcsAUQlPyvBRC9tq4FEParsAUQztrOHBCT2c4cEJT-sAUQ29rOHBDJ968FEIHNzhwQmZixBRC52c4cEL2ZsAUQ6-j-EhCHrM4cEO3ezhwQmufOHBCe0LAFEN68zhwQntvOHBC45M4cEIKDuCIQyeawBRC-vs4cEOTn_xIQzN-uBRDw4s4cELfq_hIQuNvOHBCW5M4cEO_szhwQiIewBRDdyM4cEOODuCIQhL3OHBDf3M4cEOK4sAUQmY2xBRCJsM4cEIjjrwUQ79nOHBC-irAFEIT5_xIQ-KuxBRCA0c4cEIXhzhwqJENBTVNGUlVXcGIyd0ROemtCb096OUF2bW9RajY3QU1kQnc9PQ%3D%3D",
        "coldConfigData": "CLvUxb4GGjJBT2pGb3gzQmtObTlPSmtiWjFhaU8yZGgxMmpESUZKMDlEeEFrcG9JbVdNc1VzYXUwQSIyQU9qRm94M0JrTm05T0prYloxYWlPMmRoMTJqRElGSjA5RHhBa3BvSW1XTXNVc2F1MEE%3D",
        "coldHashData": "CLvUxb4GEhM4MzcyMjg4Nzg1MDY2MDg0NzkyGLvUxb4GMjJBT2pGb3gzQmtObTlPSmtiWjFhaU8yZGgxMmpESUZKMDlEeEFrcG9JbVdNc1VzYXUwQToyQU9qRm94M0JrTm05T0prYloxYWlPMmRoMTJqRElGSjA5RHhBa3BvSW1XTXNVc2F1MEE%3D",
        "hotHashData": "CLvUxb4GEhM1MDkwODgzODc0MjY1NzY0ODc4GLvUxb4GMjJBT2pGb3gzQmtObTlPSmtiWjFhaU8yZGgxMmpESUZKMDlEeEFrcG9JbVdNc1VzYXUwQToyQU9qRm94M0JrTm05T0prYloxYWlPMmRoMTJqRElGSjA5RHhBa3BvSW1XTXNVc2F1MEE%3D"
      },
      "screenDensityFloat": 2,
      "timeZone": "America/New_York",
      "browserName": "Chrome",
      "browserVersion": "133.0.0.0",
      "acceptHeader": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "deviceExperimentId": "ChxOelE0TURnM056STFPRFF6T1RBeE1EVXpOQT09ELvUxb4GGLvUxb4G",
      "rolloutToken": "COiJ74u7ksqFjwEQ0IHb3ZuUigMYxIudz7GCjAM%3D",
      "screenWidthPoints": 608,
      "screenHeightPoints": 866,
      "utcOffsetMinutes": -240,
      "userInterfaceTheme": "USER_INTERFACE_THEME_LIGHT",
      "musicAppInfo": {
        "pwaInstallabilityStatus": "PWA_INSTALLABILITY_STATUS_CAN_BE_INSTALLED",
        "webDisplayMode": "WEB_DISPLAY_MODE_BROWSER",
        "storeDigitalGoodsApiSupportStatus": {
          "playStoreDigitalGoodsApiSupportStatus": "DIGITAL_GOODS_API_SUPPORT_STATUS_UNSUPPORTED"
        }
      }
    },
    "user": {
      "lockedSafetyMode": false
    },
    "request": {
      "useSsl": true,
      "consistencyTokenJars": [{
        "encryptedTokenJarContents": "AKreu9uMaCWmUMNJu7VBeSuEHjjZlapvbAq9oCTxffXvIgZS4qjgmFDIyPUgudhW5HNGSKLDbTyYB45XOjoKVKQKAWshQJrWq-wU1iqd_GBOXqK4i-G2Ezp1FxcyQbrj3f2gMbEd6CE9SXM9NqcFXghIBlXPIlVay9_jrqL3PHksMubKtXQujnIZ9veWGsr4rGuElUF3nMFj5enhnazVarxhFAJkprX9iTtFSKGAHy4cpCfBSev-rTaj-NXg2h3RDw"
      }],
      "internalExperimentFlags": []
    },
    "clickTracking": {
      "clickTrackingParams": "CCUQuKEFGAYiEwiHqYDasoSMAxXDm-QGHQ9AJDs="
    },
    "adSignalsInfo": {
      "params": [
        {"key": "dt", "value": "1741777468593"},
        {"key": "flash", "value": "0"},
        {"key": "frm", "value": "0"},
        {"key": "u_tz", "value": "-240"},
        {"key": "u_his", "value": "45"},
        {"key": "u_h", "value": "1120"},
        {"key": "u_w", "value": "1792"},
        {"key": "u_ah", "value": "1019"},
        {"key": "u_aw", "value": "1792"},
        {"key": "u_cd", "value": "24"},
        {"key": "bc", "value": "31"},
        {"key": "bih", "value": "866"},
        {"key": "biw", "value": "608"},
        {"key": "brdim", "value": "191,30,191,30,1792,25,1533,987,608,866"},
        {"key": "vis", "value": "1"},
        {"key": "wgl", "value": "true"},
        {"key": "ca_type", "value": "image"}
      ],
      "bid": "ANyPxKoQk2jhXmf0cNdFTCAdTSYjTgtpGa-3vel3UoO6-PyXKkrfeXbi4zBfbUaPBAjZyRMUbCsf"
    }
  },
  "browseId": "FEmusic_moods_and_genres_category",
  "params": "ggMPOg1uX1BmNzc2V2p0YXJ5"
};

function processRenderer(renderer: YouTubeRenderer): YouTubeMusicItem | null {
  console.log('📝 Processing renderer:', JSON.stringify(renderer, null, 2));

  // Get videoId from various possible locations
  const videoId = renderer.videoId ||
                 renderer.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId ||
                 renderer.navigationEndpoint?.watchEndpoint?.videoId ||
                 renderer.title?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId || '';

  // Get playlistId from various possible locations
  let playlistId = '';
  
  // For albums, get playlistId from menu items
  if (renderer.menu?.menuRenderer?.items?.[0]?.menuNavigationItemRenderer?.navigationEndpoint?.watchPlaylistEndpoint?.playlistId) {
    playlistId = renderer.menu.menuRenderer.items[0].menuNavigationItemRenderer.navigationEndpoint.watchPlaylistEndpoint.playlistId;
  } else {
    // For other content types, try other locations
    playlistId = renderer.playlistId ||
                 renderer.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.playlistId ||
                 renderer.navigationEndpoint?.watchEndpoint?.playlistId ||
                 renderer.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || '';
  }

  if (!playlistId) {
    console.log('⚠️ Missing playlistId');
    return null;
  }

  // Get thumbnails from various possible locations
  const thumbnails = renderer.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
                    renderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];

  // Extract title and artists
  let title = 'Unknown';
  let artists = '';

  if (Array.isArray(renderer.flexColumns)) {
    // For songs section which uses flexColumns
    const titleColumn = renderer.flexColumns[0];
    if (titleColumn?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text) {
      title = titleColumn.musicResponsiveListItemFlexColumnRenderer.text.runs[0].text;
    }

    const artistColumn = renderer.flexColumns[1];
    if (artistColumn?.musicResponsiveListItemFlexColumnRenderer?.text?.runs) {
      artists = artistColumn.musicResponsiveListItemFlexColumnRenderer.text.runs
        .map((run: { text: string }) => run.text)
        .filter((text: string) => text !== ' • ' && !text.includes('views')) // Filter out separators and view counts
        .join(', ');
    }
  } else if (renderer.title?.runs?.[0]?.text) {
    // For albums and playlists that use title.runs directly
    title = renderer.title.runs[0].text;
    
    // Try to get artist info from subtitle if available
    if (renderer.subtitle?.runs) {
      // Filter out "Album" and "•" from subtitle runs
      const artistRuns = renderer.subtitle.runs.filter((run: { text: string }) => 
        !['Album', '•', ' • ', ' ', 'Playlist'].includes(run.text.trim())
      );
      artists = artistRuns.map((run: { text: string }) => run.text).join(', ');
    }
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
    console.log('📤 Request URL:', YOUTUBE_MUSIC_URL);
    console.log('📤 Request Body:', JSON.stringify(defaultRequestBody, null, 2));

    const response = await fetch(YOUTUBE_MUSIC_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Origin': 'https://music.youtube.com',
        'Referer': 'https://music.youtube.com/',
        'User-Agent': defaultRequestBody.context.client.userAgent,
        'X-Goog-Visitor-Id': defaultRequestBody.context.client.visitorData,
        'X-YouTube-Client-Name': '67',
        'X-YouTube-Client-Version': defaultRequestBody.context.client.clientVersion,
        'X-Origin': 'https://music.youtube.com'
      },
      body: JSON.stringify(defaultRequestBody),
    });

    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('❌ YouTube API Error:', response.status);
      const errorText = await response.text();
      console.error('❌ Error details:', errorText);
      return new Response(
        JSON.stringify({ 
          error: `YouTube API Error: ${response.status}`,
          details: errorText
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const rawData = await response.text();
    console.log('📥 Raw Response:', rawData);

    const data = JSON.parse(rawData) as YouTubeResponse;

    console.log('📥 Response Structure:', JSON.stringify({
      hasContinuationContents: Boolean(data.continuationContents),
      hasMainContents: Boolean(data.contents),
      sections: data.continuationContents?.sectionListContinuation?.contents?.length || 
               data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.length || 0
    }, null, 2));

    // Get sections from either continuationContents or main contents
    const sections = data.continuationContents?.sectionListContinuation?.contents || 
                    data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

    console.log('🔍 Found sections:', sections.length);
    if (sections.length === 0) {
      console.log('⚠️ No sections found in response');
      console.log('📥 Full Response Data:', JSON.stringify(data, null, 2));
    }

    // Extract all music sections recursively
    const musicItems = extractMusicSections(sections);
    console.log('📦 Final musicItems:', musicItems);

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
            public_id: 'response-pop',
            resource_type: 'raw',
            tags: ['part-feed', 'youtube-music'],
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
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
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
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
          } 
        }
      );
    }
  } catch (error) {
    console.error('❌ Error fetching YouTube Music data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
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

    // Validate browseId and params
    if (!body.browseId || !body.params) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          required: ['browseId', 'params']
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
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

    console.log('🚀 Fetching YouTube Music data...');
    console.log('📤 Request URL:', YOUTUBE_MUSIC_URL);
    console.log('📤 Request Body:', JSON.stringify(body, null, 2));

    const response = await fetch(YOUTUBE_MUSIC_URL, {
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

    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('❌ YouTube API Error:', response.status);
      const errorText = await response.text();
      console.error('❌ Error details:', errorText);
      return new Response(
        JSON.stringify({ 
          error: `YouTube API Error: ${response.status}`,
          details: errorText
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const rawData = await response.text();
    console.log('📥 Raw Response:', rawData);

    const data = JSON.parse(rawData) as YouTubeResponse;

    console.log('📥 Response Structure:', JSON.stringify({
      hasContinuationContents: Boolean(data.continuationContents),
      hasMainContents: Boolean(data.contents),
      sections: data.continuationContents?.sectionListContinuation?.contents?.length || 
               data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.length || 0
    }, null, 2));

    // Get sections from either continuationContents or main contents
    const sections = data.continuationContents?.sectionListContinuation?.contents || 
                    data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

    console.log('🔍 Found sections:', sections.length);
    if (sections.length === 0) {
      console.log('⚠️ No sections found in response');
      console.log('📥 Full Response Data:', JSON.stringify(data, null, 2));
    }

    // Extract all music sections recursively
    const musicItems = extractMusicSections(sections);
    console.log('📦 Final musicItems:', musicItems);

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
            public_id: 'response-part',
            resource_type: 'raw',
            tags: ['part-feed', 'youtube-music'],
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
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
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
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
          } 
        }
      );
    }
  } catch (error) {
    console.error('❌ Error fetching YouTube Music data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
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
  }
}

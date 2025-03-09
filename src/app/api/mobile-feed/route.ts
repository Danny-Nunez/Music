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
  thumbnailRenderer?: {
    musicThumbnailRenderer?: {
      thumbnail?: {
        thumbnails?: MusicThumbnail[];
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
}

interface YouTubeSection {
  musicCarouselShelfRenderer: {
    header?: {
      musicCarouselShelfBasicHeaderRenderer?: {
        title?: {
          runs?: Array<{ text: string }>;
        };
      };
    };
    contents?: Array<{
      musicTwoRowItemRenderer?: YouTubeRenderer;
    }>;
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

const YOUTUBE_MUSIC_URL = 'https://music.youtube.com/youtubei/v1/browse?ctoken=4qmFsgKhAhIMRkVtdXNpY19ob21lGpACQ0FaNnh3RkhUM3B6TldGMVJGOUpjMFJYYjBWQ1EyNDRTMHBJYkRCWU0wSm9XakpXWm1NeU5XaGpTRTV2WWpOU1ptSllWbnBoVjA1bVkwZEdibHBXT1hsYVYyUndZakkxYUdKQ1NXWlNWR2gxWWtSQ2QySldhR3hsYlRsWVZWVk9jRlV5Y0RSaVJVcFNVMGhhU1U1clRuaFVNVm8wWVhodk1sUllWbnBoVjA1RllWaE9hbUl6V214amJteFJXVmRrYkZVeVZubGtiV3hxV2xNeFNGcFlVa2xpTWpGc1ZVZEdibHBSUVVKQlIxWjFRVUZHVmxWM1FVSldWazFCUVZGRlJDMXdla2gyVVd0RFEwRmo%253D&continuation=4qmFsgKhAhIMRkVtdXNpY19ob21lGpACQ0FaNnh3RkhUM3B6TldGMVJGOUpjMFJYYjBWQ1EyNDRTMHBJYkRCWU0wSm9XakpXWm1NeU5XaGpTRTV2WWpOU1ptSllWbnBoVjA1bVkwZEdibHBXT1hsYVYyUndZakkxYUdKQ1NXWlNWR2gxWWtSQ2QySldhR3hsYlRsWVZWVk9jRlV5Y0RSaVJVcFNVMGhhU1U1clRuaFVNVm8wWVhodk1sUllWbnBoVjA1RllWaE9hbUl6V214amJteFJXVmRrYkZVeVZubGtiV3hxV2xNeFNGcFlVa2xpTWpGc1ZVZEdibHBSUVVKQlIxWjFRVUZHVmxWM1FVSldWazFCUVZGRlJDMXdla2gyVVd0RFEwRmo%253D&type=next&itct=CAIQybcCIhMIs9XurIP8iwMVyqHkBh0ngSCT&prettyPrint=false';

const requestBody = {
  "context": {
    "client": {
      "hl": "en",
      "gl": "US",
      "remoteHost": "96.244.37.40",
      "deviceMake": "Apple",
      "deviceModel": "",
      "visitorData": "CgtxazJ6azlZeDZ4OCjUjbS-BjIKCgJVUxIEGgAgOA%3D%3D",
      "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36,gzip(gfe)",
      "clientName": "WEB_REMIX",
      "clientVersion": "1.20250305.01.00",
      "osName": "Macintosh",
      "osVersion": "10_15_7",
      "originalUrl": "https://music.youtube.com/",
      "screenPixelDensity": 2,
      "platform": "DESKTOP",
      "clientFormFactor": "UNKNOWN_FORM_FACTOR",
      "configInfo": {
        "appInstallData": "CNSNtL4GELjkzhwQ44O4IhDT4a8FEPirsQUQyfevBRCBzc4cEJT-sAUQvbauBRDM364FEJXkzhwQuNvOHBC-irAFEM7azhwQ-d3OHBDb2s4cEODg_xIQiOOvBRC9mbAFEJmNsQUQ1tjOHBC52c4cEN6tsQUQyeawBRDk5_8SEJPZzhwQ7d7OHBDW8v8SEN68zhwQt-r-EhDiuLAFEOvo_hIQmZixBRD8ss4cEN7YzhwQntvOHBCCg7giELvZzhwQ8JywBRCJsM4cEJ7QsAUQh6zOHBCU_K8FEO_ZzhwQmufOHBDw4s4cEParsAUQr-XOHBCIh7AFEN_czhwQhL3OHBDdyM4cEIDRzhwQheHOHCokQ0FNU0ZSVVdwYjJ3RE56a0JvT3o5QXZtb1FqNjdBTWRCdz09",
        "coldConfigData": null,
        "coldHashData": null,
        "hotHashData": null
      },
      "screenDensityFloat": 2,
      "timeZone": "America/New_York",
      "browserName": "Chrome",
      "browserVersion": "133.0.0.0",
      "acceptHeader": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "deviceExperimentId": "ChxOelEzT1RZME1qQTJOVGd4TXpnNU1Ua3pOUT09ENSNtL4GGNSNtL4G",
      "screenWidthPoints": 1108,
      "screenHeightPoints": 866,
      "utcOffsetMinutes": -300,
      "userInterfaceTheme": "USER_INTERFACE_THEME_LIGHT",
      "musicAppInfo": {
        "pwaInstallabilityStatus": "PWA_INSTALLABILITY_STATUS_UNKNOWN",
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
      "internalExperimentFlags": [],
      "consistencyTokenJars": []
    },
    "adSignalsInfo": {
      "params": [
        {"key": "dt", "value": "1741489877357"},
        {"key": "flash", "value": "0"},
        {"key": "frm", "value": "0"},
        {"key": "u_tz", "value": "-300"},
        {"key": "u_his", "value": "18"},
        {"key": "u_h", "value": "1120"},
        {"key": "u_w", "value": "1792"},
        {"key": "u_ah", "value": "1010"},
        {"key": "u_aw", "value": "1792"},
        {"key": "u_cd", "value": "24"},
        {"key": "bc", "value": "31"},
        {"key": "bih", "value": "866"},
        {"key": "biw", "value": "1108"},
        {"key": "brdim", "value": "68,33,68,33,1792,25,1611,987,1108,866"},
        {"key": "vis", "value": "1"},
        {"key": "wgl", "value": "true"},
        {"key": "ca_type", "value": "image"}
      ],
      "bid": "ANyPxKpwoL2xRmwcpoDg4CbwIpMpHUb3QwgGiGUHlv_N_dZcR7N5KORdEgputuGgm6eLtg_6mHjO"
    }
  }
};

export async function GET(): Promise<Response> {
  try {
    console.log('🚀 Fetching YouTube Music data...');
    const response = await fetch(YOUTUBE_MUSIC_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Origin': 'https://music.youtube.com',
        'Referer': 'https://music.youtube.com/',
        'User-Agent': requestBody.context.client.userAgent
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error('❌ YouTube API Error:', response.status);
      return new Response(
        JSON.stringify({ error: `YouTube API Error: ${response.status}` }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json() as YouTubeResponse;
    // console.log('📦 Raw YouTube Music response:', JSON.stringify(data, null, 2));

    // Get sections from either continuationContents or main contents
    const sections = data.continuationContents?.sectionListContinuation?.contents || 
                    data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

    console.log('🔍 Found sections:', sections.length);

    // Extract all music carousel sections
    const musicItems = sections
      .filter((section): section is YouTubeSection => {
        const hasRenderer = Boolean(section.musicCarouselShelfRenderer);
        console.log('📝 Section has renderer:', hasRenderer);
        return hasRenderer;
      })
      .map((section): YouTubeMusicSection => {
        const shelf = section.musicCarouselShelfRenderer;
        const header = shelf.header?.musicCarouselShelfBasicHeaderRenderer;
        
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
            const renderer = content.musicTwoRowItemRenderer;
            if (!renderer) {
              console.log('⚠️ Missing renderer for content');
              return null;
            }

            console.log('📝 Processing content:', JSON.stringify(renderer, null, 2));

            // Get videoId and playlistId from various possible locations
            const videoId = renderer.navigationEndpoint?.watchEndpoint?.videoId ||
                          renderer.title?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId || '';

            const playlistId = renderer.navigationEndpoint?.watchEndpoint?.playlistId ||
                             renderer.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId ||
                             renderer.menu?.menuRenderer?.items?.[0]?.menuNavigationItemRenderer?.navigationEndpoint?.watchPlaylistEndpoint?.playlistId || '';

            if (!playlistId) {
              console.log('⚠️ Missing playlistId');
              return null;
            }

            const thumbnails = renderer.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
            const subtitle = renderer.subtitle?.runs?.map(run => run.text).join('') || '';
            
            const result: YouTubeMusicItem = {
              title: renderer.title?.runs?.[0]?.text || 'Unknown',
              videoId,
              playlistId,
              artists: subtitle,
              thumbnail: thumbnails[thumbnails.length - 1]?.url || ''
            };

            console.log('✅ Processed content:', result);
            return result;
          })
          .filter((content): content is YouTubeMusicItem => content !== null);

        console.log('📝 Section contents count:', contents.length);

        return {
          title,
          contents
        };
      })
      .filter((section) => section.contents.length > 0);

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
      // Upload JSON to Cloudinary
      const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            public_id: 'response-mobile',
            resource_type: 'raw',
            tags: ['mobile-feed', 'youtube-music'],
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

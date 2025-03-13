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
    subtitleBadges?: Array<{
      musicInlineBadgeRenderer?: {
        icon?: {
          iconType: string;
        };
      };
    }>;
  };
}

interface SongItem {
  videoId: string;
  title: string;
  thumbnail: string;
  sectionTitle: string;
  artist: string;
  plays: string;
  isExplicit: boolean;
}

interface SectionGroup {
  title: string;
  songs: SongItem[];
}

const YOUTUBE_MUSIC_URL = 'https://music.youtube.com/youtubei/v1/browse?prettyPrint=false';

const requestBody = {
  "context": {
    "client": {
      "hl": "en",
      "gl": "US",
      "remoteHost": "96.244.37.40",
      "deviceMake": "Apple",
      "deviceModel": "",
      "visitorData": "CgtxazJ6azlZeDZ4OCj-yMa-BjIKCgJVUxIEGgAgOA%3D%3D",
      "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36,gzip(gfe)",
      "clientName": "WEB_REMIX",
      "clientVersion": "1.20250305.01.00",
      "osName": "Macintosh",
      "osVersion": "10_15_7",
      "originalUrl": "https://music.youtube.com/charts",
      "screenPixelDensity": 2,
      "platform": "DESKTOP",
      "clientFormFactor": "UNKNOWN_FORM_FACTOR",
      "configInfo": {
        "appInstallData": "CP7Ixr4GEPCcsAUQt-r-EhC9mbAFELjbzhwQmufOHBCJ9_8SEMn3rwUQmY2xBRD2q7AFEN68zhwQ8OLOHBCE-f8SEJmYsQUQk9nOHBC45M4cEIS9zhwQ6-j-EhD8ss4cEJbkzhwQlP6wBRC-vs4cEN3IzhwQ8OzOHBDjg7giEL6KsAUQ-KuxBRDW8v8SEIeszhwQ4riwBRDO2s4cEMnmsAUQudnOHBC72c4cEL22rgUQzN-uBRDb2s4cEIiHsAUQiOOvBRDk5_8SEJ7bzhwQ4OD_EhDt3s4cEO_ZzhwQ4NzOHBCU_K8FEImwzhwQ0-GvBRCe0LAFEIHNzhwQgNHOHBCF4c4cKiRDQU1TRlJVV3BiMndETnprQm9PejlBdm1vUWo2N0FNZEJ3PT0%3D",
        "coldConfigData": null,
        "coldHashData": null,
        "hotHashData": null
      },
      "screenDensityFloat": 2,
      "timeZone": "America/New_York",
      "browserName": "Chrome",
      "browserVersion": "133.0.0.0",
      "acceptHeader": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "deviceExperimentId": "ChxOelE0TURrME1UTXhPREl5TlRVeE9UVXhNdz09EP7Ixr4GGP7Ixr4G",
      "rolloutToken": "COiJ74u7ksqFjwEQ0IHb3ZuUigMYxIudz7GCjAM%3D",
      "screenWidthPoints": 926,
      "screenHeightPoints": 866,
      "utcOffsetMinutes": -240,
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
    "clickTracking": {
      "clickTrackingParams": "IhMIlMPYoeqEjAMVGprkBh00qBC5MghleHRlcm5hbA=="
    },
    "adSignalsInfo": {
      "params": [
        {"key": "dt", "value": "1741792382827"},
        {"key": "flash", "value": "0"},
        {"key": "frm", "value": "0"},
        {"key": "u_tz", "value": "-240"},
        {"key": "u_his", "value": "50"},
        {"key": "u_h", "value": "1120"},
        {"key": "u_w", "value": "1792"},
        {"key": "u_ah", "value": "1019"},
        {"key": "u_aw", "value": "1792"},
        {"key": "u_cd", "value": "24"},
        {"key": "bc", "value": "31"},
        {"key": "bih", "value": "866"},
        {"key": "biw", "value": "926"},
        {"key": "brdim", "value": "59,42,59,42,1792,25,1690,987,926,866"},
        {"key": "vis", "value": "1"},
        {"key": "wgl", "value": "true"},
        {"key": "ca_type", "value": "image"}
      ]
    }
  },
  "browseId": "FEmusic_charts",
  "params": "sgYMRkVtdXNpY19ob21l"
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

        // Check for explicit content badge
        const isExplicit = renderer.subtitleBadges?.some(badge => 
          badge.musicInlineBadgeRenderer?.icon?.iconType === 'MUSIC_EXPLICIT_BADGE'
        ) ?? false;

        songs.push({
          videoId,
          title,
          thumbnail,
          sectionTitle,
          artist,
          plays: playsText,
          isExplicit
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
            public_id: 'response-trending-songs', // Different filename from mobile-feed
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

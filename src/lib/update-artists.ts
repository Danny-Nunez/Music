import fetch from 'node-fetch';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { Readable } from 'stream';

// Load environment variables from .env
dotenv.config();

console.log('🌍 Environment Variables Loaded');
console.log('Cloudinary Config:', {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY ? '*****' : 'Missing API Key',
  apiSecret: process.env.CLOUDINARY_API_SECRET ? '*****' : 'Missing API Secret',
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function updateArtists() {
  try {
    const apiUrl = 'https://charts.youtube.com/youtubei/v1/browse?alt=json';

    // Request payload
    const requestPayload = {
      context: {
        client: {
          clientName: 'WEB_MUSIC_ANALYTICS',
          clientVersion: '2.0',
          hl: 'en',
          gl: 'US',
          experimentIds: [],
          experimentsToken: '',
          theme: 'MUSIC',
        },
        capabilities: {},
        request: {
          internalExperimentFlags: [],
        },
      },
      browseId: 'FEmusic_analytics_charts_home',
      query: 'perspective=CHART_DETAILS&chart_params_country_code=us&chart_params_chart_type=ARTISTS&chart_params_period_type=WEEKLY',
    };

    console.log('📄 Request Payload:', JSON.stringify(requestPayload, null, 2));

    // Headers mimicking the browser request
    const headers = {
      'Content-Type': 'application/json',
      'Origin': 'https://charts.youtube.com',
      'Referer': 'https://charts.youtube.com/charts/TopVideos/us/daily',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    };

    console.log('📡 Sending request to YouTube artists API...');
    console.log('Headers:', headers);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestPayload),
    });

    console.log('🔄 Response Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error fetching data from YouTube API:', errorText);
      return { success: false, error: errorText };
    }

    // Parse response JSON
    const data = await response.json();
    console.log('✅ Data fetched from API:', JSON.stringify(data, null, 2).slice(0, 500)); // Show first 500 characters for brevity

    // Create a Readable stream from the JSON data
    const dataStream = new Readable();
    dataStream.push(JSON.stringify(data, null, 2));
    dataStream.push(null); // End the stream

    // Upload JSON to Cloudinary
    console.log('🚀 Uploading data to Cloudinary...');
    const uploadResult = await cloudinary.uploader.upload_stream(
      {
        public_id: 'top100-artists', // File name in Cloudinary
        resource_type: 'raw',       // Set as 'raw' for JSON files
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary Upload Error:', error);
          throw error;
        }
        console.log('✅ Cloudinary Upload Result:', result);
      }
    );

    // Pipe the data stream into the upload function
    dataStream.pipe(uploadResult);

    return {
      success: true,
      message: 'Artists data fetched and uploaded successfully',
      dataPath: uploadResult.secure_url, // Public URL for the JSON file
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('❌ Error fetching or uploading artists data:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

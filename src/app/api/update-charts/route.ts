import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
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
      query: 'perspective=CHART_DETAILS&chart_params_country_code=us&chart_params_chart_type=TRACKS&chart_params_period_type=WEEKLY',
    };

    // Headers mimicking the browser request
    const headers = {
      'Content-Type': 'application/json',
      'Origin': 'https://charts.youtube.com',
      'Referer': 'https://charts.youtube.com/charts/TopVideos/us/daily',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    };

    console.log('📡 Sending request to YouTube charts API...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestPayload),
    });

    console.log('Response Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error fetching data from YouTube API:', errorText);
      return NextResponse.json({ success: false, error: errorText }, { status: response.status });
    }

    // Parse response JSON
    const data = await response.json();

    // Save the full response to a JSON file
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    const outputPath = path.join(publicDir, 'top100-songs.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log('✅ Full API response saved to:', outputPath)

    return NextResponse.json({
      success: true,
      message: 'Full API response fetched successfully',
      dataPath: outputPath,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('❌ Error fetching data:', errorMessage);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

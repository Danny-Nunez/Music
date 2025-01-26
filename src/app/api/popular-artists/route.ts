import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const requestBody = await request.json().catch(() => ({}));
    
    const defaultBody = {
      context: {
        client: {
          clientName: 'WEB_MUSIC_ANALYTICS',
          clientVersion: '2.0',
          hl: 'en',
          gl: 'US',
          experimentIds: [],
          experimentsToken: '',
          theme: 'MUSIC'
        },
        capabilities: {},
        request: {
          internalExperimentFlags: []
        }
      },
      browseId: 'FEmusic_analytics_charts_home',
      query: 'perspective=CHART_DETAILS&chart_params_country_code=us&chart_params_chart_type=ARTISTS&chart_params_period_type=WEEKLY'
    };

    const response = await fetch('https://charts.youtube.com/youtubei/v1/browse?alt=json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...defaultBody, ...requestBody })
    });

    if (!response.ok) {
      throw new Error(`YouTube Charts API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in popular-artists API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

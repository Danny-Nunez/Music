import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const artistId = payload.browseId;
    console.log('Artist insights request:', { 
      originalId: artistId,
      encodedQuery: encodeURIComponent(artistId),
      requestBody: {
        browseId: 'FEmusic_analytics_insights_artist',
        query: `perspective=ARTIST&entity_params_entity=ARTIST&artist_params_id=${encodeURIComponent(artistId)}`
      }
    });

    const response = await fetch('https://music.youtube.com/youtubei/v1/browse?key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://music.youtube.com',
        'Referer': 'https://music.youtube.com/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-Origin': 'https://music.youtube.com'
      },
      body: JSON.stringify({
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
        browseId: 'FEmusic_analytics_insights_artist',
        query: `perspective=ARTIST&entity_params_entity=ARTIST&artist_params_id=${encodeURIComponent(artistId)}`
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube Music API error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        requestedArtistId: artistId
      });
      throw new Error(`YouTube Music API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('YouTube Music API success:', {
      status: response.status,
      artistId,
      data
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in artist-insights API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

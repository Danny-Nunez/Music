import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    const response = await fetch('https://charts.youtube.com/youtubei/v1/browse?alt=json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://charts.youtube.com',
        'Referer': 'https://charts.youtube.com/',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`YouTube Charts API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in artist-insights API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
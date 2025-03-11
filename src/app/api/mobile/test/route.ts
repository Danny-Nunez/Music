import { NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders
  });
}

export async function POST(request: Request) {
  try {
    console.log('=== POST /api/mobile/test ===');
    console.log('Method:', request.method);
    console.log('URL:', request.url);
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    
    // Clone request to read body multiple times
    const clonedRequest = request.clone();
    const rawBody = await clonedRequest.text();
    console.log('Raw request body:', rawBody);

    // Parse the body
    const body = await request.json();
    
    // Simply return the received data
    return NextResponse.json(
      { 
        success: true,
        message: 'Test endpoint working',
        receivedData: body
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

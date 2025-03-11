import { NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Token'
};

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Handle GET requests
export async function GET() {
  return NextResponse.json({ message: 'GET request works' }, { headers: corsHeaders });
}

// Handle POST requests
export async function POST(request: Request) {
  try {
    console.log('=== POST /api/mobile/test2 ===');
    console.log('Method:', request.method);
    console.log('URL:', request.url);
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    
    // Clone request to read body multiple times
    const clonedRequest = request.clone();
    const rawBody = await clonedRequest.text();
    console.log('Raw request body:', rawBody);

    // Parse the body
    const body = await request.json();
    
    return NextResponse.json({ 
      success: true,
      message: 'POST request works',
      receivedData: body 
    }, { 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
}

// Handle PUT requests
export async function PUT() {
  return NextResponse.json({ message: 'PUT request works' }, { headers: corsHeaders });
}

// Handle DELETE requests
export async function DELETE() {
  return NextResponse.json({ message: 'DELETE request works' }, { headers: corsHeaders });
}

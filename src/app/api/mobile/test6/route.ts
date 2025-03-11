import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Token'
};

export async function GET(req: NextRequest) {
  console.log('=== GET /api/mobile/test6 ===');
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  try {
    // Get data from query parameter
    const url = new URL(req.url);
    const data = url.searchParams.get('data');
    
    if (!data) {
      return Response.json({ 
        error: 'No data provided' 
      }, { 
        status: 400,
        headers: corsHeaders 
      });
    }

    // Parse the data
    const parsedData = JSON.parse(decodeURIComponent(data));
    
    return Response.json({ 
      success: true,
      message: 'Data received via GET',
      receivedData: parsedData
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error processing request:', error);
    return Response.json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}

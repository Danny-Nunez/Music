import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Token'
};

export async function PUT(req: NextRequest) {
  console.log('=== PUT /api/mobile/test7 ===');
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  try {
    const body = await req.json();
    
    return Response.json({ 
      success: true,
      message: 'PUT request received',
      receivedData: body
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

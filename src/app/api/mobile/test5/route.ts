import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Token'
};

export async function GET(req: NextRequest) {
  console.log('=== GET /api/mobile/test5 ===');
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  // Check if this is actually a POST request that was rewritten
  const searchParams = new URL(req.url).searchParams;
  const isRewrittenPost = searchParams.get('_method') === 'POST';

  if (isRewrittenPost) {
    console.log('This is a rewritten POST request');
    try {
      // Handle as POST
      const body = await req.json();
      return Response.json({ 
        success: true,
        message: 'Rewritten POST request handled',
        receivedData: body
      }, { headers: corsHeaders });
    } catch (error) {
      console.error('Error processing rewritten POST:', error);
      return Response.json({ 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { 
        status: 500,
        headers: corsHeaders 
      });
    }
  }

  // Regular GET request
  return Response.json({ 
    success: true,
    message: 'GET request received'
  }, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  console.log('=== POST /api/mobile/test5 ===');
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  try {
    const body = await req.json();
    return Response.json({ 
      success: true,
      message: 'Direct POST request handled',
      receivedData: body
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error processing POST:', error);
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

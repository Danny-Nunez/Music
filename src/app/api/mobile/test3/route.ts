import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  console.log('=== POST /api/mobile/test3 ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  return Response.json({ 
    success: true,
    message: 'POST request received'
  });
}

export async function GET() {
  return Response.json({ message: 'GET works' });
}

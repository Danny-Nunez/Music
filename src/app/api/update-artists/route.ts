import { NextResponse } from 'next/server';
import { updateArtists } from '@/lib/update-artists';

export async function GET() {
  const result = await updateArtists();
  return NextResponse.json(result);
}
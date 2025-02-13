import { NextResponse } from 'next/server';
import { updateCharts } from '../../../lib/update-charts';

export async function GET() {
  const result = await updateCharts();
  return NextResponse.json(result);
}

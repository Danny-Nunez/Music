import { NextResponse } from 'next/server';
import { termsOfServiceData } from '@/data/termsOfService';

export async function GET() {
  try {
    return NextResponse.json(termsOfServiceData);
  } catch (error) {
    console.error('Error fetching terms of service:', error);
    return NextResponse.json(
      { error: 'Failed to fetch terms of service' },
      { status: 500 }
    );
  }
} 
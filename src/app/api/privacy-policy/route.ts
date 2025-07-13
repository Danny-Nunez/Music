import { NextResponse } from 'next/server';
import { privacyPolicyData } from '@/data/privacyPolicy';

export async function GET() {
  try {
    return NextResponse.json(privacyPolicyData);
  } catch (error) {
    console.error('Error fetching privacy policy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch privacy policy' },
      { status: 500 }
    );
  }
} 
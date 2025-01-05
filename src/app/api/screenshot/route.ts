import { NextResponse } from 'next/server';
import { withPuppeteer } from '@/lib/puppeteer';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const screenshot = await withPuppeteer(async (browser, page) => {
      await page.goto(url);
      const buffer = await page.screenshot();
      return buffer;
    });

    return new NextResponse(screenshot, {
      headers: {
        'Content-Type': 'image/png',
      },
    });
  } catch (error) {
    console.error('Screenshot error:', error);
    return NextResponse.json(
      { error: 'Failed to capture screenshot' },
      { status: 500 }
    );
  }
}
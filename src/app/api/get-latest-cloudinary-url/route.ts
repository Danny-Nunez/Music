import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const folder = searchParams.get('folder');

    if (!folder) {
      return NextResponse.json({ error: 'Folder parameter is required' }, { status: 400 });
    }

    const resources = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      resource_type: 'raw',
      max_results: 1,
    });

    if (!resources.resources || resources.resources.length === 0) {
      return NextResponse.json({ error: 'No resources found in Cloudinary.' }, { status: 404 });
    }

    const latestResource = resources.resources[0];
    return NextResponse.json({ url: latestResource.secure_url });
  } catch (error) {
    console.error('Error fetching Cloudinary URL:', error);
    return NextResponse.json({ error: 'Failed to fetch Cloudinary URL.' }, { status: 500 });
  }
}

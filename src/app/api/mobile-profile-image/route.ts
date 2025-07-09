import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Content-Length',
  'Access-Control-Allow-Credentials': 'true'
};

export async function POST(request: Request): Promise<Response> {
  // Handle preflight request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    // Get the request body
    const body = await request.json();
    console.log('Request body:', body);

    if (!body.assets?.[0]?.uri) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No image URI provided'
        }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    const imageData = body.assets[0];
    console.log('Processing image:', imageData);

    // Upload to Cloudinary
    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.upload(
        imageData.uri,
        {
          folder: 'profile-images',
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg'],
          transformation: [
            { width: 500, height: 500, crop: 'fill' },
            { quality: 80 }
          ]
        },
        (error, result) => {
          if (error || !result) {
            console.error('Cloudinary upload error:', error);
            reject(error || new Error('Upload failed'));
          } else {
            console.log('Cloudinary upload successful');
            resolve(result);
          }
        }
      );
    });

    console.log('Upload complete, returning response');

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id
        }
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );

  } catch (error) {
    console.error('Error uploading image:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
}

// Configure max file size
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb'
    }
  }
};

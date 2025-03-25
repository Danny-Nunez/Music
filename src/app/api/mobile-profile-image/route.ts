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
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Content-Length, multipart/form-data',
  'Access-Control-Allow-Credentials': 'true'
};

export async function POST(request: Request): Promise<Response> {
  console.log('Received upload request');
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));

  // Handle preflight request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    // Get the form data from the request
    const formData = await request.formData();
    console.log('FormData received');

    // Log all form data entries
    const entries = Array.from(formData.entries());
    entries.forEach(([key, value]) => {
      console.log(`Form data entry - ${key}:`, value);
    });

    const file = formData.get('file');
    console.log('File from form:', file);

    if (!file) {
      console.log('No file provided');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No file provided'
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

    // Convert the file data to a buffer
    let buffer: Buffer;
    try {
      // Get the raw file data
      const rawData = await request.arrayBuffer();
      buffer = Buffer.from(rawData);
    } catch (error) {
      console.error('Error processing file:', error);
      throw new Error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log('File processed, uploading to Cloudinary...');

    // Upload to Cloudinary
    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'profile-images',
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg'], // Restrict to JPEG since that's what the app sends
          transformation: [
            { width: 500, height: 500, crop: 'fill' }, // Match app's 1:1 aspect ratio
            { quality: 80 } // Match app's quality setting
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

      // Write buffer to stream
      uploadStream.end(buffer);
    });

    console.log('Upload complete, returning response');

    // Return the Cloudinary URL with CORS headers
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

// Handle OPTIONS preflight request
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}

// Configure max file size
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb' // Max file size
    }
  }
};

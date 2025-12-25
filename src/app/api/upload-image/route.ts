import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const blobConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const blobContainerName = process.env.AZURE_STORAGE_CONTAINER_NAME!;

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json(
        { success: false, message: 'File and userId required' },
        { status: 400 }
      );
    }

    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'File size exceeds 8MB limit' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);
    let contentType = file.type;
    let fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';

    // Handle HEIC/HEIF conversion on the server
    if (fileExtension === 'heic' || fileExtension === 'heif' || 
        contentType === 'image/heic' || contentType === 'image/heif') {
      try {
        buffer = await sharp(buffer)
          .jpeg({ quality: 90 })
          .toBuffer();
        
        contentType = 'image/jpeg';
        fileExtension = 'jpg';
      } catch (conversionError) {
        console.error('HEIC conversion failed:', conversionError);
        return NextResponse.json(
          { success: false, message: 'Failed to convert HEIC image' },
          { status: 400 }
        );
      }
    }

    if (!contentType.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: 'File must be an image' },
        { status: 400 }
      );
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      blobConnectionString
    );
    const containerClient = blobServiceClient.getContainerClient(
      blobContainerName
    );

    const blobName = `${userId}/${uuidv4()}.${fileExtension}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: { 
        blobContentType: contentType 
      },
    });

    return NextResponse.json({
      success: true,
      url: blockBlobClient.url,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to upload image' 
      },
      { status: 500 }
    );
  }
}

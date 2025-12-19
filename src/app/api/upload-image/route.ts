import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';

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

    // Validate file size (8MB)
    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'File size exceeds 8MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: 'File must be an image' },
        { status: 400 }
      );
    }

    // Initialize Azure client
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      blobConnectionString
    );
    const containerClient = blobServiceClient.getContainerClient(
      blobContainerName
    );

    // Generate unique blob name
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const blobName = `${userId}/${uuidv4()}.${fileExtension}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: { 
        blobContentType: file.type 
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

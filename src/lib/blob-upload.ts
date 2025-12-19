'use client';

import { v4 as uuidv4 } from 'uuid';

export async function uploadImageToBlob(
  file: File,
  userId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    const data = await response.json();
    return { success: true, url: data.url };
  } catch (error: any) {
    console.error('Failed to upload image:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to upload image' 
    };
  }
}

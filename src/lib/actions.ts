
'use server';

import { z } from 'zod';
import { refineNutritionalAnalysis } from '@/ai/flows/refine-nutritional-analysis';
import type { NutritionalAnalysis, HistoryEntry, UserGoals } from './types';
import { CosmosClient } from '@azure/cosmos';
import { BlobServiceClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';


// Azure Cosmos DB and Blob Storage Configuration
const cosmosEndpoint = process.env.AZURE_COSMOS_DB_ENDPOINT!;
const cosmosKey = process.env.AZURE_COSMOS_DB_KEY!;
const cosmosDatabaseId = process.env.AZURE_COSMOS_DB_DATABASE_ID!;
const cosmosContainerId = process.env.AZURE_COSMOS_DB_CONTAINER_ID!;

const blobConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const blobContainerName = process.env.AZURE_STORAGE_CONTAINER_NAME!;

const cosmosClient = new CosmosClient({ endpoint: cosmosEndpoint, key: cosmosKey });
const database = cosmosClient.database(cosmosDatabaseId);
const container = database.container(cosmosContainerId);

const blobServiceClient = BlobServiceClient.fromConnectionString(blobConnectionString);
const containerClient = blobServiceClient.getContainerClient(blobContainerName);

async function uploadImageToBlob(imageUri: string, userId: string): Promise<string> {
    const blobName = `${userId}/${uuidv4()}.jpg`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    const base64Data = imageUri.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: { blobContentType: 'image/jpeg' }
    });
  
    return blockBlobClient.url;
}

export async function commitToJourney(
  analysis: NutritionalAnalysis,
  imageUri: string | null,
  date: Date,
  userId: string,
  docId?: string
): Promise<{ success: boolean; message: string }> {
  try {
    let imageUrl = imageUri;
    // Only upload if the image is a new base64 image
    if (imageUri && imageUri.startsWith('data:image')) {
        imageUrl = await uploadImageToBlob(imageUri, userId);
    }

    const entryToSave: Omit<HistoryEntry, 'id'> & { id?: string, userId: string } = {
      userId,
      analysis: analysis,
      imageUrl: imageUrl || '',
      timestamp: date.toISOString(),
    };

    if (docId) {
        entryToSave.id = docId;
        await container.item(docId, userId).replace(entryToSave);
    } else {
        entryToSave.id = uuidv4();
        await container.items.create(entryToSave);
    }

    return { success: true, message: 'Meal logged successfully!' };
  } catch (error: any) {
    console.error('Failed to commit to journey', error);
    return { success: false, message: error.message || 'Failed to log meal.' };
  }
}

export async function getHistory(userId: string): Promise<HistoryEntry[]> {
    if (!userId) return [];
  
    try {
      const querySpec = {
        query: "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.timestamp DESC",
        parameters: [
          {
            name: "@userId",
            value: userId
          }
        ]
      };
  
      const { resources: items } = await container.items.query(querySpec).fetchAll();
      return items as HistoryEntry[];
    } catch (error) {
      console.error('Failed to fetch history from Cosmos DB', error);
      return [];
    }
}

export async function getGoals(userId: string): Promise<UserGoals | null> {
    const blobName = `${userId}/goals.json`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    try {
        const downloadBlockBlobResponse = await blockBlobClient.download(0);
        const downloaded = await streamToBuffer(downloadBlockBlobResponse.readableStreamBody);
        return JSON.parse(downloaded.toString());
    } catch (error: any) {
        if (error.statusCode === 404) {
            return null; // Goals not set yet
        }
        console.error('Failed to fetch goals from Blob Storage', error);
        return null;
    }
}

export async function saveGoals(userId: string, goals: UserGoals): Promise<{success: boolean}> {
    const blobName = `${userId}/goals.json`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const data = JSON.stringify(goals);
    try {
        await blockBlobClient.upload(data, data.length);
        return { success: true };
    } catch (error) {
        console.error('Failed to save goals to Blob Storage', error);
        return { success: false };
    }
}

async function streamToBuffer(readableStream: NodeJS.ReadableStream | undefined): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        if (!readableStream) {
            return resolve(Buffer.alloc(0));
        }
        const chunks: Buffer[] = [];
        readableStream.on('data', (data: Buffer | string) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on('end', () => {
            resolve(Buffer.concat(chunks));
        });
        readableStream.on('error', reject);
    });
}

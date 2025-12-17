'use server';

import { z } from 'zod';
import { analyzeIndianFoodImage } from '@/ai/flows/analyze-indian-food-image';
import { refineNutritionalAnalysis } from '@/ai/flows/refine-nutritional-analysis';
import type { NutritionalAnalysis, RefinedNutritionalAnalysis, HistoryEntry } from './types';
import { CosmosClient } from '@azure/cosmos';
import { BlobServiceClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';


interface AnalysisState {
  error?: string | null;
  result?: NutritionalAnalysis | null;
}

const AnalyzeImageSchema = z.object({
  photoDataUri: z.string().min(1, 'Image data is required.'),
});

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


export async function analyzeImage(
  prevState: AnalysisState,
  formData: FormData
): Promise<AnalysisState> {
  const validatedFields = AnalyzeImageSchema.safeParse({
    photoDataUri: formData.get('photoDataUri'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.photoDataUri?.[0],
    };
  }

  try {
    const result = await analyzeIndianFoodImage({
      photoDataUri: validatedFields.data.photoDataUri,
    });
    return { result };
  } catch (e: any) {
    return { error: e.message || 'An unknown error occurred during analysis.' };
  }
}

interface RefinementState {
  error?: string | null;
  result?: RefinedNutritionalAnalysis | null;
}

const RefineAnalysisSchema = z.object({
  initialAnalysis: z.string().min(1),
  refinementInstructions: z
    .string()
    .min(1, 'Refinement instructions are required.'),
});

export async function refineAnalysis(
  prevState: RefinementState,
  formData: FormData
): Promise<RefinementState> {
  const validatedFields = RefineAnalysisSchema.safeParse({
    initialAnalysis: formData.get('initialAnalysis'),
    refinementInstructions: formData.get('refinementInstructions'),
  });

  if (!validatedFields.success) {
    return {
      error: 'Invalid input for refinement.',
    };
  }

  try {
    const result = await refineNutritionalAnalysis(validatedFields.data);
    return { result };
  } catch (e: any) {
    return {
      error: e.message || 'An unknown error occurred during refinement.',
    };
  }
}

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
  analysis: NutritionalAnalysis | RefinedNutritionalAnalysis,
  imageUri: string,
  date: Date,
  userId: string,
  docId?: string
) {
  try {
    const imageUrl = await uploadImageToBlob(imageUri, userId);

    const finalAnalysis =
      'refinedAnalysis' in analysis
        ? {
            dishes: ['Refined Meal'], // Placeholder as refinement might alter dishes
            estimatedNutritionalContent: analysis.refinedAnalysis,
            analysisNotes: 'Refined by user.',
          }
        : analysis;

    const entryToSave: Omit<HistoryEntry, 'id'> & { id?: string, userId: string } = {
      userId,
      analysis: finalAnalysis,
      imageUrl: imageUrl,
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

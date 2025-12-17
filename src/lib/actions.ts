'use server';

import { z } from 'zod';
import { analyzeIndianFoodImage } from '@/ai/flows/analyze-indian-food-image';
import { refineNutritionalAnalysis } from '@/ai/flows/refine-nutritional-analysis';
import type { NutritionalAnalysis, RefinedNutritionalAnalysis } from './types';

interface AnalysisState {
  error?: string | null;
  result?: NutritionalAnalysis | null;
}

const AnalyzeImageSchema = z.object({
  photoDataUri: z.string().min(1, 'Image data is required.'),
});

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
  refinementInstructions: z.string().min(1, 'Refinement instructions are required.'),
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
    return { error: e.message || 'An unknown error occurred during refinement.' };
  }
}

export async function commitToJourney(
  analysis: NutritionalAnalysis | RefinedNutritionalAnalysis,
  imageUri: string,
  date: Date
) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log('Committing to journey:', { analysis, imageUri, date });
  // TODO: Implement atomic write to a persistent database like Firebase Firestore
  // and upload the image to a storage service like Firebase Storage.
  //
  // Example with Firestore (you would need to set up Firebase in your project):
  //
  // import { db, storage } from '@/lib/firebase';
  // import { doc, setDoc } from 'firebase/firestore';
  // import { ref, uploadString } from 'firebase/storage';
  //
  // const logId = date.toISOString().split('T')[0];
  // const docRef = doc(db, 'nutritionLogs', logId);
  // const storageRef = ref(storage, `mealImages/${logId}.jpg`);
  //
  // try {
  //   await uploadString(storageRef, imageUri, 'data_url');
  //   const imageUrl = await getDownloadURL(storageRef);
  //   await setDoc(docRef, { ...analysis, imageUrl, date });
  //   return { success: true, message: 'Meal logged successfully!' };
  // } catch (error) {
  //   console.error("Failed to commit to journey", error);
  //   return { success: false, message: 'Failed to log meal.' };
  // }
  
  return { success: true, message: 'Meal logged successfully!' };
}

'use server';

import { z } from 'zod';
import { analyzeIndianFoodImage } from '@/ai/flows/analyze-indian-food-image';
import { refineNutritionalAnalysis } from '@/ai/flows/refine-nutritional-analysis';
import type { NutritionalAnalysis, RefinedNutritionalAnalysis } from './types';
import { initializeFirebase } from '@/firebase';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';

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

export async function commitToJourney(
  analysis: NutritionalAnalysis | RefinedNutritionalAnalysis,
  imageUri: string,
  date: Date,
  userId: string,
  docId?: string
) {
  try {
    const { firestore } = initializeFirebase();
    const historyCollection = collection(firestore, 'users', userId, 'history');
    const docRef = docId ? doc(historyCollection, docId) : doc(historyCollection);
    
    // In a real app, you'd upload the image to Firebase Storage and get a URL
    // For now, we'll store the data URI directly, which is not recommended for production
    const finalAnalysis =
      'refinedAnalysis' in analysis
        ? {
            // This is a bit of a hack, we should ideally be able to get the full analysis object after refinement
            dishes: ['Refined Meal'],
            estimatedNutritionalContent: analysis.refinedAnalysis,
            analysisNotes: 'Refined by user.',
          }
        : analysis;

    await setDoc(docRef, {
      id: docRef.id,
      analysis: finalAnalysis,
      imageUrl: imageUri, // In production, this should be a gs:// or https:// URL from Firebase Storage
      timestamp: date.toISOString(),
      updatedAt: serverTimestamp(),
    });

    return { success: true, message: 'Meal logged successfully!' };
  } catch (error: any) {
    console.error('Failed to commit to journey', error);
    return { success: false, message: error.message || 'Failed to log meal.' };
  }
}

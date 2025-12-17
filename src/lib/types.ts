
import { z } from 'zod';

export type MacroNutrients = {
  protein: number;
  carbs: number;
  fat: number;
};

export type AnalysisItem = {
  name: string;
  weight_g: number;
  calories: number;
  macros: MacroNutrients;
};

export type NutritionalAnalysis = {
  items: AnalysisItem[];
  total_calories: number;
  total_macros: MacroNutrients;
  confidence_score: number;
  food_type: 'prepared' | 'packaged';
  summary: string;
};

export type RefinedNutritionalAnalysis = {
  refinedAnalysis: NutritionalAnalysis;
  responseText: string;
};

export type HistoryEntry = {
  id: string;
  userId: string;
  timestamp: string;
  analysis: NutritionalAnalysis;
  imageUrl: string;
  mode?: 'meal' | 'barcode' | 'text';
  textInput?: string;
};

export type ChatMessage = {
  role: 'user' | 'model';
  text: string;
};

export type UserGoals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

// Insights Flow Types
const BMRSchema = z.object({
    bmr: z.number(),
    maintenanceCalories: z.number(),
});

const PlanSchema = z.object({
    planName: z.string(),
    targetCalories: z.number(),
    targetProtein: z.number(),
    targetCarbs: z.number(),
    targetFat: z.number(),
    description: z.string()
});

export const GenerateInsightsOutputSchema = z.object({
  keyObservations: z.array(z.string()),
  calorieTrendAnalysis: z.string(),
  macroDistributionAnalysis: z.string(),
  bmrAndMaintenance: BMRSchema.optional(),
  suggestedPlans: z.array(PlanSchema).optional(),
});

export const GenerateInsightsInputSchema = z.object({
  history: z.array(z.any()), // Simplified for brevity, use a Zod schema in production
  goals: z.any(),
  calculationRequest: z.object({
      weight: z.number(),
      height: z.number(),
      age: z.number(),
      gender: z.enum(['male', 'female']),
      activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
    }).optional(),
});

export type GenerateInsightsInput = z.infer<typeof GenerateInsightsInputSchema>;
export type GenerateInsightsOutput = z.infer<typeof GenerateInsightsOutputSchema>;

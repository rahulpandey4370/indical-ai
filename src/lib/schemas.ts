import { z } from 'zod';

export const MacroNutrientsSchema = z.object({
  protein: z.number().describe('Protein in grams.'),
  carbs: z.number().describe('Carbohydrates in grams.'),
  fat: z.number().describe('Fat in grams.'),
});

export const AnalysisItemSchema = z.object({
  name: z.string().describe('Specific food item name (e.g., Masala Omelette).'),
  weight: z.number().describe('Estimated weight or volume of the item.'),
  unit: z.enum(['g', 'ml']).describe("Unit of measurement, either 'g' for grams or 'ml' for milliliters."),
  calories: z.number().describe('Estimated calories for the item.'),
  macros: MacroNutrientsSchema.describe('Macronutrient breakdown for the item.'),
});

export const AnalyzeIndianFoodImageOutputSchema = z.object({
  items: z.array(AnalysisItemSchema).describe('Array of individual food items detected.'),
  total_calories: z.number().describe('Total estimated calories for the entire meal.'),
  total_macros: MacroNutrientsSchema.describe('Total macronutrients for the meal.'),
  confidence_score: z.number().min(0).max(1).describe('A score from 0 to 1 indicating the AI\'s confidence in the analysis.'),
  food_type: z.enum(['prepared', 'packaged']).describe('Type of food.'),
  summary: z.string().describe('A short, engaging summary of all items found.'),
});

export const AnalyzeIndianFoodImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .optional()
    .describe(
      "A photo of an Indian meal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  textInput: z.string().optional().describe('A text description of the meal.'),
  mode: z.enum(['meal', 'barcode', 'text']).describe('The analysis mode.'),
});

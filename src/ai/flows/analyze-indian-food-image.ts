
'use server';
/**
 * @fileOverview Analyzes an image of Indian food to identify dishes and estimate nutritional content.
 *
 * - analyzeIndianFoodImage - A function that handles the image analysis process.
 * - AnalyzeIndianFoodImageInput - The input type for the analyzeIndianFoodImage function.
 * - AnalyzeIndianFoodImageOutput - The return type for the analyzeIndianFoodImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { AnalyzeIndianFoodImageOutputSchema, AnalyzeIndianFoodImageInputSchema } from '@/lib/schemas';

export type AnalyzeIndianFoodImageInput = z.infer<typeof AnalyzeIndianFoodImageInputSchema>;
export type AnalyzeIndianFoodImageOutput = z.infer<typeof AnalyzeIndianFoodImageOutputSchema>;

export async function analyzeIndianFoodImage(
  input: AnalyzeIndianFoodImageInput
): Promise<AnalyzeIndianFoodImageOutput> {
  return analyzeIndianFoodImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeIndianFoodImagePrompt',
  input: {schema: z.object({
    photoDataUri: z.string().optional(),
    textInput: z.string().optional(),
    isMealMode: z.boolean().optional(),
    isBarcodeMode: z.boolean().optional(),
    isTextMode: z.boolean().optional(),
  })},
  output: {schema: AnalyzeIndianFoodImageOutputSchema},
  prompt: `
    You are an expert Indian nutritionist. Your task is to analyze the provided input and return a detailed nutritional breakdown in JSON format.

    {{#if isMealMode}}
      You are analyzing a photo of a meal.
      - Your primary goal is to identify every single food item in the image.
      - For each item, provide its name, estimated weight in grams, estimated calories, and macronutrient breakdown (protein, carbs, fat).
      - Sum up the totals for all items.
      - Provide a confidence score between 0 and 1.
      - Set 'food_type' to "prepared".
      - Write a short, engaging summary of the items you identified.
      
      CRITICAL INSTRUCTION: You MUST break down the meal into its INDIVIDUAL separate items. 
      DO NOT group them into a single entry like "Thali" or "Meal Plate". 
      For example, if you see a plate with an egg curry, rice, and a roti:
      - Item 1: Egg Curry (e.g., 2 eggs in gravy, approx 150g)
      - Item 2: Steamed Rice (approx 100g)
      - Item 3: Roti (approx 35g)
      
      Every single distinct piece of food must be its own object in the "items" array with its own estimated calories and macros based on standard Indian portion sizes.

      Image to analyze:
      {{media url=photoDataUri}}

    {{else if isBarcodeMode}}
      You are analyzing a photo of a packaged food product with a barcode.
      - Identify the product name from the packaging.
      - Extract all available nutrition information from the nutrition label.
      - If a serving size is given, use that for the calculation. Otherwise, estimate a standard serving.
      - Your response should contain only ONE item in the "items" array.
      - Set 'food_type' to "packaged".
      
      Image to analyze:
      {{media url=photoDataUri}}

    {{else if isTextMode}}
      You are analyzing a meal described in text.
      - Your primary goal is to parse the text and identify every individual food item mentioned.
      - For each item, provide its name, estimated weight, calories, and macros.
      - Calculate the totals for all identified items.
      - Set 'food_type' to "prepared".

      CRITICAL INSTRUCTION: Break down the text into separate individual food items. 
      For example, if the input is "2 rotis and an egg", you should create:
      - Item 1: Roti (with quantity 2 reflected in the weight/calories)
      - Item 2: Egg (with quantity 1)
      
      Text to analyze: "{{{textInput}}}"

    {{/if}}

    You must ALWAYS return a valid JSON object that strictly follows the provided output schema. Do not include any extra text or explanations outside of the JSON structure.
  `,
});

const analyzeIndianFoodImageFlow = ai.defineFlow(
  {
    name: 'analyzeIndianFoodImageFlow',
    inputSchema: AnalyzeIndianFoodImageInputSchema,
    outputSchema: AnalyzeIndianFoodImageOutputSchema,
  },
  async input => {
    const {output} = await prompt({
      photoDataUri: input.photoDataUri,
      textInput: input.textInput,
      isMealMode: input.mode === 'meal',
      isBarcodeMode: input.mode === 'barcode',
      isTextMode: input.mode === 'text',
    });
    if (!output) {
      throw new Error("An unexpected response was received from the server.");
    }
    return output;
  }
);

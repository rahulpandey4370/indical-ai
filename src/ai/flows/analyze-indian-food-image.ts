
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
    You are an expert Indian nutritionist. Analyze the provided input.
    
    {{#if isBarcodeMode}}
      You are analyzing an image of a packaged food product barcode.
      1. Identify the product name from the packaging.
      2. Extract nutrition information per serving from the label.
      Return strictly JSON using the provided output schema. Set food_type to "packaged".
      Image: {{media url=photoDataUri}}
    {{else if isMealMode}}
      You are an expert Indian nutritionist analyzing a food image.
      
      CRITICAL INSTRUCTION: You MUST break down the meal into its INDIVIDUAL separate items. 
      DO NOT group them into a single entry like "Meal" or "Plate". 
      For example, if you see a plate with an egg and a roti:
      - Item 1: Fried Egg (approx 50g)
      - Item 2: Roti (approx 35g)
      
      Every single piece of food must be its own object in the "items" array with its own estimated calories and macros based on standard Indian portion sizes.
      Calculate the totals based on the individual items.

      Return strictly JSON using the provided output schema. Set food_type to "prepared".
      Image: {{media url=photoDataUri}}
    {{else if isTextMode}}
      You are analyzing this meal description: "{{{textInput}}}".
      
      CRITICAL: Break down the text into separate individual food items. 
      Example: "2 rotis and an egg" -> Item 1: Roti (Quantity: 2), Item 2: Egg (Quantity: 1).
      Calculate calories and macros for each item individually and then sum them for the totals.
      
      Return strictly JSON using the provided output schema. Set food_type to "prepared".
    {{/if}}
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
      throw new Error("Analysis failed to produce an output.");
    }
    return output;
  }
);

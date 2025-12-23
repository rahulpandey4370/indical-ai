
'use server';
/**
 * @fileOverview Analyzes an image of Indian food to identify dishes and estimate nutritional content.
 *
 * - analyzeIndianFoodImage - A function that handles the image analysis process.
 * - AnalyzeIndianFoodImageInput - The input type for the analyzeIndianFoodImage function.
 * - AnalyzeIndianFoodImageOutput - The return type for the analyzeIndianFoodImage function.
 */

import { configureAi } from '@/ai/genkit';
import { ai } from '@/ai/index';
import {z} from 'genkit';
import { AnalyzeIndianFoodImageOutputSchema, AnalyzeIndianFoodImageInputSchema } from '@/lib/schemas';
import { ModelId } from '@/lib/types';

export type AnalyzeIndianFoodImageInput = z.infer<typeof AnalyzeIndianFoodImageInputSchema>;
export type AnalyzeIndianFoodImageOutput = z.infer<typeof AnalyzeIndianFoodImageOutputSchema>;

export async function analyzeIndianFoodImage(
  input: AnalyzeIndianFoodImageInput,
<<<<<<< HEAD
  modelId: string,
): Promise<AnalyzeIndianFoodImageOutput> {
  await configureAi(modelId);
  return analyzeIndianFoodImageFlow(input);
}


const analyzeIndianFoodImagePrompt = ai.definePrompt({
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

      CRITICAL INSTRUCTIONS FOR ALL MODES:
      - For each item, you MUST provide its name, estimated weight/volume, unit ('g' for solids, 'ml' for liquids), estimated calories, and a full macronutrient breakdown (protein, carbs, fat).
      - Always sum up the totals for all items.
      - For the 'summary' field, you MUST generate a short, descriptive name for the meal, ideally 2-3 words, and a maximum of 5 words. (e.g., "Chicken Curry Lunch", "Morning Tea & Biscuits"). Do NOT write a long sentence.

      {{#if isMealMode}}
        You are analyzing a photo of a meal.
        - Your primary goal is to identify every single food item in the image.
        - CRITICAL: You MUST break down the meal into its INDIVIDUAL separate items. Do not group them. For example, a thali with egg curry, rice, and roti should have three separate items in the 'items' array.
        - To improve quantity estimation, use visual cues. For example, estimate the volume of curries or dals based on the size of the bowl (assume a standard Indian 'katori' is about 150ml). For rice, consider how much of the plate it covers. For items like roti or paratha, count them.
        - Set 'food_type' to "prepared".
        
        Image to analyze:
        {{media url=photoDataUri}}

      {{else if isBarcodeMode}}
        You are analyzing a photo of a packaged food product with a barcode.
        - Identify the product name from the packaging.
        - Extract all available nutrition information from the nutrition label.
        - Your response should contain only ONE item in the "items" array.
        - Set 'food_type' to "packaged".
        
        Image to analyze:
        {{media url=photoDataUri}}

      {{else if isTextMode}}
        You are analyzing a meal described in text.
        - The user may describe a single meal or multiple meals (e.g., "for breakfast I had..., for lunch I had...").
        - Your primary goal is to parse the text and identify every individual food item mentioned across all meals.
        - Each distinct item should be a separate object in the "items" array.
        - For example, if the input is "2 rotis and an egg", you should create two items: one for "Roti" (with quantity 2 reflected in the weight/calories) and one for "Egg".
        - Set 'food_type' to "prepared".

        Text to analyze: "{{{textInput}}}"

      {{/if}}

      You must ALWAYS return a valid JSON object that strictly follows the provided output schema. Do not include any extra text or explanations outside of the JSON structure.
    `,
  });
=======
  modelId: ModelId
): Promise<AnalyzeIndianFoodImageOutput> {
  return analyzeIndianFoodImageFlow(input, { context: { modelId } });
}

const promptTemplate = `
You are an expert Indian nutritionist. Your task is to analyze the provided input and return a detailed nutritional breakdown in JSON format.

CRITICAL INSTRUCTIONS FOR ALL MODES:
- For each item, you MUST provide its name, estimated weight/volume, unit ('g' for solids, 'ml' for liquids), estimated calories, and a full macronutrient breakdown (protein, carbs, fat).
- Always sum up the totals for all items.
- For the 'summary' field, you MUST generate a short, descriptive name for the meal, ideally 2-3 words, and a maximum of 5 words. (e.g., "Chicken Curry Lunch", "Morning Tea & Biscuits"). Do NOT write a long sentence.

{{#if isMealMode}}
  You are analyzing a photo of a meal.
  - Your primary goal is to identify every single food item in the image.
  - CRITICAL: You MUST break down the meal into its INDIVIDUAL separate items. Do not group them. For example, a thali with egg curry, rice, and roti should have three separate items in the 'items' array.
  - To improve quantity estimation, use visual cues. For example, estimate the volume of curries or dals based on the size of the bowl (assume a standard Indian 'katori' is about 150ml). For rice, consider how much of the plate it covers. For items like roti or paratha, count them.
  - Set 'food_type' to "prepared".
  
  Image to analyze:
  {{media url=photoDataUri}}

{{else if isBarcodeMode}}
  You are analyzing a photo of a packaged food product with a barcode.
  - Identify the product name from the packaging.
  - Extract all available nutrition information from the nutrition label.
  - Your response should contain only ONE item in the "items" array.
  - Set 'food_type' to "packaged".
  
  Image to analyze:
  {{media url=photoDataUri}}

{{else if isTextMode}}
  You are analyzing a meal described in text.
  - The user may describe a single meal or multiple meals (e.g., "for breakfast I had..., for lunch I had...").
  - Your primary goal is to parse the text and identify every individual food item mentioned across all meals.
  - Each distinct item should be a separate object in the "items" array.
  - For example, if the input is "2 rotis and an egg", you should create two items: one for "Roti" (with quantity 2 reflected in the weight/calories) and one for "Egg".
  - Set 'food_type' to "prepared".

  Text to analyze: "{{{textInput}}}"

{{/if}}

You must ALWAYS return a valid JSON object that strictly follows the provided output schema. Do not include any extra text or explanations outside of the JSON structure.
`;
>>>>>>> 052caa3 (Can you please at a 3 dot button to the right most side of the dock whic)

const analyzeIndianFoodImageFlow = ai.defineFlow(
  {
    name: 'analyzeIndianFoodImageFlow',
    inputSchema: AnalyzeIndianFoodImageInputSchema,
    outputSchema: AnalyzeIndianFoodImageOutputSchema,
  },
<<<<<<< HEAD
  async (input) => {
    const {output} = await analyzeIndianFoodImagePrompt({
=======
  async (input, { context }) => {
    const modelId = context?.modelId || 'gemini-2.5-flash';
    const model = `googleai/${modelId}`;

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
        prompt: promptTemplate,
        config: {
            model,
        }
      });
      
    const {output} = await prompt({
>>>>>>> 052caa3 (Can you please at a 3 dot button to the right most side of the dock whic)
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

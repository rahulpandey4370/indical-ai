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

const AnalyzeIndianFoodImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of an Indian meal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  analysisRefinementInstructions: z
    .string()
    .optional()
    .describe("Optional instructions to refine the AI's analysis, specified in natural language."),
});
export type AnalyzeIndianFoodImageInput = z.infer<typeof AnalyzeIndianFoodImageInputSchema>;

const AnalyzeIndianFoodImageOutputSchema = z.object({
  dishes: z.array(z.string()).describe('List of identified Indian dishes.'),
  estimatedNutritionalContent: z
    .string()
    .describe('Estimated nutritional content of the meal.'),
  analysisNotes: z.string().optional().describe('Any additional notes from the analysis.'),
});
export type AnalyzeIndianFoodImageOutput = z.infer<typeof AnalyzeIndianFoodImageOutputSchema>;

export async function analyzeIndianFoodImage(
  input: AnalyzeIndianFoodImageInput
): Promise<AnalyzeIndianFoodImageOutput> {
  return analyzeIndianFoodImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeIndianFoodImagePrompt',
  input: {schema: AnalyzeIndianFoodImageInputSchema},
  output: {schema: AnalyzeIndianFoodImageOutputSchema},
  prompt: `You are an expert in Indian cuisine and nutrition.

You will analyze the image of the Indian meal and identify the dishes present.
Then, you will estimate the nutritional content of the meal based on your knowledge of Indian food and typical portion sizes.

Use the following as the primary source of information about the meal:

Image: {{media url=photoDataUri}}

{% if analysisRefinementInstructions %}
Analysis Refinement Instructions: {{{analysisRefinementInstructions}}}
{% endif %}

Dishes: output a list of the dishes you identified.
Nutritional Content: provide a detailed estimation of the nutritional content of the meal.
Analysis Notes: Include any additional notes or observations about the meal or your analysis.
`,
});

const analyzeIndianFoodImageFlow = ai.defineFlow(
  {
    name: 'analyzeIndianFoodImageFlow',
    inputSchema: AnalyzeIndianFoodImageInputSchema,
    outputSchema: AnalyzeIndianFoodImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

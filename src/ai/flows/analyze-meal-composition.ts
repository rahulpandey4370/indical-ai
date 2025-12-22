
'use server';
/**
 * @fileOverview Analyzes the composition of a single meal for nutritional balance.
 *
 * - analyzeMealComposition - A function that handles the meal analysis.
 * - AnalyzeMealCompositionInput - The input type for the function.
 * - AnalyzeMealCompositionOutput - The return type for the function.
 */

import { configureAi } from '@/ai/genkit';
import { z } from 'genkit';
import { AnalyzeMealCompositionInputSchema, AnalyzeMealCompositionOutputSchema } from '@/lib/schemas';

export type AnalyzeMealCompositionInput = z.infer<typeof AnalyzeMealCompositionInputSchema>;
export type AnalyzeMealCompositionOutput = z.infer<typeof AnalyzeMealCompositionOutputSchema>;

export async function analyzeMealComposition(
  input: AnalyzeMealCompositionInput,
  modelId: string,
): Promise<AnalyzeMealCompositionOutput> {
  return analyzeMealCompositionFlow(input, modelId);
}

const analyzeMealCompositionFlow = async (
  input: AnalyzeMealCompositionInput,
  modelId: string,
) => {
  const ai = await configureAi(modelId);

  const prompt = await ai.definePrompt({
    name: 'analyzeMealCompositionPrompt',
    input: { schema: AnalyzeMealCompositionInputSchema },
    output: { schema: AnalyzeMealCompositionOutputSchema },
    prompt: `
      You are an expert Indian nutritionist. Your task is to analyze a single meal's composition and provide clear, actionable feedback, including a detailed nutrient breakdown.
      The user's total daily goals are provided for context, but your primary focus is on the quality and balance of THIS specific meal, considering it's a {{mealType}}.
      A typical Indian {{mealType}} should be balanced. For example, breakfast should have a good amount of protein, lunch should be substantial and balanced, and dinner should be lighter.

      User's Daily Goals:
      - Calories: {{{userGoals.calories}}}
      - Protein: {{{userGoals.protein}}}g
      - Carbs: {{{userGoals.carbs}}}g
      - Fat: {{{userGoals.fat}}}g

      Meal to Analyze ({{mealType}}):
      This meal consists of the following logged items:
      {{{json mealEntries}}}

      Analysis Steps:
      1.  **Calculate Totals**: Sum up the total calories, protein, carbs, and fat for the entire meal from the entries provided.
      2.  **Estimate Micronutrients**: Based on the items in the meal, provide a reasonable *estimate* for the following key micronutrients: Vitamin C (mg), Vitamin D (IU), Vitamin B12 (mcg), Iron (mg), and Magnesium (mg).
      3.  **Assess Balance**: Evaluate the macronutrient distribution for a {{mealType}}. Is it protein-heavy? Carb-dominant? Is there a good mix of nutrients?
      4.  **Identify Positives**: Find what's good about the meal. You MUST provide at least one positive point in 'whatWentWell'.
      5.  **Identify Weaknesses**: Where can it be improved? You MUST provide at least one specific area for improvement in 'areasForImprovement'.
      6.  **Rate the Meal**: Give a rating from 1-10 on how well-balanced this meal is for a {{mealType}}.
      7.  **Generate Output**: Create a concise and encouraging JSON response. Populate the 'detailedNutrients' array with the total Calories, Protein, Carbs, Fat, and the estimated values for Vitamin C, Vitamin D, Vitamin B12, Iron, and Magnesium.
    `,
  });

  const { output } = await prompt(input);
  if (!output) {
    throw new Error("Meal composition analysis failed to produce an output.");
  }
  return output;
};

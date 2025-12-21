'use server';
/**
 * @fileOverview Analyzes the composition of a single meal for nutritional balance.
 *
 * - analyzeMealComposition - A function that handles the meal analysis.
 * - AnalyzeMealCompositionInput - The input type for the function.
 * - AnalyzeMealCompositionOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { AnalyzeMealCompositionInputSchema, AnalyzeMealCompositionOutputSchema } from '@/lib/schemas';


export type AnalyzeMealCompositionInput = z.infer<typeof AnalyzeMealCompositionInputSchema>;
export type AnalyzeMealCompositionOutput = z.infer<typeof AnalyzeMealCompositionOutputSchema>;

export async function analyzeMealComposition(
  input: AnalyzeMealCompositionInput
): Promise<AnalyzeMealCompositionOutput> {
  return analyzeMealCompositionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeMealCompositionPrompt',
  input: { schema: AnalyzeMealCompositionInputSchema },
  output: { schema: AnalyzeMealCompositionOutputSchema },
  prompt: `
    You are an expert Indian nutritionist. Your task is to analyze a single meal's composition and provide clear, actionable feedback.
    The user's total daily goals are provided for context, but your primary focus is on the quality and balance of THIS specific meal, considering it's a {{mealType}}.
    A typical Indian {{mealType}} should be balanced. For example, breakfast should have a good amount of protein, lunch should be substantial and balanced, and dinner should be lighter.

    User's Daily Goals:
    - Calories: {{{userGoals.calories}}}
    - Protein: {{{userGoals.protein}}}g
    - Carbs: {{{userGoals.carbs}}}g
    - Fat: {{{userGoals.fat}}}g

    Meal to Analyze ({{mealType}}):
    {{{json mealEntries}}}

    Analysis Steps:
    1.  **Assess Balance**: Evaluate the macronutrient distribution for a {{mealType}}. Is it protein-heavy? Carb-dominant? Is there a good mix of nutrients?
    2.  **Identify Positives**: Find what's good. Did they include a protein source? Are there vegetables? Acknowledge this in 'whatWentWell'.
    3.  **Identify Weaknesses**: Where can it be improved? Is it too high in fat for dinner? Lacking protein for a post-workout meal? Note this in 'areasForImprovement'. Be specific (e.g., "Consider adding a source of protein like paneer or dal to your lunch.").
    4.  **Rate the Meal**: Give a rating from 1-10 on how well-balanced this meal is for a {{mealType}}.
    5.  **Generate Output**: Create a concise and encouraging JSON response.
  `,
});

const analyzeMealCompositionFlow = ai.defineFlow(
  {
    name: 'analyzeMealCompositionFlow',
    inputSchema: AnalyzeMealCompositionInputSchema,
    outputSchema: AnalyzeMealCompositionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("Meal composition analysis failed to produce an output.");
    }
    return output;
  }
);

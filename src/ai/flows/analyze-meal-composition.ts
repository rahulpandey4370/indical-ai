
'use server';
/**
 * @fileOverview Analyzes the composition of a single meal for nutritional balance.
 *
 * - analyzeMealComposition - A function that handles the meal analysis.
 * - AnalyzeMealCompositionInput - The input type for the function.
 * - AnalyzeMealCompositionOutput - The return type for the function.
 */

import { configureAi } from '@/ai/genkit';
import { ai } from '@/ai/index';
import { z } from 'genkit';
import { AnalyzeMealCompositionInputSchema, AnalyzeMealCompositionOutputSchema } from '@/lib/schemas';
import { ModelId } from '@/lib/types';

export type AnalyzeMealCompositionInput = z.infer<typeof AnalyzeMealCompositionInputSchema>;
export type AnalyzeMealCompositionOutput = z.infer<typeof AnalyzeMealCompositionOutputSchema>;

export async function analyzeMealComposition(
  input: AnalyzeMealCompositionInput,
<<<<<<< HEAD
  modelId: string,
): Promise<AnalyzeMealCompositionOutput> {
  await configureAi(modelId);
  return analyzeMealCompositionFlow(input);
}

const analyzeMealCompositionPrompt = ai.definePrompt({
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
=======
  modelId: ModelId,
): Promise<AnalyzeMealCompositionOutput> {
  return analyzeMealCompositionFlow(input, { context: { modelId } });
}

const geminiPromptTemplate = `
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
`;
>>>>>>> 052caa3 (Can you please at a 3 dot button to the right most side of the dock whic)

<<<<<<< HEAD
const analyzeMealCompositionFlow = ai.defineFlow({
=======
const gemmaPromptTemplate = `${geminiPromptTemplate}
You MUST only output a single, raw JSON object and NOTHING else. Do not wrap it in markdown backticks or any other text.`;


const analyzeMealCompositionFlow = ai.defineFlow(
  {
>>>>>>> a37319f (Failed to fetch from https://generativelanguage.googleapis.com/v1beta/mo)
    name: 'analyzeMealCompositionFlow',
    inputSchema: AnalyzeMealCompositionInputSchema,
    outputSchema: AnalyzeMealCompositionOutputSchema,
<<<<<<< HEAD
}, async (input) => {
  const { output } = await analyzeMealCompositionPrompt(input);
  if (!output) {
    throw new Error("Meal composition analysis failed to produce an output.");
=======
  },
  async (input, { context }) => {
    const modelId = context?.modelId || 'gemini-2.5-flash';
    const model = `googleai/${modelId}`;
    
    if (modelId.startsWith('gemma')) {
        const llmResponse = await ai.generate({
            prompt: gemmaPromptTemplate,
            model,
            promptParams: input,
        });
        const rawJson = llmResponse.text;
        const parsed = JSON.parse(rawJson);
        return AnalyzeMealCompositionOutputSchema.parse(parsed);

    } else { // Is a Gemini model
        const prompt = ai.definePrompt({
          name: 'analyzeMealCompositionPrompt',
          input: { schema: AnalyzeMealCompositionInputSchema },
          output: { schema: AnalyzeMealCompositionOutputSchema },
          prompt: geminiPromptTemplate,
          model,
        });

        const { output } = await prompt(input);
        if (!output) {
          throw new Error("Meal composition analysis failed to produce an output.");
        }
        return output;
    }
<<<<<<< HEAD
    return output;
>>>>>>> 052caa3 (Can you please at a 3 dot button to the right most side of the dock whic)
=======
>>>>>>> a37319f (Failed to fetch from https://generativelanguage.googleapis.com/v1beta/mo)
  }
  return output;
});

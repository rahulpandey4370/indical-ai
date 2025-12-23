
'use server';
/**
 * @fileOverview Generates nutritional insights and recommendations based on user history and goals.
 */

import { ai } from '@/ai/index';
import { z } from 'genkit';
import { ModelId } from '@/lib/types';
import { AnalysisItemSchema } from '@/lib/schemas';
import { callAzureOpenAI } from '@/lib/azure-openai';

const BMRSchema = z.object({
    bmr: z.number().describe("The user's Basal Metabolic Rate (BMR) in calories per day."),
    maintenanceCalories: z.number().describe("The user's estimated daily maintenance calories."),
});

const PlanSchema = z.object({
    planName: z.string().describe("Name of the plan (e.g., 'Weight Loss', 'Muscle Gain')."),
    targetCalories: z.number().describe("Target daily calories for this plan."),
    targetProtein: z.number().describe("Target daily protein in grams."),
    targetCarbs: z.number().describe("Target daily carbohydrates in grams."),
    targetFat: z.number().describe("Target daily fat in grams."),
    description: z.string().describe("A brief, encouraging description of the plan.")
});


const GenerateInsightsInputSchema = z.object({
  history: z.array(z.object({ // Simplified HistoryEntry for the prompt
      timestamp: z.string(),
      analysis: z.object({
          total_calories: z.number(),
          total_macros: z.object({
              protein: z.number(),
              carbs: z.number(),
              fat: z.number(),
          }),
          items: z.array(AnalysisItemSchema),
      }),
  })).describe("The user's recent meal history."),
  goals: z.object({ // Simplified UserGoals
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
  }).describe("The user's current daily nutritional goals."),
   calculationRequest: z.object({
      weight: z.number(),
      height: z.number(),
      age: z.number(),
      gender: z.enum(['male', 'female']),
      activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
    }).optional().describe("User's physical details to calculate BMR and maintenance calories."),

});

const GenerateInsightsOutputSchema = z.object({
  keyObservations: z.array(z.string()).describe("A list of 2-3 key, actionable observations from the user's eating habits."),
  calorieTrendAnalysis: z.string().describe("A brief analysis of the user's calorie intake trend over the period."),
  macroDistributionAnalysis: z.string().describe("A brief analysis of the user's average macronutrient distribution."),
  bmrAndMaintenance: BMRSchema.optional().describe("BMR and maintenance calorie calculations, if requested."),
  suggestedPlans: z.array(PlanSchema).optional().describe("A few suggested calorie/macro plans for different goals (e.g., deficit, surplus)."),
});

export type GenerateInsightsInput = z.infer<typeof GenerateInsightsInputSchema>;
export type GenerateInsightsOutput = z.infer<typeof GenerateInsightsOutputSchema>;

export async function generateInsights(
  input: GenerateInsightsInput,
  modelId: ModelId
): Promise<GenerateInsightsOutput> {
  return generateInsightsFlow(input, { context: { modelId } });
}


const universalPromptTemplate = `
You are a master nutritionist and data analyst.
Your task is to analyze a user's meal history and provide actionable insights.
Be encouraging, positive, and focus on simple, effective advice.

CRITICAL INSTRUCTIONS:
- You must ALWAYS return a valid JSON object that strictly follows the provided output schema. Do not include any extra text or explanations outside of the JSON structure.
- The final JSON must look like this:
  {
    "keyObservations": ["Observation 1", "Observation 2"],
    "calorieTrendAnalysis": "A summary of calorie trends.",
    "macroDistributionAnalysis": "A summary of macro distribution."
  }
- If 'calculationRequest' is provided, the output MUST also include 'bmrAndMaintenance' and 'suggestedPlans'.

User's current goals:
- Calories: {{{goals.calories}}}
- Protein: {{{goals.protein}}}g
- Carbs: {{{goals.carbs}}}g
- Fat: {{{goals.fat}}}g

User's meal history:
{{{json history}}}

{{#if calculationRequest}}
The user has requested a calorie plan calculation. Here are their details:
- Weight: {{calculationRequest.weight}} kg
- Height: {{calculationRequest.height}} cm
- Age: {{calculationRequest.age}} years
- Gender: {{calculationRequest.gender}}
- Activity Level: {{calculationRequest.activityLevel}}

1.  Calculate BMR using the Mifflin-St Jeor equation:
    - Men: (10 * weight in kg) + (6.25 * height in cm) - (5 * age in years) + 5
    - Women: (10 * weight in kg) + (6.25 * height in cm) - (5 * age in years) - 161
2.  Calculate Maintenance Calories using these multipliers for the activity level:
    - sedentary: 1.2
    - light: 1.375
    - moderate: 1.55
    - active: 1.725
    - very_active: 1.9
3.  Based on the maintenance calories, create 3 suggested plans in the 'suggestedPlans' array:
    - A 'Weight Loss' plan with a 300-500 calorie deficit.
    - A 'Weight Maintenance' plan.
    - A 'Muscle Gain' plan with a 300-500 calorie surplus.
    - Adjust macros for each plan appropriately. Protein should be higher for muscle gain.
4.  Populate the 'bmrAndMaintenance' object with your calculations.
{{/if}}

Based on all the provided data, generate the final JSON output.
- Analyze the history to find trends (e.g., "Your protein is often lowest at breakfast").
- Provide a concise summary of calorie trends and macro distribution.
- Generate 2-3 key, actionable observations.
`;

const generateInsightsFlow = ai.defineFlow(
  {
    name: 'generateInsightsFlow',
    inputSchema: GenerateInsightsInputSchema,
    outputSchema: GenerateInsightsOutputSchema,
  },
  async (input, { context }) => {
    const modelId = context?.modelId || 'gemini-2.5-flash';
    
    let output;
    if (modelId === 'gpt-5.2-chat') {
        output = await callAzureOpenAI(universalPromptTemplate, input, GenerateInsightsOutputSchema);
    } else {
        const model = `googleai/${modelId}`;
        const prompt = ai.definePrompt({
            name: 'generateInsightsPrompt',
            input: { schema: GenerateInsightsInputSchema },
            output: { schema: GenerateInsightsOutputSchema },
            prompt: universalPromptTemplate,
        });
        const genkitResponse = await prompt(input, { model });
        output = genkitResponse.output;
    }

    if (!output) {
      throw new Error("Insight generation failed to produce an output.");
    }
    return output;
  }
);

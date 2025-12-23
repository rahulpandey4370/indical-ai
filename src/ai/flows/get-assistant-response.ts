
'use server';
import { configureAi } from '@/ai/genkit';
import { ai } from '@/ai/index';
import { z } from 'genkit';
import { HistoryEntry, UserGoals, ChatMessage, ModelId } from '@/lib/types'; // Assuming types are defined here

// Schemas for structured input/output
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  text: z.string(),
});

const GetAssistantResponseInputSchema = z.object({
  userMessage: z.string(),
  history: z.array(z.any()), // Using `any` for simplicity; ideally, define a Zod schema for HistoryEntry
  goals: z.any(), // Same as above for UserGoals
  chatHistory: z.array(ChatMessageSchema),
  currentDate: z.string(),
});

export type GetAssistantResponseInput = z.infer<typeof GetAssistantResponseInputSchema>;

export async function getAssistantResponse(
  input: GetAssistantResponseInput,
<<<<<<< HEAD
  modelId: string,
): Promise<string> {
  await configureAi(modelId);
  const flowResult = await getAssistantResponseFlow(input);
  return flowResult;
}

const getAssistantResponseFlow = ai.defineFlow({
  name: 'getAssistantResponseFlow',
  inputSchema: GetAssistantResponseInputSchema,
  outputSchema: z.string(),
},
async (input) => {
  const todayMeals = input.history.filter(h => new Date(h.timestamp).toDateString() === new Date(input.currentDate).toDateString());
  const totalCalories = todayMeals.reduce((acc, curr) => acc + curr.analysis.total_calories, 0);
=======
  modelId: ModelId
): Promise<string> {
  const flowResult = await getAssistantResponseFlow(input, { context: { modelId } });
  return flowResult;
}

const getAssistantResponseFlow = ai.defineFlow(
  {
    name: 'getAssistantResponseFlow',
    inputSchema: GetAssistantResponseInputSchema,
    outputSchema: z.string(),
  },
  async (input, { context }) => {
    const modelId = context?.modelId || 'gemini-2.5-flash';
    const model = `googleai/${modelId}`;

    const todayMeals = input.history.filter(h => new Date(h.timestamp).toDateString() === input.currentDate);
    const totalCalories = todayMeals.reduce((acc, curr) => acc + curr.analysis.total_calories, 0);
>>>>>>> 052caa3 (Can you please at a 3 dot button to the right most side of the dock whic)

  const systemInstruction = `
    You are IndiCal AI Assistant, a helpful and concise Indian food nutritionist.
    The user's daily calorie goal is ${input.goals.calories} kcal. So far today (${new Date(input.currentDate).toDateString()}), they have consumed ${totalCalories} kcal.
    Use the provided meal history for today to answer questions about what they've eaten.
    Keep your responses brief, informative, and encouraging.
  `;

  const fullHistory = input.chatHistory.map(m => ({
    role: m.role,
    content: [{text: m.text}]
  }));

<<<<<<< HEAD
  const llmResponse = await ai.generate({
    history: fullHistory,
    prompt: input.userMessage,
    system: systemInstruction,
  });
  
  return llmResponse.text || "I'm not sure how to respond to that. Could you please rephrase?";
});
=======
    const llmResponse = await ai.generate({
      model,
      prompt: fullPrompt,
    });
    
    return llmResponse.text || "I'm not sure how to respond to that. Could you please rephrase?";
  }
);
>>>>>>> 052caa3 (Can you please at a 3 dot button to the right most side of the dock whic)

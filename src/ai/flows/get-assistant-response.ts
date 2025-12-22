
'use server';
import { configureAi } from '@/ai/genkit';
import { z } from 'genkit';
import { HistoryEntry, UserGoals, ChatMessage } from '@/lib/types'; // Assuming types are defined here

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
  modelId: string,
): Promise<string> {
  const flowResult = await getAssistantResponseFlow(input, modelId);
  return flowResult;
}

const getAssistantResponseFlow = async (
  input: GetAssistantResponseInput,
  modelId: string,
) => {
  const ai = await configureAi(modelId);
  const todayMeals = input.history.filter(h => new Date(h.timestamp).toDateString() === input.currentDate);
  const totalCalories = todayMeals.reduce((acc, curr) => acc + curr.analysis.total_calories, 0);

  const systemInstruction = `
    You are IndiCal AI Assistant, a helpful and concise Indian food nutritionist.
    The user's daily calorie goal is ${input.goals.calories} kcal. So far today, they have consumed ${totalCalories} kcal.
    Keep your responses brief, informative, and encouraging.
  `;

  const fullHistory = input.chatHistory.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
  const fullPrompt = `${systemInstruction}\n\nChat History:\n${fullHistory}\nUser: ${input.userMessage}`;

  const llmResponse = await ai.generate({
    prompt: fullPrompt,
  });
  
  return llmResponse.text || "I'm not sure how to respond to that. Could you please rephrase?";
};

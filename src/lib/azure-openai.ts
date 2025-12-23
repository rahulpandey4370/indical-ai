
'use server';

import OpenAI from 'openai';
import { z, ZodSchema } from 'zod';
import { Prompt } from 'genkit/experimental/prompt';
import { renderPrompt } from 'genkit/experimental/prompt';

const azureOpenAI = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: process.env.AZURE_OPENAI_ENDPOINT,
  defaultQuery: { 'api-version': '2024-02-01' },
  defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY },
});

const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME!;

/**
 * A helper function to call Azure OpenAI with a structured prompt and parse the JSON output.
 * It manually constructs the prompt from a Genkit prompt object.
 */
export async function callAzureOpenAI<T extends ZodSchema>(
  prompt: Prompt<any, T>,
  input: z.infer<any>,
  outputSchema: T
): Promise<z.infer<T>> {
  // Render the prompt to a string using Genkit's rendering utility
  const renderedPrompt = await renderPrompt({ prompt, input });

  // Right now, we only support text-based prompts for the direct Azure call.
  const textPrompt = renderedPrompt.messages.map(m => {
    if(m.role === 'system') return m.content[0].text;
    const parts = m.content.map(p => {
        if (p.text) return p.text;
        // The direct API call doesn't support media parts like Genkit, so we provide a placeholder.
        if (p.media) return `[An image was provided: ${p.media.url.substring(0, 50)}...]`;
        return '';
    }).join('\n');
    return `${m.role}: ${parts}`;
  }).join('\n');

  try {
    const response = await azureOpenAI.chat.completions.create({
      model: deploymentName,
      messages: [{ role: 'user', content: textPrompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2, // Lower temperature for more predictable JSON output
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Azure OpenAI returned an empty response.');
    }

    // Clean up potential markdown code fences around the JSON
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();

    const parsed = JSON.parse(cleanedContent);
    return outputSchema.parse(parsed);
  } catch (error: any) {
    console.error("Error calling Azure OpenAI:", error);
    // Re-throw a more specific error to be handled by the calling flow
    if (error instanceof z.ZodError) {
      throw new Error(`Azure OpenAI response failed Zod validation: ${error.message}`);
    }
    throw new Error(`Failed to get a valid response from Azure OpenAI: ${error.message}`);
  }
}

/**
 * A simpler helper for chat-style interactions that don't require structured output.
 */
export async function callAzureOpenAIChat(
  messages: Array<{ role: 'system' | 'user' | 'model'; content: string }>
): Promise<string> {
    const chatMessages = messages.map(m => {
        // The 'model' role in genkit maps to 'assistant' in openai
        const role = m.role === 'model' ? 'assistant' : m.role;
        return { role, content: m.content };
    })
  try {
    const response = await azureOpenAI.chat.completions.create({
      model: deploymentName,
      messages: chatMessages,
      temperature: 0.7,
    });
    return response.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error("Error calling Azure OpenAI Chat:", error);
    throw new Error(`Failed to get a valid chat response from Azure OpenAI: ${error.message}`);
  }
}

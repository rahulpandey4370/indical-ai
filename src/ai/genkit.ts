'use server';

import {genkit, ModelReference} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'zod';
import {ai} from './index';

// --- Model Definitions ---
const gemini25Flash = googleAI.model('gemini-2.5-flash');
const gemini3Flash = googleAI.model('gemini-3.0-flash');
const gemini25FlashLite = googleAI.model('gemini-2.5-flash-lite');
const gemma327b = googleAI.model('gemma-3-27b');

// Define the tool using the global 'ai' object
const googleSearchTool = ai.defineTool(
  {
    name: 'googleSearch',
    description: 'Search Google for information.',
    inputSchema: z.object({query: z.string()}),
    outputSchema: z.string(),
  },
  async (input: {query: string}) => {
    console.log(`[googleSearch] searching for "${input.query}"...`);
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX;

    if (!apiKey || !cx) {
      return 'Google Search is not configured.';
    }

    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(
      input.query
    )}`;

    const response = await fetch(url);
    if (!response.ok) {
      return `Google Search API returned an error: ${response.statusText}`;
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      return 'No results found.';
    }

    const snippets = data.items.map((item: any) => item.snippet);
    return JSON.stringify(snippets);
  }
);

// Map model IDs to their references
const modelMap: Record<string, ModelReference<any>> = {
  'gemini-2.5-flash': gemini25Flash,
  'gemini-3.0-flash': gemini3Flash,
  'gemini-2.5-flash-lite': gemini25FlashLite,
  'gemma-3-27b': gemma327b,
};

// This function dynamically configures the global AI object based on a model ID
export async function configureAi(modelId: string) {
  const model = modelMap[modelId] || gemini25Flash; // Fallback to default

  genkit({
    plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY})],
    model: model,
    tools: [googleSearchTool],
  });
}

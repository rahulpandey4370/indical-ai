
'use server';

import {genkit, ModelReference} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {googleSearchTool} from './tools/google-search';
import { gemini25Flash, gemini3Flash, gemini25FlashLite, gemma327b } from './models';

// Map model IDs to their references
const modelMap: Record<string, ModelReference<any>> = {
  'gemini-2.5-flash': gemini25Flash,
  'gemini-3.0-flash': gemini3Flash,
  'gemini-2.5-flash-lite': gemini25FlashLite,
  'gemma-3-27b': gemma327b,
};

// This function dynamically creates the AI configuration based on a model ID
// It is a server-side utility.
export async function configureAi(modelId: string) {
  const model = modelMap[modelId] || gemini25Flash; // Fallback to default

  return genkit({
    plugins: [googleAI({
      apiKey: process.env.GEMINI_API_KEY
    })],
    model: model,
    tools: [googleSearchTool],
  });
}

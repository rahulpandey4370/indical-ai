
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {googleSearchTool} from './tools/google-search';

export const ai = genkit({
  plugins: [googleAI({
    apiKey: process.env.GEMINI_API_KEY
  })],
  model: 'googleai/gemini-2.5-flash',
  tools: [googleSearchTool],
});

// Define the tool using the initialized 'ai' object for export, but it's configured above.
export const googleSearch = ai.defineTool(googleSearchTool);

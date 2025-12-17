
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {googleSearchTool} from './tools/google-search';

// Define the tool before configuring the ai object.
export const googleSearch = ai.defineTool(googleSearchTool);

export const ai = genkit({
  plugins: [googleAI({
    apiKey: process.env.GEMINI_API_KEY
  })],
  model: 'googleai/gemini-2.5-flash',
  tools: [googleSearch],
});

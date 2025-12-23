import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import { openAI } from '@genkit-ai/compat-oai';

export const ai = genkit({
  plugins: [
    googleAI({apiKey: process.env.GEMINI_API_KEY}),
    openAI({
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/gpt-5.2-chat`,
        defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY! },
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

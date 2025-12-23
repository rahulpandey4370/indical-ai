
import {genkit, modelRef} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import { openAICompatible } from '@genkit-ai/compat-oai';

const gpt52Chat = modelRef({
    name: 'azure/gpt-5.2-chat',
    info: {
        label: 'GPT 5.2 Chat',
        supports: {
            media: false,
            multiturn: true,
            tools: false,
            systemRole: true,
            output: ['text'],
        },
    },
});

export const ai = genkit({
  plugins: [
    googleAI({apiKey: process.env.GEMINI_API_KEY}),
    openAICompatible({
      name: 'azure',
      apiKey: process.env.AZURE_OPENAI_API_KEY!,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/gpt-5.2-chat`,
      defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY! },
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

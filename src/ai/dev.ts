
import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-indian-food-image.ts';
import '@/ai/flows/refine-nutritional-analysis.ts';
import '@/ai/flows/get-assistant-response.ts';
import '@/ai/flows/generate-insights-flow.ts';
import '@/ai/flows/analyze-meal-composition.ts';
import '@/ai/genkit';

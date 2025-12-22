import { config } from 'dotenv';
config();

import './index'; // Import the new index to configure genkit
import './flows/analyze-indian-food-image.ts';
import './flows/refine-nutritional-analysis.ts';
import './flows/get-assistant-response.ts';
import './flows/generate-insights-flow.ts';
import './flows/analyze-meal-composition.ts';

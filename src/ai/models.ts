
'use server';
import { googleAI } from '@genkit-ai/google-genai';

// These are not exported to comply with 'use server' constraints.
// They are used within the server-only file src/ai/genkit.ts.
export const gemini25Flash = googleAI.model('gemini-2.5-flash');
export const gemini3Flash = googleAI.model('gemini-3.0-flash');
export const gemini25FlashLite = googleAI.model('gemini-2.5-flash-lite');
export const gemma327b = googleAI.model('gemma-3-27b');

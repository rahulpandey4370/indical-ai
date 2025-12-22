
import { googleAI } from '@genkit-ai/google-genai';

// These are not exported directly to comply with 'use server' constraints.
// They are used within the server-only files.
export const gemini25Flash = googleAI.model('gemini-2.5-flash');
export const gemini3Flash = googleAI.model('gemini-3.0-flash');

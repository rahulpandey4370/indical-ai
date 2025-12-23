
'use server';

import OpenAI from 'openai';
import { z, ZodSchema } from 'zod';

const azureOpenAI = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { "api-version": "2024-02-01" },
  defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY },
});

const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME!;

// Basic Handlebars-like replacer
function simpleTemplateRender(template: string, data: Record<string, any>): string {
    let output = template;

    // Replace {{media url=...}}
    output = output.replace(/{{media\s+url=([^}]+)}}/g, (match, key) => {
        const value = data[key.trim()];
        if(typeof value === 'string' && value.startsWith('data:image')) {
            // Azure OpenAI doesn't support inline base64 images this way,
            // so we'll just indicate an image was present in the text prompt.
            return `[An image was provided: ${value.substring(0, 50)}...]`;
        }
        return '';
    });

    // Replace {{{json ...}}}
    output = output.replace(/{{{json\s+([^}]+)}}}/g, (match, key) => {
        const value = data[key.trim()];
        return JSON.stringify(value, null, 2);
    });

    // Replace {{{...}}} and {{...}}
    output = output.replace(/{{{\s*([\w.]+)\s*}}}/g, (match, key) => {
        const keys = key.trim().split('.');
        let current: any = data;
        for(const k of keys) {
            if(current && typeof current === 'object' && k in current) {
                current = current[k];
            } else {
                return ''; // Key not found
            }
        }
        return String(current);
    });
    
    // Replace {{#if ...}} ... {{/if}}
    output = output.replace(/{{#if\s+([^}]+)}}([\s\S]*?){{\/if}}/g, (match, key, content) => {
        return data[key.trim()] ? content : '';
    });

    return output;
}


/**
 * A helper function to call Azure OpenAI with a structured prompt and parse the JSON output.
 */
export async function callAzureOpenAI<T extends ZodSchema>(
  promptTemplate: string,
  input: z.infer<any>,
  outputSchema: T
): Promise<z.infer<T>> {
  
  const textPrompt = simpleTemplateRender(promptTemplate, input);

  try {
    const response = await azureOpenAI.chat.completions.create({
      model: deploymentName,
      messages: [{ role: 'user', content: textPrompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Azure OpenAI returned an empty response.');
    }

    // Sometimes the response is wrapped in ```json ... ```, so we clean it.
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();

    const parsed = JSON.parse(cleanedContent);
    return outputSchema.parse(parsed);
  } catch (error: any) {
    console.error("Error calling Azure OpenAI:", error);
    if (error instanceof z.ZodError) {
      throw new Error(`Azure OpenAI response failed Zod validation: ${error.message}`);
    }
    throw new Error(`Failed to get a valid response from Azure OpenAI: ${error.message}`);
  }
}

/**
 * A simpler helper for chat-style interactions that don't require structured output.
 */
export async function callAzureOpenAIChat(
  messages: Array<{ role: 'system' | 'user' | 'model'; content: string }>
): Promise<string> {
    // Map 'model' role to 'assistant' for OpenAI API
    const chatMessages = messages.map(m => {
        const role = m.role === 'model' ? 'assistant' : m.role;
        return { role, content: m.content };
    })
  try {
    const response = await azureOpenAI.chat.completions.create({
      model: deploymentName,
      messages: chatMessages,
      temperature: 0.7,
    });
    return response.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error("Error calling Azure OpenAI Chat:", error);
    throw new Error(`Failed to get a valid chat response from Azure OpenAI: ${error.message}`);
  }
}

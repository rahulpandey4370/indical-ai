'use server';

import { AzureOpenAI } from 'openai';
import { z, ZodSchema } from 'zod';

// Configuration from Environment Variables
const endpoint = process.env.AZURE_OPENAI_ENDPOINT!;
const apiKey = process.env.AZURE_OPENAI_API_KEY!;
const apiVersion = "2025-04-01-preview"; 
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME!;

// Initialize the Azure-specific client
const client = new AzureOpenAI({
  endpoint,
  apiKey,
  apiVersion,
  deployment,
});

// Basic Handlebars-like replacer
function simpleTemplateRender(template: string, data: Record<string, any>): string {
    let output = template;

    // Replace {{media url=...}}
    output = output.replace(/{{media\s+url=([^}]+)}}/g, (match, key) => {
        const value = data[key.trim()];
        if(typeof value === 'string' && value.startsWith('data:image')) {
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
                return ''; 
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
 * Structured Output Helper
 */
export async function callAzureOpenAI<T extends ZodSchema>(
  promptTemplate: string,
  input: z.infer<any>,
  outputSchema: T
): Promise<z.infer<T>> {
  
  const textPrompt = simpleTemplateRender(promptTemplate, input);

  try {
    const response = await client.chat.completions.create({
      // In the new SDK, deployment is handled in the constructor, 
      // but 'model' is often still required for compatibility.
      model: deployment, 
      messages: [{ role: 'user', content: textPrompt }],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Azure OpenAI returned an empty response.');
    }

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
 * Chat Style Helper
 */
export async function callAzureOpenAIChat(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
): Promise<string> {
  try {
    const response = await client.chat.completions.create({
      model: deployment,
      messages: messages,
    });
    return response.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error("Error calling Azure OpenAI Chat:", error);
    throw new Error(`Failed to get a valid chat response from Azure OpenAI: ${error.message}`);
  }
}
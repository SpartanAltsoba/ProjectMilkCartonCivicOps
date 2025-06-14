import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

export interface ModelConfig {
  primary_model: string;
  fallback_model?: string;
  tasks: string[];
  supporting_services?: Array<{
    service: string;
    purpose: string;
  }>;
  triage_services?: Array<{
    model: string;
    purpose: string;
  }>;
}

export class OpenAIService {
  private client: OpenAI;
  private static instance: OpenAIService;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  async generateCompletion(
    model: string,
    prompt: string,
    systemPrompt?: string,
    maxTokens: number = 1000
  ): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
          { role: 'user' as const, content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.1
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error(`Error with model ${model}:`, error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-large',
        input: text
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  async moderateContent(text: string): Promise<boolean> {
    try {
      const response = await this.client.moderations.create({
        model: 'moderation-latest',
        input: text
      });

      return !response.results[0].flagged;
    } catch (error) {
      console.error('Error moderating content:', error);
      throw error;
    }
  }

  async callFunction(
    model: string,
    prompt: string,
    functions: Array<{
      name: string;
      description: string;
      parameters: Record<string, any>;
    }>,
    systemPrompt?: string
  ): Promise<any> {
    try {
      const tools = functions.map(func => ({
        type: 'function' as const,
        function: {
          name: func.name,
          description: func.description,
          parameters: func.parameters
        }
      }));

      const response = await this.client.chat.completions.create({
        model,
        messages: [
          ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
          { role: 'user' as const, content: prompt }
        ],
        tools,
        tool_choice: 'auto',
        temperature: 0.1
      });

      const toolCall = response.choices[0]?.message?.tool_calls?.[0];
      if (toolCall?.type === 'function') {
        return {
          name: toolCall.function.name,
          arguments: JSON.parse(toolCall.function.arguments)
        };
      }

      return null;
    } catch (error) {
      console.error(`Error with function calling on ${model}:`, error);
      throw error;
    }
  }
}

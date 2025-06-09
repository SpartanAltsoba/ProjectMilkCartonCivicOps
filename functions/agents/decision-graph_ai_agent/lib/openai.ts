import OpenAI from "openai";
import { logger } from "./logger";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SummarizeOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export async function summarizeLegalContent(
  content: string,
  options: SummarizeOptions = {}
): Promise<string> {
  try {
    const { maxTokens = 500, temperature = 0.3, model = "gpt-4-1106-preview" } = options;

    const prompt = `
      Analyze and summarize the following legal content related to child welfare:
      
      ${content}
      
      Focus on:
      1. Key legal framework (CHINS/CINA/FINS)
      2. Main decision points
      3. Required stakeholder involvement
      4. Mandatory timelines or deadlines
      
      Provide a concise, structured summary.
    `;

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a legal expert specializing in child welfare law. Provide clear, accurate summaries of legal frameworks and procedures.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
      temperature,
    });

    const summary = response.choices[0]?.message?.content?.trim();

    if (!summary) {
      throw new Error("No summary generated");
    }

    logger.info("Legal content summarized successfully", {
      contentLength: content.length,
      summaryLength: summary.length,
    });

    return summary;
  } catch (error) {
    logger.error("Failed to summarize legal content", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

export async function analyzeLegalFramework(
  searchResults: Array<{ title: string; snippet: string }>,
  options: SummarizeOptions = {}
): Promise<{
  framework: "CHINS" | "CINA" | "FINS" | "State-specific" | "Unknown";
  explanation: string;
}> {
  try {
    const { temperature = 0.3, model = "gpt-4-1106-preview" } = options;

    const content = searchResults
      .map(result => `Title: ${result.title}\nContent: ${result.snippet}`)
      .join("\n\n");

    const prompt = `
      Analyze these child welfare legal search results and determine the primary legal framework:

      ${content}

      Determine if the jurisdiction uses:
      1. CHINS (Child in Need of Services)
      2. CINA (Child in Need of Aid)
      3. FINS (Family in Need of Services)
      4. State-specific framework
      5. Unknown (if cannot be determined)

      Provide:
      1. The primary framework type
      2. A brief explanation of why this framework was chosen
      
      Format your response exactly as follows:
      Framework: [CHINS/CINA/FINS/State-specific/Unknown]
      Explanation: [Your explanation]
    `;

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a legal expert specializing in child welfare law. Analyze search results to determine the applicable legal framework.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature,
    });

    const result = response.choices[0]?.message?.content?.trim();

    if (!result) {
      throw new Error("No analysis generated");
    }

    // Parse the response
    const frameworkMatch = result.match(/Framework:\s*(CHINS|CINA|FINS|State-specific|Unknown)/i);
    const explanationMatch = result.match(/Explanation:\s*(.+?)(?:\n|$)/s);

    if (!frameworkMatch || !explanationMatch) {
      throw new Error("Invalid analysis format");
    }

    return {
      framework: frameworkMatch[1] as "CHINS" | "CINA" | "FINS" | "State-specific" | "Unknown",
      explanation: explanationMatch[1].trim(),
    };
  } catch (error) {
    logger.error("Failed to analyze legal framework", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

export const openaiClient = openai;

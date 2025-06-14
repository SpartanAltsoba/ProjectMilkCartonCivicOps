import OpenAI from 'openai';

// Define the type for the response from the GPT model
interface GptAnalysisResult {
  summary: string;
  entities: Array<string>;
  error?: string;
}

// Function to initialize the GPT-4 API client
const initializeGptClient = () => {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

// Function to analyze content using GPT-4
export async function analyzeContent(content: string): Promise<GptAnalysisResult> {
  if (!content) {
    return { summary: '', entities: [], error: 'No content provided for analysis' };
  }

  const openai = initializeGptClient();

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing content and extracting key entities. Format your response as "Summary: <summary text>\nEntities: <comma-separated list of entities>"'
        },
        {
          role: 'user',
          content: `Analyze the following content:\n${content}`
        }
      ],
      temperature: 0.5,
      max_tokens: 300
    });

    const resultText = response.choices[0]?.message?.content || '';
    const extractedEntities = extractEntities(resultText);
    const summary = extractSummary(resultText);

    return { summary, entities: extractedEntities };
  } catch (error) {
    console.error('Error while analyzing content using GPT-4:', error);
    return { summary: '', entities: [], error: 'Analysis failed due to an error in the OpenAI service.' };
  }
}

// Utility function to extract entities from the result
function extractEntities(resultText: string): Array<string> {
  const entitiesMatch = resultText.match(/Entities:\s*(.+)$/i);
  if (entitiesMatch) {
    return entitiesMatch[1].split(',').map(entity => entity.trim());
  }
  return [];
}

// Utility function to extract summary from the result
function extractSummary(resultText: string): string {
  const summaryMatch = resultText.match(/Summary:\s*([^]*?)(?=\nEntities:|$)/i);
  return summaryMatch ? summaryMatch[1].trim() : '';
}

export default analyzeContent;

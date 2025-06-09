import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CPSData {
  agencyId: string;
  agencyName: string;
  state: string;
  county?: string;
  performanceMetrics: {
    caseResolutionTime: number;
    successRate: number;
    complianceScore: number;
  };
  transparencyScore: number;
  accountabilityMetrics: {
    reportingFrequency: string;
    publicAccessibility: boolean;
  };
}

export interface CaseData {
  caseId: string;
  agentActions: Array<{
    actionId: string;
    timestamp: string;
    action: string;
    outcome: string;
    agentId: string;
  }>;
  timeline: Array<{
    date: string;
    event: string;
    responsible: string;
  }>;
  status: string;
  priority: "low" | "medium" | "high" | "critical";
}

/**
 * Analyze aggregated CPS agency data and generate grading insights.
 * @param data Aggregated data for a CPS agency.
 * @returns AI-generated summary and grading insights.
 */
export async function analyzeAgencyData(data: CPSData): Promise<string> {
  const prompt = `Analyze the following CPS agency data and provide a detailed grading and scoring summary based on performance, transparency, compliance, and accountability criteria:\n\n${JSON.stringify(data, null, 2)}\n\nProvide a concise but comprehensive report.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const insights = response.choices[0]?.message?.content || "No insights generated.";

    // Store insights if needed (would require proper Firestore setup)
    // await firestore.collection("insights").add({ data, insights });

    return insights;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate AI insights.");
  }
}

/**
 * Generate detailed decision chain narrative for a CPS case.
 * @param caseData Detailed case data including agent actions and timelines.
 * @returns AI-generated narrative of the decision chain.
 */
export async function generateDecisionChainNarrative(caseData: CaseData): Promise<string> {
  const prompt = `Given the following CPS case data with agent actions and timelines, generate a detailed narrative of the decision chain:\n\n${JSON.stringify(caseData, null, 2)}\n\nProvide a clear step-by-step explanation.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const narrative = response.choices[0]?.message?.content || "No narrative generated.";

    // Store narrative if needed (would require proper Firestore setup)
    // await firestore.collection("narratives").add({ caseData, narrative });

    return narrative;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate decision chain narrative.");
  }
}

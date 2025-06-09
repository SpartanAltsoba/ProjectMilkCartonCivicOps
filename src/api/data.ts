import { RiskScore, Alert, StatesCounties } from "../types/dashboard";

// Real data fetching using Firebase Functions
export async function fetchStatesCounties(): Promise<StatesCounties> {
  try {
    // Use full URL for server-side rendering
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
    const response = await fetch(`${baseUrl}/api/locations`);
    if (!response.ok) {
      throw new Error("Failed to fetch locations");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching states and counties:", error);
    // Return default data if fetch fails
    return {
      states: ["California", "Texas", "Florida", "New York", "Pennsylvania"],
      counties: {
        California: ["Los Angeles", "San Francisco", "Orange", "San Diego", "Sacramento"],
        Texas: ["Harris", "Dallas", "Tarrant", "Bexar", "Travis"],
        Florida: ["Miami-Dade", "Broward", "Palm Beach", "Hillsborough", "Orange"],
        "New York": ["New York", "Kings", "Queens", "Suffolk", "Nassau"],
        Pennsylvania: ["Philadelphia", "Allegheny", "Montgomery", "Bucks", "Chester"],
      },
    };
  }
}

export async function fetchRiskScores(state: string, county: string): Promise<RiskScore[]> {
  try {
    // Call Firebase Function for scoring agent
    const response = await fetch("/api/scoring", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        location: `${county}, ${state}`,
        metrics: ["child_safety", "family_preservation", "service_access", "oversight"],
      }),
    });

    if (!response.ok) {
      throw new Error(`Scoring API error: ${response.status}`);
    }

    const scoringResponse = await response.json();

    // Transform scoring agent response to RiskScore format
    const riskScores: RiskScore[] = Object.entries(scoringResponse.scores.categories).map(
      ([category, value]) => ({
        category: category
          .split("_")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        value: Math.round((value as number) * 100), // Convert 0-1 to 0-100
        description: getDescriptionForCategory(category),
        timestamp: scoringResponse.metadata.timestamp,
      })
    );

    // Add overall score
    riskScores.unshift({
      category: "Overall Risk",
      value: Math.round(scoringResponse.scores.overall * 100),
      description: scoringResponse.analysis.summary,
      timestamp: scoringResponse.metadata.timestamp,
    });

    return riskScores;
  } catch (error) {
    console.error("Error fetching risk scores:", error);
    throw new Error("Failed to fetch risk scores");
  }
}

export async function fetchAlerts(state: string, county: string): Promise<Alert[]> {
  try {
    // Call Firebase Function for scoring agent to get recommendations
    const response = await fetch("/api/scoring", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        location: `${county}, ${state}`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Scoring API error: ${response.status}`);
    }

    const scoringResponse = await response.json();

    const alerts: Alert[] = scoringResponse.analysis.recommendations.map(
      (recommendation: string, index: number) => ({
        id: `${Date.now()}-${index}`,
        title: `Risk Alert ${index + 1}`,
        message: recommendation,
        severity: getSeverityFromScore(scoringResponse.scores.overall),
        timestamp: scoringResponse.metadata.timestamp,
        category: "Risk Assessment",
        status: "active" as const,
      })
    );

    return alerts;
  } catch (error) {
    console.error("Error fetching alerts:", error);
    throw new Error("Failed to fetch alerts");
  }
}

// Helper functions
function getDescriptionForCategory(category: string): string {
  const descriptions: Record<string, string> = {
    child_safety: "Assessment of immediate safety risks and protective factors",
    family_preservation: "Evaluation of family unity and support services",
    service_access: "Availability and accessibility of support services",
    oversight: "Quality of monitoring and accountability measures",
  };
  return descriptions[category] || "Detailed analysis of risk factors and trends";
}

function getSeverityFromScore(score: number): "high" | "medium" | "low" {
  if (score <= 0.4) return "high";
  if (score <= 0.7) return "medium";
  return "low";
}

import { courtListenerClientV2, CourtCase } from "./courtListenerClientV2";
import { dataGovClientV2 } from "./dataGovClientV2";
import { logger } from "../logger";
import { sanitizeInput } from "../utils/sanitizeInput";

// Use CourtCase as Case for consistency
type Case = CourtCase;

interface ChildWelfareStats {
  totalCases: number;
  substantiatedCases: number;
  fosterCarePlacements: number;
  reunifications: number;
  year: number;
}

interface FosterCareData {
  totalChildren: number;
  averageLengthOfStay: number;
  exitTypes: {
    reunification: number;
    adoption: number;
    guardianship: number;
    other: number;
  };
  year: number;
}

interface ChildAbuseData {
  totalReports: number;
  investigatedReports: number;
  substantiatedReports: number;
  typeBreakdown: {
    neglect: number;
    physicalAbuse: number;
    sexualAbuse: number;
    other: number;
  };
  year: number;
}

interface Demographics {
  totalPopulation: number;
  childPopulation: number;
  povertyRate: number;
  medianIncome: number;
  year: number;
}

interface EducationStats {
  graduationRate: number;
  dropoutRate: number;
  attendanceRate: number;
  specialEducation: number;
  year: number;
}

interface JuvenileJusticeStats {
  totalArrests: number;
  detentionAdmissions: number;
  recidivismRate: number;
  year: number;
}

interface SearchOptions {
  state: string;
  county?: string;
  year?: number;
  includeJuvenileJustice?: boolean;
  includeDemographics?: boolean;
  includeEducation?: boolean;
}

interface ComprehensiveReport {
  location: {
    state: string;
    county?: string;
  };
  courtCases: Case[];
  childWelfareStats: ChildWelfareStats | null;
  fosterCareData: FosterCareData | null;
  childAbuseData: ChildAbuseData | null;
  demographics?: Demographics | null;
  education?: EducationStats | null;
  juvenileJustice?: JuvenileJusticeStats | null;
  generatedAt: string;
  dataQuality: {
    courtCasesAvailable: boolean;
    governmentDataAvailable: boolean;
    completeness: number; // 0-1 scale
  };
}

class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

class UnifiedApiClient {
  private calculateCompleteness(report: Partial<ComprehensiveReport>): number {
    const requiredFields = ["courtCases", "childWelfareStats", "fosterCareData", "childAbuseData"];
    const optionalFields = ["demographics", "education", "juvenileJustice"];

    const availableRequired = requiredFields.filter(
      field => report[field as keyof ComprehensiveReport] !== null
    ).length;
    const availableOptional = optionalFields.filter(
      field => report[field as keyof ComprehensiveReport] !== null
    ).length;

    return (
      (availableRequired / requiredFields.length) * 0.7 +
      (availableOptional / optionalFields.length) * 0.3
    );
  }

  async comprehensiveSearch(options: SearchOptions): Promise<ComprehensiveReport> {
    try {
      const sanitizedState = sanitizeInput(options.state);
      const sanitizedCounty = options.county ? sanitizeInput(options.county) : undefined;
      const year = options.year || new Date().getFullYear() - 1;

      logger.info("Starting comprehensive search", {
        state: sanitizedState,
        county: sanitizedCounty,
        year,
        options,
      });

      const [courtCases, childWelfareStats, fosterCareData, childAbuseData] = await Promise.all([
        courtListenerClientV2.searchCases(sanitizedState, sanitizedCounty).catch((error: Error) => {
          logger.error("Court cases search failed", error);
          return [];
        }),
        dataGovClientV2.getChildWelfareStats(sanitizedState, year).catch((error: Error) => {
          logger.error("Child welfare stats fetch failed", error);
          return null;
        }),
        dataGovClientV2.getFosterCareData(sanitizedState, year).catch((error: Error) => {
          logger.error("Foster care data fetch failed", error);
          return null;
        }),
        dataGovClientV2.getChildAbuseData(sanitizedState, year).catch((error: Error) => {
          logger.error("Child abuse data fetch failed", error);
          return null;
        }),
      ]);

      // Optional data fetching based on flags
      const optionalData = await Promise.all([
        options.includeDemographics
          ? dataGovClientV2.getDemographics(sanitizedState, sanitizedCounty).catch(() => null)
          : null,
        options.includeEducation
          ? dataGovClientV2.getEducationStats(sanitizedState, sanitizedCounty).catch(() => null)
          : null,
        options.includeJuvenileJustice
          ? dataGovClientV2.getJuvenileJusticeStats(sanitizedState).catch(() => null)
          : null,
      ]);

      const [demographics, education, juvenileJustice] = optionalData;

      const report: ComprehensiveReport = {
        location: {
          state: sanitizedState,
          ...(sanitizedCounty && { county: sanitizedCounty }),
        },
        courtCases,
        childWelfareStats,
        fosterCareData,
        childAbuseData,
        ...(demographics && { demographics }),
        ...(education && { education }),
        ...(juvenileJustice && { juvenileJustice }),
        generatedAt: new Date().toISOString(),
        dataQuality: {
          courtCasesAvailable: courtCases.length > 0,
          governmentDataAvailable: Boolean(childWelfareStats || fosterCareData || childAbuseData),
          completeness: 0, // Will be calculated below
        },
      };

      report.dataQuality.completeness = this.calculateCompleteness(report);

      logger.info("Comprehensive search completed", {
        state: sanitizedState,
        county: sanitizedCounty,
        completeness: report.dataQuality.completeness,
      });

      return report;
    } catch (error) {
      if (error instanceof RateLimitError) {
        logger.warn("Comprehensive search hit rate limit", { error: error.message });
        throw new Error("Rate limit exceeded, please try again later");
      } else {
        logger.error("Comprehensive search failed", error as Error);
        throw new Error("Failed to complete comprehensive search");
      }
    }
  }
}

// Export singleton instance
export const unifiedApiClient = new UnifiedApiClient();

// Export types for external use
export type {
  SearchOptions,
  ComprehensiveReport,
  Case,
  ChildWelfareStats,
  FosterCareData,
  ChildAbuseData,
  Demographics,
  EducationStats,
  JuvenileJusticeStats,
};

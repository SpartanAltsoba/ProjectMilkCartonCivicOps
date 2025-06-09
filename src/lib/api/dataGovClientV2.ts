import { OptimizedBaseApiClient, API_CONFIGS } from "./optimizedBaseApiClient";
import { logger } from "../logger";
import { sanitizeStateCode } from "../../utils/sanitizeInput";

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

class DataGovClientV2 {
  private apiClient: OptimizedBaseApiClient;

  constructor() {
    this.apiClient = new OptimizedBaseApiClient({
      ...API_CONFIGS.GOVERNMENT,
      baseURL: "https://api.data.gov/v2",
      headers: {
        "X-Api-Key": process.env.DATA_GOV_API_KEY || "",
      },
    });
  }

  async getChildWelfareStats(state: string, year?: number): Promise<ChildWelfareStats | null> {
    try {
      const stateCode = sanitizeStateCode(state);
      const response = await this.apiClient.get<ChildWelfareStats>("/child-welfare/stats", {
        params: {
          state: stateCode,
          year: year || new Date().getFullYear() - 1,
        },
      });
      return response;
    } catch (error) {
      logger.error("Failed to fetch child welfare stats", error as Error);
      return null;
    }
  }

  async getFosterCareData(state: string, year?: number): Promise<FosterCareData | null> {
    try {
      const stateCode = sanitizeStateCode(state);
      const response = await this.apiClient.get<FosterCareData>("/foster-care/data", {
        params: {
          state: stateCode,
          year: year || new Date().getFullYear() - 1,
        },
      });
      return response;
    } catch (error) {
      logger.error("Failed to fetch foster care data", error as Error);
      return null;
    }
  }

  async getChildAbuseData(state: string, year?: number): Promise<ChildAbuseData | null> {
    try {
      const stateCode = sanitizeStateCode(state);
      const response = await this.apiClient.get<ChildAbuseData>("/child-abuse/data", {
        params: {
          state: stateCode,
          year: year || new Date().getFullYear() - 1,
        },
      });
      return response;
    } catch (error) {
      logger.error("Failed to fetch child abuse data", error as Error);
      return null;
    }
  }

  async getDemographics(state: string, county?: string): Promise<Demographics | null> {
    try {
      const stateCode = sanitizeStateCode(state);
      const response = await this.apiClient.get<Demographics>("/demographics", {
        params: {
          state: stateCode,
          ...(county && { county }),
        },
      });
      return response;
    } catch (error) {
      logger.error("Failed to fetch demographics", error as Error);
      return null;
    }
  }

  async getEducationStats(state: string, county?: string): Promise<EducationStats | null> {
    try {
      const stateCode = sanitizeStateCode(state);
      const response = await this.apiClient.get<EducationStats>("/education/stats", {
        params: {
          state: stateCode,
          ...(county && { county }),
        },
      });
      return response;
    } catch (error) {
      logger.error("Failed to fetch education stats", error as Error);
      return null;
    }
  }

  async getJuvenileJusticeStats(state: string): Promise<JuvenileJusticeStats | null> {
    try {
      const stateCode = sanitizeStateCode(state);
      const response = await this.apiClient.get<JuvenileJusticeStats>("/juvenile-justice/stats", {
        params: {
          state: stateCode,
        },
      });
      return response;
    } catch (error) {
      logger.error("Failed to fetch juvenile justice stats", error as Error);
      return null;
    }
  }
}

export const dataGovClientV2 = new DataGovClientV2();
export type {
  ChildWelfareStats,
  FosterCareData,
  ChildAbuseData,
  Demographics,
  EducationStats,
  JuvenileJusticeStats,
};

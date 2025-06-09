import { OptimizedBaseApiClient, API_CONFIGS } from "./optimizedBaseApiClient";

interface ChildWelfareStats {
  state: string;
  totalCases: number;
  removals: number;
  placements: number;
  adoptions: number;
  lastUpdated: string;
}

interface DataGovClientProps {
  apiClient: typeof OptimizedBaseApiClient;
  apiConfigs: typeof API_CONFIGS;
}

class DataGovClient {
  private apiClient: OptimizedBaseApiClient;

  constructor({ apiClient, apiConfigs }: DataGovClientProps) {
    this.apiClient = new apiClient({
      ...apiConfigs.GOVERNMENT,
      baseURL: "https://api.data.gov/v1",
      headers: {
        "X-Api-Key": process.env.DATA_GOV_API_KEY || "",
      },
    });
  }

  private validateState = (state: string): void => {
    if (!state || state.length !== 2) {
      throw new Error("Invalid state code. Please use 2-letter state code (e.g., CA)");
    }
  };

  async getChildWelfareStats(state: string): Promise<ChildWelfareStats> {
    this.validateState(state);

    return this.apiClient.cachedRequest(
      `childWelfare:${state}`,
      () =>
        this.apiClient.get<ChildWelfareStats>("/child-welfare/stats", {
          params: { state: state.toUpperCase() },
        }),
      12 // Cache for 12 hours
    );
  }

  async batchGetChildWelfareStats(states: string[]): Promise<ChildWelfareStats[]> {
    const requests = states.map(state => () => this.getChildWelfareStats(state));
    return this.apiClient.batchRequests(requests, 3, 2000); // Process 3 at a time, 2s delay between batches
  }
}

// Export factory function instead of singleton instance for better testability
export const createDataGovClient = (props: DataGovClientProps) => new DataGovClient(props);
export type { ChildWelfareStats, DataGovClientProps };

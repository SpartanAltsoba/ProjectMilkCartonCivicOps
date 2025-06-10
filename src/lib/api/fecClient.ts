import Config from "../config";
import axios, { AxiosResponse } from "axios";
import { CommitteeData, ContributionData } from "../types/fec";

class FECClient {
  private readonly baseUrl = "https://api.open.fec.gov/v1";

  private async request<T>(endpoint: string, params: Record<string, unknown> = {}): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: {
          "X-Api-Key": Config.FEC_API_KEY,
          "Content-Type": "application/json",
        },
        params: {
          ...params,
          api_key: Config.FEC_API_KEY,
        },
      });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("FEC API error:", error.message);
      } else {
        console.error("FEC API error:", error);
      }
      throw error;
    }
  }

  async searchCommittees(query: string, state?: string): Promise<CommitteeData[]> {
    const params = {
      q: query,
      ...(state && { state: state }),
      sort: "-last_file_date",
    };

    const response = await this.request<{ results: CommitteeData[] }>(
      "/committees/search/",
      params
    );
    return response.results;
  }

  async getContributions(committeeId: string): Promise<ContributionData[]> {
    const params = {
      committee_id: committeeId,
      sort: "-contribution_receipt_date",
      per_page: 100,
    };

    const response = await this.request<{ results: ContributionData[] }>(
      "/schedules/schedule_a/",
      params
    );
    return response.results;
  }

  async getContributorHistory(contributorName: string): Promise<ContributionData[]> {
    const params = {
      contributor_name: contributorName,
      sort: "-contribution_receipt_date",
      per_page: 100,
    };

    const response = await this.request<{ results: ContributionData[] }>(
      "/schedules/schedule_a/",
      params
    );
    return response.results;
  }

  async getCommitteeDetails(committeeId: string): Promise<CommitteeData> {
    return this.request<CommitteeData>(`/committee/${committeeId}/`);
  }
}

export const fecClient = new FECClient();

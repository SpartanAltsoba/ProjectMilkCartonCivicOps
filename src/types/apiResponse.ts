export interface StatesAndCountiesResponse {
  data: Array<{
    state: string;
    counties: string[];
  }>;
}

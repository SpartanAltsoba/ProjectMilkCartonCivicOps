export interface StatesAndCountiesResponse {
  data: {
    states: string[];
    counties: string[];
  };
  status: number;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  status: number;
}

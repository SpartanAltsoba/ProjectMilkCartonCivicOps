export interface DateRange {
  start: string;
  end: string;
}

export interface FOIARequest {
  jurisdiction: string;
  agency: string;
  requestType: string;
  dateRange: DateRange;
  description: string;
}

export interface FOIAResponse {
  success: boolean;
  request?: string;
  error?: string;
}

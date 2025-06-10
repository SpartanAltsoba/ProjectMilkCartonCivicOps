import { logger as _logger } from "../logger";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiClientConfig {
  userAgents?: string[];
  delayBetweenRequests?: number;
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  retry?: {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffFactor: number;
  };
}

export class BaseApiClient {
  // ...
  private userAgents: string[];
  private delayBetweenRequests: number;

  constructor(config: ApiClientConfig = {}) {
    // ...
    this.userAgents = config.userAgents || ["CivicTraceOps/1.0"];
    this.delayBetweenRequests = config.delayBetweenRequests || 1000;
  }

  // ...

  protected async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    // ...
    const attempt = 0;
    const retryConfig = { maxRetries: 3 };
    const controller = new AbortController();
    const defaultHeaders: Record<string, string> = {};

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        "User-Agent": this.getRandomUserAgent(),
        ...options.headers,
      },
      signal: controller.signal,
    };

    // ...

    while (attempt < retryConfig.maxRetries) {
      // ...

      await this.delay();
    }

    const response = await fetch(url, requestOptions);
    return (await response.json()) as T;

    // ...
  }

  protected async patch<T>(url: string, data?: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async get<T>(url: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "GET",
    });
  }

  protected async paginate<U>(url: string, options: RequestInit = {}): Promise<U[]> {
    let results: U[] = [];
    let nextPage: string | null = url;

    while (nextPage) {
      const response: { data: U[]; nextPage: string | null } = await this.get<{
        data: U[];
        nextPage: string | null;
      }>(nextPage, options);
      results = [...results, ...response.data];
      nextPage = response.nextPage;
    }

    return results;
  }

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  private delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests));
  }

  protected setDefaultHeader(key: string, value: string): void {
    // This is a placeholder method for setting default headers
    // In a real implementation, this would update the default headers
    console.log(`Setting default header: ${key} = ${value}`);
  }

  protected buildQueryString(params: Record<string, string | undefined>): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, value);
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : "";
  }
}

import { logger } from "../logger";

// ... (rest of the existing code)

interface ApiClientConfig {
  userAgents?: string[];
  delayBetweenRequests?: number;
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
      const response = await this.get<{ data: U[]; nextPage: string | null }>(nextPage, options);
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
}

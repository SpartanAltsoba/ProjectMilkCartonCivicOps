import { describe, expect, test, jest, beforeEach, afterEach } from "@jest/globals";
import { z } from "zod";

// Mock dependencies
jest.mock("axios");
// Define logger mock type
interface LoggerMock {
  info: jest.Mock;
  error: jest.Mock;
  warn: jest.Mock;
}

jest.mock("../../middleware/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  } as LoggerMock,
}));

import { EnhancedBaseApiClient } from "../../lib/apiClients/enhancedBaseApiClient";
import { ApiValidator, ValidationError } from "../../lib/apiClients/validation";
import { ApiCache } from "../../lib/apiClients/cache";
import axios from "axios";
import { logger } from "../../lib/logger";

const mockAxios = jest.mocked(axios);
const mockLogger = logger as unknown as LoggerMock;

// Test schema for validation
const testResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number(),
});

type TestResponse = z.infer<typeof testResponseSchema>;

class TestApiClient extends EnhancedBaseApiClient {
  constructor(config: any = {}) {
    super({
      baseURL: "https://api.test.com",
      ...config,
    });
  }

  async testRequest(options: any = {}) {
    return this.request<TestResponse>({
      endpoint: "/test",
      method: "GET",
      ...options,
    });
  }

  async testBatchRequests(requests: Array<() => Promise<any>>) {
    return this.batchRequests(requests, 2, 100);
  }
}

describe("Enhanced API Client", () => {
  let client: TestApiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    const mockAxiosInstance = {
      request: jest.fn(),
      get: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };
    mockAxios.create.mockReturnValue(mockAxiosInstance as any);
  });

  afterEach(() => {
    if (client) {
      client.cancelAllRequests();
    }
  });

  describe("Basic Functionality", () => {
    test("should initialize with default configuration", () => {
      client = new TestApiClient();
      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: "https://api.test.com",
        timeout: 10000,
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "User-Agent": "CivicTraceOps/1.0",
        }),
      });
    });

    test("should initialize with custom configuration", () => {
      client = new TestApiClient({
        timeout: 5000,
        apiKey: "test-key",
        apiKeyHeader: "X-API-Key",
      });

      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: "https://api.test.com",
        timeout: 5000,
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "User-Agent": "CivicTraceOps/1.0",
          "X-API-Key": "test-key",
        }),
      });
    });
  });

  describe("Mock Data Support", () => {
    test("should use mock data when enabled", async () => {
      client = new TestApiClient({
        mock: { enabled: true, delay: 0, errorRate: 0 },
      });

      const mockData = { id: "1", name: "test", value: 42 };
      const result = await client.testRequest({
        mockResponse: () => mockData,
      });

      expect(result).toEqual(mockData);
      expect(mockLogger.info).toHaveBeenCalledWith("Using mock data for endpoint", {
        endpoint: "/test",
      });
    });

    test("should simulate delays in mock mode", async () => {
      client = new TestApiClient({
        mock: { enabled: true, delay: 50, errorRate: 0 },
      });

      const startTime = Date.now();
      await client.testRequest({
        mockResponse: () => ({ id: "1", name: "test", value: 42 }),
      });
      const duration = Date.now() - startTime;

      expect(duration).toBeGreaterThanOrEqual(45); // Allow some tolerance
    });

    test("should simulate errors in mock mode", async () => {
      client = new TestApiClient({
        mock: { enabled: true, delay: 0, errorRate: 1 },
      });

      await expect(
        client.testRequest({
          mockResponse: () => ({ id: "1", name: "test", value: 42 }),
        })
      ).rejects.toThrow("Simulated API error");
    });
  });

  describe("Response Validation", () => {
    test("should validate responses when schema provided", async () => {
      client = new TestApiClient({
        mock: { enabled: true, delay: 0, errorRate: 0 },
      });

      const validData = { id: "1", name: "test", value: 42 };
      const result = await client.testRequest({
        mockResponse: () => validData,
        validateResponse: testResponseSchema,
      });

      expect(result).toEqual(validData);
    });

    test("should throw validation error for invalid data", async () => {
      client = new TestApiClient({
        mock: { enabled: true, delay: 0, errorRate: 0 },
      });

      const invalidData = { id: "1", name: "test" }; // missing 'value'

      await expect(
        client.testRequest({
          mockResponse: () => invalidData,
          validateResponse: testResponseSchema,
        })
      ).rejects.toThrow(ValidationError);
    });

    test("should proceed without validation when retryOnValidationError is true", async () => {
      client = new TestApiClient({
        mock: { enabled: true, delay: 0, errorRate: 0 },
      });

      const invalidData = { id: "1", name: "test" }; // missing 'value'
      const result = await client.testRequest({
        mockResponse: () => invalidData,
        validateResponse: testResponseSchema,
        retryOnValidationError: true,
      });

      expect(result).toEqual(invalidData);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Mock data validation failed, proceeding without validation",
        expect.any(Object)
      );
    });
  });

  describe("Caching", () => {
    test("should cache responses when cache key provided", async () => {
      client = new TestApiClient({
        mock: { enabled: true, delay: 0, errorRate: 0 },
        cache: { ttl: 300, maxSize: 100, namespace: "test" },
      });

      const mockData = { id: "1", name: "test", value: 42 };
      let callCount = 0;

      // First request
      const result1 = await client.testRequest({
        mockResponse: () => {
          callCount++;
          return mockData;
        },
        cacheKey: "test-key",
      });

      // Second request should use cache
      const result2 = await client.testRequest({
        mockResponse: () => {
          callCount++;
          return { id: "2", name: "different", value: 99 };
        },
        cacheKey: "test-key",
      });

      expect(result1).toEqual(mockData);
      expect(result2).toEqual(mockData); // Should be same as first (cached)
      expect(callCount).toBe(1); // Mock should only be called once
    });

    test("should skip cache when skipCache is true", async () => {
      client = new TestApiClient({
        mock: { enabled: true, delay: 0, errorRate: 0 },
        cache: { ttl: 300, maxSize: 100, namespace: "test" },
      });

      const mockData1 = { id: "1", name: "test", value: 42 };
      const mockData2 = { id: "2", name: "different", value: 99 };

      // First request
      await client.testRequest({
        mockResponse: () => mockData1,
        cacheKey: "test-key",
      });

      // Second request with skipCache
      const result = await client.testRequest({
        mockResponse: () => mockData2,
        cacheKey: "test-key",
        skipCache: true,
      });

      expect(result).toEqual(mockData2); // Should be new data, not cached
    });

    test("should provide cache statistics", () => {
      client = new TestApiClient({
        cache: { ttl: 300, maxSize: 100, namespace: "test" },
      });

      const stats = client.getCacheStats();
      expect(stats).toEqual({
        size: 0,
        maxSize: 100,
        namespace: "test",
      });
    });
  });

  describe("Request Cancellation", () => {
    test("should support request cancellation", () => {
      client = new TestApiClient();

      // Should not throw when cancelling requests
      expect(() => client.cancelAllRequests()).not.toThrow();
      expect(mockLogger.info).toHaveBeenCalledWith("All pending requests cancelled");
    });
  });

  describe("Batch Processing", () => {
    test("should process requests in batches", async () => {
      client = new TestApiClient({
        mock: { enabled: true, delay: 0, errorRate: 0 },
      });

      const requests = [
        () => Promise.resolve({ id: "1", name: "test1", value: 1 }),
        () => Promise.resolve({ id: "2", name: "test2", value: 2 }),
        () => Promise.resolve({ id: "3", name: "test3", value: 3 }),
        () => Promise.resolve({ id: "4", name: "test4", value: 4 }),
      ];

      const results = await client.testBatchRequests(requests);

      expect(results).toHaveLength(4);
      expect(results[0]).toEqual({ id: "1", name: "test1", value: 1 });
      expect(results[3]).toEqual({ id: "4", name: "test4", value: 4 });
    });

    test("should handle batch processing failures gracefully", async () => {
      client = new TestApiClient({
        mock: { enabled: true, delay: 0, errorRate: 0 },
      });

      const requests = [
        () => Promise.resolve({ id: "1", name: "test1", value: 1 }),
        () => Promise.reject(new Error("Request failed")),
        () => Promise.resolve({ id: "3", name: "test3", value: 3 }),
      ];

      const results = await client.testBatchRequests(requests);

      // Should return results for successful requests only
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ id: "1", name: "test1", value: 1 });
      expect(results[1]).toEqual({ id: "3", name: "test3", value: 3 });
    });
  });

  describe("Health Check", () => {
    test("should have health check method", () => {
      client = new TestApiClient();
      expect(typeof client.healthCheck).toBe("function");
    });
  });

  describe("Cache Management", () => {
    test("should clear cache", async () => {
      client = new TestApiClient({
        cache: { ttl: 300, maxSize: 100, namespace: "test" },
      });

      await expect(client.clearCache()).resolves.not.toThrow();
    });

    test("should invalidate cache by pattern", async () => {
      client = new TestApiClient({
        cache: { ttl: 300, maxSize: 100, namespace: "test" },
      });

      await expect(client.invalidateCache("test:*")).resolves.not.toThrow();
    });
  });
});

describe("API Validator", () => {
  test("should validate data successfully", () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const data = { name: "John", age: 30 };

    const result = ApiValidator.validate(schema, data);
    expect(result).toEqual(data);
  });

  test("should throw ValidationError for invalid data", () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const data = { name: "John", age: "thirty" }; // age should be number

    expect(() => ApiValidator.validate(schema, data)).toThrow(ValidationError);
  });

  test("should validate court case data", () => {
    const validCourtCase = {
      id: "1",
      caseName: "Test Case",
      docketNumber: "TC-001",
      court: "Test Court",
      dateDecided: "2023-12-01",
      status: "Decided",
      summary: "Test summary",
    };

    // Import the schema directly for testing
    const { courtCaseSchema } = require("../../lib/apiClients/validation");
    const result = ApiValidator.validate(courtCaseSchema, validCourtCase);
    expect(result).toEqual(validCourtCase);
  });
});

describe("API Cache", () => {
  let cache: ApiCache;

  beforeEach(() => {
    cache = new ApiCache({
      ttl: 1, // 1 second for testing
      maxSize: 3,
      namespace: "test",
    });
  });

  test("should store and retrieve data", async () => {
    const data = { test: "value" };

    await cache.set("key1", data);
    const result = await cache.get("key1");

    expect(result).toEqual(data);
  });

  test("should return null for non-existent keys", async () => {
    const result = await cache.get("non-existent");
    expect(result).toBeNull();
  });

  test("should expire data after TTL", async () => {
    const data = { test: "value" };

    await cache.set("key1", data);

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 1100));

    const result = await cache.get("key1");
    expect(result).toBeNull();
  });

  test("should enforce max size limit", async () => {
    await cache.set("key1", "value1");
    await cache.set("key2", "value2");
    await cache.set("key3", "value3");
    await cache.set("key4", "value4"); // Should evict key1

    const result1 = await cache.get("key1");
    const result4 = await cache.get("key4");

    expect(result1).toBeNull(); // Evicted
    expect(result4).toBe("value4"); // Should exist
  });

  test("should invalidate by pattern", async () => {
    await cache.set("user:1", "data1");
    await cache.set("user:2", "data2");
    await cache.set("post:1", "data3");

    await cache.invalidate("user:.*");

    const user1 = await cache.get("user:1");
    const user2 = await cache.get("user:2");
    const post1 = await cache.get("post:1");

    expect(user1).toBeNull();
    expect(user2).toBeNull();
    expect(post1).toBe("data3"); // Should remain
  });

  test("should provide statistics", () => {
    const stats = cache.getStats();

    expect(stats).toEqual({
      size: 0,
      maxSize: 3,
      namespace: "test",
    });
  });
});

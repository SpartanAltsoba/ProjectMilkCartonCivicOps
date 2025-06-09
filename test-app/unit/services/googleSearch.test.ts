import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { performGoogleSearch } from "../lib/googleSearch";

// Mock fetch globally
global.fetch = jest.fn();

describe("Google Search API", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      GOOGLE_SEARCH_API_KEY: "test-api-key",
      GOOGLE_CSE_ID: "test-cse-id",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should perform successful Google search", async () => {
    const mockResponse = {
      items: [
        {
          title: "Test Title",
          snippet: "Test snippet",
          link: "https://example.com",
        },
      ],
    };

    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await performGoogleSearch("test query");

    expect(fetch).toHaveBeenCalledWith(
      "https://www.googleapis.com/customsearch/v1?key=test-api-key&cx=test-cse-id&q=test%20query"
    );
    expect(result).toEqual([
      {
        title: "Test Title",
        snippet: "Test snippet",
        url: "https://example.com",
      },
    ]);
  });

  it("should handle empty search results", async () => {
    const mockResponse = { items: undefined };

    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await performGoogleSearch("empty query");

    expect(result).toEqual([]);
  });

  it("should throw error when API key is missing", async () => {
    delete process.env.GOOGLE_SEARCH_API_KEY;

    await expect(performGoogleSearch("test query")).rejects.toThrow(
      "Google Search API key or CSE ID not configured"
    );
  });

  it("should throw error when CSE ID is missing", async () => {
    delete process.env.GOOGLE_CSE_ID;

    await expect(performGoogleSearch("test query")).rejects.toThrow(
      "Google Search API key or CSE ID not configured"
    );
  });

  it("should handle API error response", async () => {
    const mockErrorResponse = {
      error: { message: "API quota exceeded" },
    };

    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      json: async () => mockErrorResponse,
    } as Response);

    await expect(performGoogleSearch("test query")).rejects.toThrow("API quota exceeded");
  });

  it("should handle API error without specific message", async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    } as Response);

    await expect(performGoogleSearch("test query")).rejects.toThrow(
      "Failed to perform Google search"
    );
  });

  it("should handle network errors", async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error("Network error"));

    await expect(performGoogleSearch("test query")).rejects.toThrow("Network error");
  });

  it("should handle malformed JSON response", async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error("Invalid JSON");
      },
    } as unknown as Response);

    await expect(performGoogleSearch("test query")).rejects.toThrow("Invalid JSON");
  });

  it("should properly encode query parameters", async () => {
    const mockResponse = { items: [] };

    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    await performGoogleSearch("test query with spaces & symbols");

    expect(fetch).toHaveBeenCalledWith(
      "https://www.googleapis.com/customsearch/v1?key=test-api-key&cx=test-cse-id&q=test%20query%20with%20spaces%20%26%20symbols"
    );
  });
});

import { createMocks } from "node-mocks-http";
import riskScoresHandler from "../../pages/api/data/risk-scores";
import { scoringEngine } from "../../lib/scoringEngine";
import { mockEnvironmentVariables, mockPrismaClient } from "../testUtils";
import type { NextApiRequest, NextApiResponse } from "next";

// Setup environment variables and database mocks
mockEnvironmentVariables();
mockPrismaClient();

// Mock the scoring engine
jest.mock("../../lib/scoringEngine", () => ({
  scoringEngine: {
    calculateRiskScores: jest.fn(),
    saveScores: jest.fn(),
  },
}));

// Helper to create properly typed mock request
function createMockRequestResponse(options: any = {}) {
  const { req, res } = createMocks(options);
  // Add required env property to mock request
  (req as any).env = {};
  return {
    req: req as unknown as NextApiRequest,
    res: res as unknown as NextApiResponse,
  };
}

describe("/api/data/risk-scores", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 405 for non-GET requests", async () => {
    const { req, res } = createMockRequestResponse({
      method: "POST",
    });

    await riskScoresHandler(req, res);

    expect(res.statusCode).toBe(405);
    expect(JSON.parse((res as any)._getData())).toEqual(
      expect.objectContaining({
        error: "Method POST Not Allowed",
      })
    );
  });

  it("should return 400 if state parameter is missing", async () => {
    const { req, res } = createMockRequestResponse({
      method: "GET",
      query: {},
    });

    await riskScoresHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse((res as any)._getData())).toEqual(
      expect.objectContaining({
        error: "State parameter is required and should be a string",
      })
    );
  });

  it("should return 400 if county parameter is invalid", async () => {
    const { req, res } = createMockRequestResponse({
      method: "GET",
      query: {
        state: "CA",
        county: ["invalid"],
      },
    });

    await riskScoresHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse((res as any)._getData())).toEqual(
      expect.objectContaining({
        error: "County parameter should be a string",
      })
    );
  });

  it("should calculate and return risk scores successfully", async () => {
    const mockScores = [
      {
        dimensionId: 1,
        criteriaId: 1,
        scoreValue: 85,
        confidenceScore: 90,
        rawValue: { data: "test" },
        dataSources: ["data_gov"],
      },
    ];

    (scoringEngine.calculateRiskScores as jest.Mock).mockResolvedValue(mockScores);

    const { req, res } = createMockRequestResponse({
      method: "GET",
      query: {
        state: "CA",
        county: "Los Angeles",
      },
    });

    await riskScoresHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(JSON.parse((res as any)._getData())).toEqual({ data: mockScores });
    expect(scoringEngine.calculateRiskScores).toHaveBeenCalledWith("CA", "Los Angeles");
    expect(scoringEngine.saveScores).toHaveBeenCalledWith(mockScores);
  });

  it("should handle scoring engine errors gracefully", async () => {
    (scoringEngine.calculateRiskScores as jest.Mock).mockRejectedValue(new Error("Scoring failed"));

    const { req, res } = createMockRequestResponse({
      method: "GET",
      query: {
        state: "CA",
      },
    });

    await riskScoresHandler(req, res);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse((res as any)._getData())).toEqual(
      expect.objectContaining({
        error: "Internal server error",
      })
    );
  });

  // Performance test
  it("should respond within acceptable time limits", async () => {
    const mockScores = [{ dimensionId: 1, scoreValue: 85 }];
    (scoringEngine.calculateRiskScores as jest.Mock).mockResolvedValue(mockScores);

    const { req, res } = createMockRequestResponse({
      method: "GET",
      query: { state: "CA" },
    });

    const startTime = Date.now();
    await riskScoresHandler(req, res);
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(responseTime).toBeLessThan(1000); // Response should be under 1 second
    expect(res.statusCode).toBe(200);
  });

  // Load test
  it("should handle multiple concurrent requests", async () => {
    const mockScores = [{ dimensionId: 1, scoreValue: 85 }];
    (scoringEngine.calculateRiskScores as jest.Mock).mockResolvedValue(mockScores);

    const makeRequest = async () => {
      const { req, res } = createMockRequestResponse({
        method: "GET",
        query: { state: "CA" },
      });
      await riskScoresHandler(req, res);
      return res.statusCode;
    };

    const concurrentRequests = Array(10)
      .fill(null)
      .map(() => makeRequest());
    const results = await Promise.all(concurrentRequests);

    results.forEach(statusCode => {
      expect(statusCode).toBe(200);
    });
  });

  // Error handling test
  it("should handle unexpected errors gracefully", async () => {
    (scoringEngine.calculateRiskScores as jest.Mock).mockImplementation(() => {
      throw new Error("Unexpected error");
    });

    const { req, res } = createMockRequestResponse({
      method: "GET",
      query: { state: "CA" },
    });

    await riskScoresHandler(req, res);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse((res as any)._getData())).toEqual(
      expect.objectContaining({
        error: "Internal server error",
      })
    );
  });
});

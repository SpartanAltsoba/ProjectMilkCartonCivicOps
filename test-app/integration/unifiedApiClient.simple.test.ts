import { describe, expect, test, jest, beforeEach, afterEach } from "@jest/globals";

// Mock all dependencies before importing
jest.mock("axios");
jest.mock("../../middleware/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));
jest.mock("../../lib/config", () => ({
  default: {
    COURTLISTENER_TOKEN: "mock-token",
  },
}));

// Mock the API clients directly
jest.mock("../../lib/apiClients/courtListenerClientV2", () => ({
  courtListenerClientV2: {
    searchCases: jest.fn(),
    getCaseDetails: jest.fn(),
    getJudgeHistory: jest.fn(),
    searchCasesWithPagination: jest.fn(),
  },
}));

jest.mock("../../lib/apiClients/dataGovClientV2", () => ({
  dataGovClientV2: {
    getChildWelfareStats: jest.fn(),
    getFosterCareData: jest.fn(),
    getChildAbuseData: jest.fn(),
    getDemographicData: jest.fn(),
    getEducationStats: jest.fn(),
    getJuvenileJusticeStats: jest.fn(),
  },
}));

import { unifiedApiClient } from "../../lib/apiClients/unifiedApiClient";
import { courtListenerClientV2 } from "../../lib/apiClients/courtListenerClientV2";
import { dataGovClientV2 } from "../../lib/apiClients/dataGovClientV2";
import { logger } from "../../lib/logger";

const mockCourtListener = jest.mocked(courtListenerClientV2);
const mockDataGov = jest.mocked(dataGovClientV2);
const mockLogger = jest.mocked(logger);

describe("Unified API Client Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Comprehensive Search", () => {
    test("should successfully fetch and combine data from all sources", async () => {
      // Setup mocks
      mockCourtListener.searchCases.mockResolvedValue([
        {
          id: "test-case-1",
          caseName: "Test Case 1",
          docketNumber: "DC-2023-001",
          court: "Test Court",
          dateDecided: "2023-12-01",
          status: "Decided",
          summary: "Test case summary",
        },
      ]);

      mockDataGov.getChildWelfareStats.mockResolvedValue({
        state: "CA",
        datasetsFound: 5,
        fosterCareEntries: 1000,
      });

      mockDataGov.getFosterCareData.mockResolvedValue({
        state: "CA",
        estimatedFosterChildren: 5000,
      });

      mockDataGov.getChildAbuseData.mockResolvedValue({
        state: "CA",
        reportedCases: 2000,
      });

      const result = await unifiedApiClient.comprehensiveSearch({
        state: "CA",
        county: "San Francisco",
        includeDemographics: true,
        includeEducation: true,
      });

      expect(result).toBeDefined();
      expect(result.location.state).toBe("CA");
      expect(result.location.county).toBe("San Francisco");
      expect(result.courtCases).toHaveLength(1);
      expect(result.dataQuality.completeness).toBeGreaterThan(0);
      expect(mockLogger.info).toHaveBeenCalled();
    });

    test("should handle partial data availability", async () => {
      // Mock successful court listener but failed data.gov
      mockCourtListener.searchCases.mockResolvedValue([
        {
          id: "test-case-1",
          caseName: "Test Case 1",
          docketNumber: "DC-2023-001",
          court: "Test Court",
          dateDecided: "2023-12-01",
          status: "Decided",
          summary: "Test case summary",
        },
      ]);

      mockDataGov.getChildWelfareStats.mockRejectedValue(new Error("API Error"));
      mockDataGov.getFosterCareData.mockRejectedValue(new Error("API Error"));
      mockDataGov.getChildAbuseData.mockRejectedValue(new Error("API Error"));

      const result = await unifiedApiClient.comprehensiveSearch({
        state: "CA",
      });

      expect(result).toBeDefined();
      expect(result.courtCases).toHaveLength(1);
      expect(result.dataQuality.completeness).toBeLessThan(1);
    });

    test("should handle complete API failures gracefully", async () => {
      // Mock all APIs to fail
      mockCourtListener.searchCases.mockRejectedValue(new Error("Court API Error"));
      mockDataGov.getChildWelfareStats.mockRejectedValue(new Error("Data.gov Error"));
      mockDataGov.getFosterCareData.mockRejectedValue(new Error("Data.gov Error"));
      mockDataGov.getChildAbuseData.mockRejectedValue(new Error("Data.gov Error"));

      const result = await unifiedApiClient.comprehensiveSearch({
        state: "CA",
      });

      expect(result).toBeDefined();
      expect(result.dataQuality.completeness).toBeLessThan(1);
    });
  });

  describe("Quick Search", () => {
    test("should return basic information quickly", async () => {
      mockCourtListener.searchCases.mockResolvedValue([
        {
          id: "quick-test-1",
          caseName: "Quick Test Case",
          docketNumber: "QT-2023-001",
          court: "Quick Court",
          dateDecided: "2023-12-01",
          status: "Decided",
          summary: "Quick test summary",
        },
      ]);

      mockDataGov.getChildWelfareStats.mockResolvedValue({
        state: "CA",
        datasetsFound: 3,
      });

      const result = await unifiedApiClient.quickSearch("CA", "San Francisco");

      expect(result).toBeDefined();
      expect(result.courtCases).toBeDefined();
      expect(result.basicStats).toBeDefined();
      expect(mockCourtListener.searchCases).toHaveBeenCalledWith("CA", "San Francisco");
      expect(mockDataGov.getChildWelfareStats).toHaveBeenCalledWith("CA");
    });
  });

  describe("Paginated Search", () => {
    test("should handle pagination correctly", async () => {
      mockCourtListener.searchCasesWithPagination.mockResolvedValue({
        cases: [
          {
            id: "page-test-1",
            caseName: "Paginated Test Case",
            docketNumber: "PT-2023-001",
            court: "Page Court",
            dateDecided: "2023-12-01",
            status: "Decided",
            summary: "Paginated test summary",
          },
        ],
        totalCount: 100,
        hasNext: true,
      });

      mockDataGov.getChildWelfareStats.mockResolvedValue({
        state: "CA",
        datasetsFound: 5,
      });

      const result = await unifiedApiClient.searchWithPagination("CA", "San Francisco", 1, 10);

      expect(result.pagination).toBeDefined();
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
      expect(result.pagination.hasNext).toBe(true);
      expect(mockCourtListener.searchCasesWithPagination).toHaveBeenCalledWith(
        "CA",
        "San Francisco",
        1,
        10
      );
    });
  });

  describe("Health Check", () => {
    test("should report health status of all services", async () => {
      mockCourtListener.searchCases.mockResolvedValue([]);
      mockDataGov.getChildWelfareStats.mockResolvedValue({ state: "CA" });

      const health = await unifiedApiClient.healthCheck();

      expect(health).toHaveProperty("courtListener");
      expect(health).toHaveProperty("dataGov");
      expect(health).toHaveProperty("overall");
      expect(health.overall).toBe(true);
    });

    test("should handle service outages", async () => {
      mockCourtListener.searchCases.mockRejectedValue(new Error("Service Unavailable"));
      mockDataGov.getChildWelfareStats.mockRejectedValue(new Error("Service Unavailable"));

      const health = await unifiedApiClient.healthCheck();

      expect(health.overall).toBe(false);
      expect(health.courtListener).toBe(false);
      expect(health.dataGov).toBe(false);
    });
  });

  describe("Batch Processing", () => {
    test("should process multiple locations in batches", async () => {
      // Mock successful responses for all calls
      mockCourtListener.searchCases.mockResolvedValue([]);
      mockDataGov.getChildWelfareStats.mockResolvedValue({ state: "CA" });
      mockDataGov.getFosterCareData.mockResolvedValue({ state: "CA" });
      mockDataGov.getChildAbuseData.mockResolvedValue({ state: "CA" });

      const locations = [
        { state: "CA", county: "San Francisco" },
        { state: "NY", county: "New York" },
        { state: "TX", county: "Travis" },
      ];

      const results = await unifiedApiClient.batchComprehensiveSearch(locations);

      expect(results).toHaveLength(3);
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Starting batch comprehensive search",
        expect.any(Object)
      );
    });
  });
});

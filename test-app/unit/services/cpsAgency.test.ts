import request from "supertest";
import app from "../test-app/server"; // Adjust path as needed

jest.mock("../lib/aiAgent", () => ({
  analyzeAgencyData: jest.fn().mockResolvedValue("AI grading insights"),
  generateDecisionChainNarrative: jest.fn().mockResolvedValue("Decision chain narrative"),
}));

jest.mock("next-auth/react", () => ({
  getSession: jest.fn().mockResolvedValue({ user: { email: "testuser@example.com" } }),
}));

describe("CPS Agency API and AI Integration", () => {
  it("should return AI grading insights for CPS agency", async () => {
    const response = await request(app)
      .get("/api/data/search")
      .query({ term: "test", source: "cpsAgency", cpsAgencyId: "agency123" })
      .set("Accept", "application/json");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        agencyData: {},
        aiInsights: "AI grading insights",
      },
    ]);
  });

  it("should return decision chain narrative for detailed decision chain", async () => {
    const response = await request(app)
      .get("/api/data/search")
      .query({ term: "test", source: "decisionChain", detailedDecisionChain: "case123" })
      .set("Accept", "application/json");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        caseData: {},
        narrative: "Decision chain narrative",
      },
    ]);
  });

  it("should return 400 if term is missing", async () => {
    const response = await request(app)
      .get("/api/data/search")
      .query({ source: "cpsAgency", cpsAgencyId: "agency123" })
      .set("Accept", "application/json");

    expect(response.status).toBe(400);
  });

  it("should return 401 if not authenticated", async () => {
    const { getSession } = require("next-auth/react");
    getSession.mockResolvedValueOnce(null);

    const response = await request(app)
      .get("/api/data/search")
      .query({ term: "test", source: "cpsAgency", cpsAgencyId: "agency123" })
      .set("Accept", "application/json");

    expect(response.status).toBe(401);
  });
});

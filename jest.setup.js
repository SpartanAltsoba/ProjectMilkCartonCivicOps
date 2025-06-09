const { TextEncoder, TextDecoder } = require("util");
const { mockDeep, mockReset } = require("jest-mock-extended");
const fetch = require("node-fetch");

// Set environment variables for tests
process.env.JWT_SECRET = "test-jwt-secret-key";
process.env.NODE_ENV = "test";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.fetch = fetch;

// Create mock with proper naming convention
const mockPrisma = mockDeep();

// Mock the prisma module
jest.mock("./src/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// Mock Firebase
jest.mock("./src/lib/firebase", () => ({
  db: {
    collection: jest.fn(() => ({
      addDoc: jest.fn(),
      getDocs: jest.fn(),
      query: jest.fn(),
      where: jest.fn(),
    })),
  },
}));

// Mock nookies to avoid cookie setting errors in tests
jest.mock("nookies", () => ({
  setCookie: jest.fn(),
  parseCookies: jest.fn(() => ({})),
  destroyCookie: jest.fn(),
}));

// Mock mailer to avoid email sending in tests
jest.mock("./src/lib/mailer", () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  mockReset(mockPrisma);

  // Only clear fetch mock if it's a mock function
  if (typeof fetch.mockClear === "function") {
    fetch.mockClear();
  }

  // Setup default mock responses
  mockPrisma.riskScore.findMany.mockResolvedValue([{ score: 85 }, { score: 92 }, { score: 78 }]);

  mockPrisma.data.findMany.mockResolvedValue([
    {
      id: 1,
      title: "Test Data",
      summary: "Test summary",
      state: "CA",
      county: "Los Angeles",
      publishedAt: new Date("2023-01-01"),
    },
  ]);
});

module.exports = { prismaMock: mockPrisma };

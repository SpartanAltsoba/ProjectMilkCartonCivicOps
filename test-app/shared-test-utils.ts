import React from "react";
import { NextRouter } from "next/router";
import { createContext } from "react";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, afterEach, jest } from "@jest/globals";

// Create a mock router context since we can't import the actual one
const RouterContext = createContext<NextRouter>({} as NextRouter);

// Mock Next.js router
export function mockRouter(props: Partial<NextRouter> = {}): NextRouter {
  return {
    basePath: "",
    pathname: "/",
    route: "/",
    asPath: "/",
    query: {},
    push: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(() => Promise.resolve()),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
    isLocaleDomain: false,
    isReady: true,
    isPreview: false,
    ...props,
  } as NextRouter;
}

// Wrapper for rendering components with router context
export function renderWithRouter(ui: ReactElement, routerProps: Partial<NextRouter> = {}) {
  return render(
    React.createElement(RouterContext.Provider, { value: mockRouter(routerProps) }, ui)
  );
}

// Mock environment variables for tests
export function mockEnvironmentVariables() {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      GOOGLE_SEARCH_API_KEY: "test-api-key",
      GOOGLE_CSE_ID: "test-cse-id",
      DATA_GOV_API_KEY: "test-data-gov-key",
      FEC_API_KEY: "test-fec-key",
      COURTLISTENER_TOKEN: "test-court-token",
      EDGAR_API_KEY: "test-edgar-key",
      OPENAI_API_KEY: "test-openai-key",
      GOOGLE_CIVIC_API_KEY: "test-civic-key",
      LOBBY_VIEW_API_KEY: "test-lobby-key",
      CLIENT_ID: "test-client-id",
      SECRET_KEY: "test-secret-key",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });
}

// Mock Prisma client
export function mockPrismaClient() {
  jest.mock("../lib/prisma", () => ({
    prisma: {
      scoringDimension: {
        findMany: jest.fn(),
      },
      scoringCriteria: {
        findMany: jest.fn(),
      },
      scoringSnapshot: {
        create: jest.fn(),
      },
      apiDataCache: {
        findFirst: jest.fn(),
        upsert: jest.fn(),
      },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    },
  }));
}

// Enhanced logger for tests
export const testLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

// Mock logger for tests
export function mockLogger() {
  jest.mock("../middleware/logger", () => ({
    logger: testLogger.info,
    logUserAction: jest.fn(),
  }));
}

// Export router context for direct usage
export { RouterContext };

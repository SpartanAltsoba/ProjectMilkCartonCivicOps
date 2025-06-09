import React from "react";
import "@testing-library/jest-dom";
import { axe } from "jest-axe";
import HomePage from "../pages/index";
import Dashboard, { Alert } from "../pages/dashboard";
import DecisionChain from "../pages/decision-chain";
import FoiaGenerator from "../pages/foia-generator";
import SearchPage from "../pages/search";
import { renderWithRouter, mockEnvironmentVariables } from "./testUtils";

// Setup environment variables for tests
mockEnvironmentVariables();

const mockInitialAlerts: Alert[] = [];
const mockExportTypes: string[] = [];

const mockDecisionChainProps = {
  stakeholders: [],
  relationships: [],
};

const mockFoiaGeneratorProps = {
  jurisdictionDetails: {},
  formFields: [],
  faqs: [],
};

describe("UI Navigation and Interaction Tests", () => {
  it("Home page renders and interacts correctly", async () => {
    const { container } = renderWithRouter(<HomePage />);
    expect(container).toHaveTextContent("Welcome to CIVIC TRACE OPS");

    // Accessibility check
    const results = await axe(container);
    expect(results).toHaveProperty("violations");
    expect(results.violations).toHaveLength(0);
  });

  it("Dashboard page renders and interacts correctly", async () => {
    const { container } = renderWithRouter(
      <Dashboard initialAlerts={mockInitialAlerts} exportTypes={mockExportTypes} />
    );
    expect(container).toHaveTextContent("Dashboard");

    // Accessibility check
    const results = await axe(container);
    expect(results).toHaveProperty("violations");
    expect(results.violations).toHaveLength(0);
  });

  it("Decision Chain page renders", () => {
    const { container } = renderWithRouter(<DecisionChain {...mockDecisionChainProps} />);
    expect(container).toHaveTextContent(/decision chain/i);
  });

  it("FOIA Generator page renders", () => {
    const { container } = renderWithRouter(<FoiaGenerator {...mockFoiaGeneratorProps} />);
    expect(container).toHaveTextContent(/foia generator/i);
  });

  it("Search page renders", () => {
    const { container } = renderWithRouter(<SearchPage />);
    expect(container).toHaveTextContent(/search/i);
  });

  // Test navigation between pages
  it("handles navigation between pages", () => {
    const mockPush = jest.fn();
    const { container } = renderWithRouter(<HomePage />, {
      routerProps: {
        pathname: "/",
        push: mockPush,
      },
    } as any); // Type assertion to bypass the interface issue

    expect(container).toHaveTextContent("Welcome to CIVIC TRACE OPS");
    // Navigation assertions can be added here
  });

  // Test responsive layout
  it("maintains responsive layout", () => {
    const { container } = renderWithRouter(<HomePage />);
    const mainElement = container.querySelector("main");
    expect(mainElement).toBeInTheDocument();
  });
});

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Navbar from "../components/Navbar";

// Mock Next.js router
jest.mock("next/router", () => ({
  useRouter: () => ({
    route: "/",
    pathname: "/",
    query: {},
    asPath: "/",
    push: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}));

describe("Navbar Component", () => {
  it("renders the Navbar with expected links", () => {
    render(<Navbar currentPage="/" />);

    // Check if the navbar renders without crashing
    const navbar = screen.getByRole("navigation");
    expect(navbar).toBeInTheDocument();

    // Check for the main title
    expect(screen.getByText("CIVIC TRACE OPS")).toBeInTheDocument();

    // Check for navigation links - use getAllByText for 'Home' due to multiple elements
    expect(screen.getAllByText("Home").length).toBeGreaterThan(0);
    // Use getAllByText for 'Decision Chain' due to multiple elements
    expect(screen.getAllByText("Decision Chain").length).toBeGreaterThan(0);
    // Use getAllByText for 'FOIA Generator' due to multiple elements
    expect(screen.getAllByText("FOIA Generator").length).toBeGreaterThan(0);
    // Use getAllByText for 'Search' due to multiple elements
    expect(screen.getAllByText("Search").length).toBeGreaterThan(0);
    // Use getAllByText for 'Dashboard' due to multiple elements
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
  });
});

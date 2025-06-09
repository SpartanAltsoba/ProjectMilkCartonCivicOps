import React, { useState, useCallback } from "react";
import { NextPage } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { logUserAction } from "../middleware/logger";
import Head from "next/head";

// Dynamic imports for code splitting
const Navbar = dynamic(() => import("../components/Navbar"));
const ScenarioInput = dynamic(() => import("../components/ScenarioInput"));
const LoadingSpinner = dynamic(() => import("../components/LoadingSpinner"));
const Footer = dynamic(() => import("../components/Footer"));

const SearchPage: NextPage = () => {
  const [state, setState] = useState("");
  const [county, setCounty] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [scenario, setScenario] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [civicData, setCivicData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleZipCodeChange = useCallback((value: string, data?: any) => {
    setZipCode(value);
    if (data && data.normalizedInput) {
      setCity(data.normalizedInput.city);
      setState(data.normalizedInput.state);
      // Auto-resolve county from civic data if available
      if (data.offices && data.offices.length > 0) {
        // Try to extract county from office names or other data
        const countyOffice = data.offices.find((office: any) =>
          office.name.toLowerCase().includes("county")
        );
        if (countyOffice) {
          const countyName = countyOffice.name.replace(/county.*$/i, "").trim();
          setCounty(countyName);
        }
      }
      setCivicData(data);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!zipCode || zipCode.length !== 5) {
      setError("Please enter a valid ZIP code");
      return;
    }
    if (!scenario) {
      setError("Please select an investigation scenario");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Log the search action
      logUserAction("search", {
        location: `${city}, ${county}, ${state}`,
        zipCode,
        scenario,
        civicData,
        searchQuery: searchQuery || "General Investigation",
      });

      // Call Firebase Cloud Function runSearchAgent
      const response = await fetch(
        "https://us-central1-civic-trace-ops.cloudfunctions.net/runSearchAgent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            location: {
              state,
              county,
              city,
              zipCode,
            },
            scenario,
            civicData,
            searchQuery: searchQuery || "General child welfare investigation",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Search failed");
      }

      const searchResult = await response.json();

      // Store result in localStorage and redirect to results page
      localStorage.setItem("searchResult", JSON.stringify(searchResult));
      router.push("/results");
    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, [state, county, city, zipCode, scenario, civicData, searchQuery, router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Head>
        <title>CIVIC TRACE OPS - Investigation Search</title>
        <meta
          name="description"
          content="Run comprehensive investigations into child welfare systems"
        />
      </Head>

      <Navbar />

      <div className="main-container">
        {/* Left Panel */}
        <div className="side-panel">
          <div className="panel-logo">
            <img src="/images/logos/logo1.jpg" alt="Logo" className="panel-logo-img" />
          </div>
          <h2>Quick Links</h2>
          <ul>
            <li>
              <button onClick={() => router.push("/")} className="h2-link w-full text-left">
                Home
              </button>
            </li>
            <li>
              <button
                onClick={() => router.push("/dashboard")}
                className="h2-link w-full text-left"
              >
                Dashboard
              </button>
            </li>
            <li>
              <button onClick={() => router.push("/results")} className="h2-link w-full text-left">
                Recent Results
              </button>
            </li>
          </ul>
        </div>

        {/* Center Panel */}
        <div
          className="center-panel"
          style={{ display: "flex", flexDirection: "column", padding: "2rem" }}
        >
          <div style={{ maxWidth: "800px", margin: "0 auto", width: "100%" }}>
            {/* Header Section */}
            <div className="glass-panel" style={{ marginBottom: "2rem", textAlign: "center" }}>
              <h1
                style={{
                  fontSize: "2.5rem",
                  fontWeight: "900",
                  color: "black",
                  marginBottom: "1rem",
                }}
              >
                Civic Intelligence Investigation
              </h1>
              <p style={{ fontSize: "1.2rem", fontWeight: "bold", color: "black" }}>
                Enter location details to run comprehensive child welfare system analysis
              </p>
            </div>

            {/* Investigation Form */}
            <div className="glass-panel" style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "900",
                  color: "black",
                  marginBottom: "1.5rem",
                }}
              >
                Investigation Setup
              </h2>

              <ScenarioInput
                value={scenario}
                zipCode={zipCode}
                onChange={setScenario}
                onZipCodeChange={handleZipCodeChange}
              />
            </div>

            {/* Optional Search Query */}
            <div className="glass-panel" style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "900",
                  color: "black",
                  marginBottom: "1.5rem",
                }}
              >
                Additional Search (Optional)
              </h2>
              <div>
                <label
                  htmlFor="searchQuery"
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    fontWeight: "900",
                    color: "black",
                    marginBottom: "0.5rem",
                  }}
                >
                  Specific Focus or Keywords
                </label>
                <input
                  type="text"
                  id="searchQuery"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="glass-input"
                  placeholder="e.g., foster care, CPS response times, budget allocation..."
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="glass-panel">
              <button
                type="submit"
                disabled={loading || !zipCode || !scenario}
                onClick={handleSubmit}
                className="glass-button"
                style={{
                  width: "100%",
                  padding: "1.5rem",
                  fontSize: "1.5rem",
                  fontWeight: "900",
                  opacity: loading || !zipCode || !scenario ? 0.5 : 1,
                  cursor: loading || !zipCode || !scenario ? "not-allowed" : "pointer",
                }}
              >
                {loading ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <LoadingSpinner size="small" />
                    <span>Running Investigation...</span>
                  </div>
                ) : (
                  "🔍 RUN INVESTIGATION"
                )}
              </button>
            </div>

            {error && (
              <div
                className="glass-panel"
                style={{ marginTop: "1rem", backgroundColor: "rgba(255, 0, 0, 0.1)" }}
              >
                <h3 style={{ color: "#dc2626", fontWeight: "900", marginBottom: "0.5rem" }}>
                  Error
                </h3>
                <p style={{ color: "#dc2626" }}>{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="side-panel">
          <div className="panel-logo">
            <img src="/images/logos/logo2.jpg" alt="Logo 2" className="panel-logo-img" />
          </div>
          <h2>System Status</h2>
          <div className="stats-window">
            <h3>AI Agents</h3>
            <p style={{ color: "green", fontWeight: "900" }}>✅ Search Agent</p>
            <p style={{ color: "green", fontWeight: "900" }}>✅ Scoring Agent</p>
            <p style={{ color: "green", fontWeight: "900" }}>✅ FOIA Agent</p>
            <p style={{ color: "green", fontWeight: "900" }}>✅ Decision Graph Agent</p>
            <p style={{ color: "green", fontWeight: "900" }}>✅ NGO Mapping Agent</p>
          </div>

          <div className="stats-window" style={{ marginTop: "1rem" }}>
            <h3>Recent Stats</h3>
            <p className="total-2025">2025 Cases: 157</p>
            <p className="total-2024">2024 Cases: 892</p>
            <p className="total-2023">2023 Cases: 1,245</p>
            <p className="total-kids">Total: 2,294</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SearchPage;

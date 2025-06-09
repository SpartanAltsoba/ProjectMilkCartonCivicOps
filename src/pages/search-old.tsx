import React, { useState, useCallback, useEffect } from "react";
import { NextPage } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { logUserAction } from "../middleware/logger";
import Head from "next/head";
import "../styles/search-page.css";

// Dynamic imports for code splitting
const Navbar = dynamic(() => import("../components/Navbar"));
const StateCountySelector = dynamic(() => import("../components/StateCountySelector"));
const LoadingSpinner = dynamic(() => import("../components/LoadingSpinner"));
const Footer = dynamic(() => import("../components/Footer"));

const SearchPage: NextPage = () => {
  const [state, setState] = useState("");
  const [county, setCounty] = useState("");
  const [city, setCity] = useState("");
  const [scenarioType, setScenarioType] = useState("");
  const [scenarioDetails, setScenarioDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statesData, setStatesData] = useState<string[]>([]);
  const [countiesData, setCountiesData] = useState<Record<string, string[]>>({});
  const router = useRouter();

  // Load states and counties data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/api/locations");
        if (response.ok) {
          const data = await response.json();
          setStatesData(data.states || []);
          setCountiesData(data.counties || {});
        } else {
          // Fallback data
          const fallbackData = {
            states: ["California", "Texas", "Florida", "New York", "Pennsylvania"],
            counties: {
              California: ["Los Angeles", "San Francisco", "Orange", "San Diego", "Sacramento"],
              Texas: ["Harris", "Dallas", "Tarrant", "Bexar", "Travis"],
              Florida: ["Miami-Dade", "Broward", "Palm Beach", "Hillsborough", "Orange"],
              "New York": ["New York", "Kings", "Queens", "Suffolk", "Nassau"],
              Pennsylvania: ["Philadelphia", "Allegheny", "Montgomery", "Bucks", "Chester"],
            },
          };
          setStatesData(fallbackData.states);
          setCountiesData(fallbackData.counties);
        }
      } catch (err) {
        console.error("Error loading location data:", err);
        // Use fallback data
        const fallbackData = {
          states: ["California", "Texas", "Florida", "New York", "Pennsylvania"],
          counties: {
            California: ["Los Angeles", "San Francisco", "Orange", "San Diego", "Sacramento"],
            Texas: ["Harris", "Dallas", "Tarrant", "Bexar", "Travis"],
            Florida: ["Miami-Dade", "Broward", "Palm Beach", "Hillsborough", "Orange"],
            "New York": ["New York", "Kings", "Queens", "Suffolk", "Nassau"],
            Pennsylvania: ["Philadelphia", "Allegheny", "Montgomery", "Bucks", "Chester"],
          },
        };
        setStatesData(fallbackData.states);
        setCountiesData(fallbackData.counties);
      }
    };

    loadData();
  }, []);

  const scenarios = [
    "Mandated Reporter Investigation",
    "Foster Care Placement",
    "Runaway Recovery",
    "Parental Rights Termination",
    "NGO Contract Oversight",
    "Mental Health Referral",
    "Federal Audit Response",
    "State Policy Implementation",
    "Court Petition Filing",
    "CPS Investigation",
  ];

  const handleSubmit = useCallback(async () => {
    if (!state || !county || !city || !scenarioType || !scenarioDetails) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Log the search action
      logUserAction("search", {
        location: `${city}, ${county}, ${state}`,
        scenario: `${scenarioType}: ${scenarioDetails}`,
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
            },
            scenario: {
              type: scenarioType,
              details: scenarioDetails,
            },
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
  }, [state, county, city, scenarioType, scenarioDetails, router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Head>
        <title>CIVIC TRACE OPS - Investigation Search</title>
        <meta
          name="description"
          content="Run comprehensive investigations into child welfare systems, agencies, and decision chains"
        />
      </Head>

      <Navbar />

      <div className="main-container min-h-screen">
        {/* Left Panel */}
        <div className="side-panel h-full">
          <div className="panel-logo">
            <img src="/images/logos/logo1.jpg" alt="Logo" className="panel-logo-img" />
          </div>
          <h2>Quick Links</h2>
          <ul>
            <li>
              <a href="/dashboard" className="h2-link">
                Dashboard
              </a>
            </li>
            <li>
              <a href="/analysis" className="h2-link">
                Analysis
              </a>
            </li>
            <li>
              <a href="/foia-generator" className="h2-link">
                FOIA Generator
              </a>
            </li>
          </ul>
        </div>

        {/* Center Panel */}
        <div className="center-panel flex-grow">
          <div
            className="max-w-3xl mx-auto px-8 py-6 overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 4rem)" }}
          >
            {/* Header Section */}
            <div className="glass-panel mb-8">
              <h1 className="text-3xl font-black text-black text-center mb-4">
                Civic Intelligence Investigation
              </h1>
              <p className="text-black font-bold text-center text-lg">
                Run comprehensive investigations into child welfare systems, agencies, and decision
                chains
              </p>
            </div>

            {/* Location Section */}
            <div className="glass-panel mb-6">
              <h2 className="text-xl font-black text-black mb-4">Location Details</h2>
              <StateCountySelector
                states={statesData}
                counties={countiesData}
                selectedState={state}
                selectedCounty={county}
                onStateChange={setState}
                onCountyChange={setCounty}
              />
              <div className="mt-4">
                <label htmlFor="city" className="block text-sm font-black text-black mb-2">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="glass-input w-full"
                  placeholder="Enter city name"
                  required
                />
              </div>
            </div>

            {/* Scenario Section */}
            <div className="glass-panel mb-6">
              <h2 className="text-xl font-black text-black mb-4">Investigation Scenario</h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="scenarioType"
                    className="block text-sm font-black text-black mb-2"
                  >
                    Scenario Type
                  </label>
                  <select
                    id="scenarioType"
                    value={scenarioType}
                    onChange={e => setScenarioType(e.target.value)}
                    className="glass-input w-full"
                    required
                  >
                    <option value="">Select a scenario type...</option>
                    {scenarios.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="scenarioDetails"
                    className="block text-sm font-black text-black mb-2"
                  >
                    Scenario Details
                  </label>
                  <textarea
                    id="scenarioDetails"
                    value={scenarioDetails}
                    onChange={e => setScenarioDetails(e.target.value)}
                    className="glass-input w-full h-32"
                    placeholder="Describe the specific details of your investigation scenario..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Section */}
            <div className="glass-panel">
              <button
                type="submit"
                disabled={
                  loading || !state || !county || !city || !scenarioType || !scenarioDetails
                }
                onClick={handleSubmit}
                className={`glass-button w-full py-4 text-xl font-black ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <LoadingSpinner size="small" />
                    <span>Running Investigation...</span>
                  </div>
                ) : (
                  "Run Investigation"
                )}
              </button>
            </div>

            {error && (
              <div className="glass-panel bg-red-50 mt-4">
                <h3 className="text-red-800 font-black mb-2">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="side-panel h-full">
          <div className="panel-logo">
            <img src="/images/logos/logo2.jpg" alt="Logo 2" className="panel-logo-img" />
          </div>
          <h2>Recent Investigations</h2>
          <div className="stats-window">
            <h3>Investigation Stats</h3>
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

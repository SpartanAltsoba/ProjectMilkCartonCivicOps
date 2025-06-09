import React, { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { GetServerSideProps } from "next";
import { RiskScore, Alert, StatesCounties } from "../types/dashboard";
import ErrorBoundary from "../components/ErrorBoundary";
import { fetchStatesCounties, fetchRiskScores, fetchAlerts } from "../api/data";

const Navbar = dynamic(() => import("../components/Navbar"));
const StateCountySelector = dynamic(() => import("../components/StateCountySelector"));
const RiskScoreDashboard = dynamic(() => import("../components/RiskScoreDashboard"));
const Footer = dynamic(() => import("../components/Footer"));

interface HomePageProps {
  statesCounties: StatesCounties;
}

const HomePage: React.FC<HomePageProps> = ({ statesCounties }) => {
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  const [riskScores, setRiskScores] = useState<RiskScore[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const loadRiskScores = useCallback(async () => {
    if (selectedState && selectedCounty) {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchRiskScores(selectedState, selectedCounty);
        setRiskScores(data);
        // Also fetch alerts for the selected location
        const alertsData = await fetchAlerts(selectedState, selectedCounty);
        setAlerts(alertsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data for the selected location.");
        setRiskScores([]);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    } else {
      // Reset data when no location is selected
      setRiskScores([]);
      setAlerts([]);
    }
  }, [selectedState, selectedCounty]);

  // Load data when location changes
  useEffect(() => {
    loadRiskScores();
  }, [selectedState, selectedCounty, loadRiskScores]);

  // Handle location changes
  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedCounty(""); // Reset county when state changes
  };

  const handleCountyChange = (county: string) => {
    setSelectedCounty(county);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Head>
        <title>CIVIC TRACE OPS - Empowering Child Welfare Investigations</title>
        <meta
          name="description"
          content="CIVIC TRACE OPS is a platform to investigate, map, and report on child welfare systems with data visualizations and automated FOIA requests reporting."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar currentPage="Home" />

      <main style={{ flexGrow: 1, padding: "2rem" }}>
        {/* Hero Section */}
        <div className="glass-panel" style={{ marginBottom: "2rem", textAlign: "center" }}>
          <h1 className="page-title" style={{ marginBottom: "1rem" }}>
            Welcome to CIVIC TRACE OPS
          </h1>
          <p
            style={{
              color: "var(--jet-black)",
              fontWeight: "700",
              textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
              fontSize: "1.2rem",
              marginBottom: "1.5rem",
            }}
          >
            Empowering Child Welfare Investigations Through Data-Driven Analysis
          </p>
          <p
            style={{
              color: "var(--jet-black)",
              fontWeight: "700",
              textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
              lineHeight: "1.6",
            }}
          >
            A comprehensive platform to investigate, map, and report on child welfare systems with
            advanced data visualizations and automated FOIA request reporting.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="glass-panel" style={{ marginBottom: "2rem" }}>
          <h2
            style={{
              color: "var(--jet-black)",
              fontWeight: "900",
              textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
              marginBottom: "1.5rem",
              textAlign: "center",
            }}
          >
            Quick Actions
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1rem",
            }}
          >
            <a
              href="/search"
              className="glass-button"
              style={{
                textDecoration: "none",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>Search Database</span>
              <small style={{ opacity: 0.8 }}>Find legal documents, policies, and data</small>
            </a>

            <a
              href="/analysis"
              className="glass-button"
              style={{
                textDecoration: "none",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <span>Decision Chain Analysis</span>
              <small style={{ opacity: 0.8 }}>Analyze child welfare decision processes</small>
            </a>

            <a
              href="/foia-generator"
              className="glass-button"
              style={{
                textDecoration: "none",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10,9 9,9 8,9" />
              </svg>
              <span>FOIA Generator</span>
              <small style={{ opacity: 0.8 }}>Generate Freedom of Information Act requests</small>
            </a>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div
            className="glass-panel"
            style={{
              border: "3px solid #dc2626",
              background: "rgba(239, 68, 68, 0.1)",
              marginBottom: "2rem",
            }}
          >
            <div
              style={{
                color: "#dc2626",
                fontWeight: "700",
                textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
              }}
            >
              {error}
            </div>
          </div>
        )}

        {/* State/County Selector */}
        <div className="glass-panel" style={{ marginBottom: "2rem" }}>
          <h2
            style={{
              color: "var(--jet-black)",
              fontWeight: "900",
              textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
              marginBottom: "1.5rem",
              textAlign: "center",
            }}
          >
            Risk Score Dashboard
          </h2>
          <StateCountySelector
            states={statesCounties.states}
            counties={statesCounties.counties}
            selectedState={selectedState}
            selectedCounty={selectedCounty}
            onStateChange={handleStateChange}
            onCountyChange={handleCountyChange}
          />
        </div>

        {/* Risk Dashboard */}
        <div className="glass-panel">
          <ErrorBoundary>
            <RiskScoreDashboard riskScores={riskScores} alerts={alerts} loading={loading} />
          </ErrorBoundary>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const statesCounties = await fetchStatesCounties();
    return { props: { statesCounties } };
  } catch (error) {
    console.error("Error fetching states and counties:", error);
    return { props: { statesCounties: { states: [], counties: {} } } };
  }
};

export default HomePage;

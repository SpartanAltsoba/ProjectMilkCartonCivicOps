import React, { useEffect, useState, useCallback } from "react";
import { NextPage } from "next";
import dynamic from "next/dynamic";
import { Alert, RiskScore } from "../types/dashboard";
import withPageAuth from "../middleware/pageAuth";

// Dynamic imports for code splitting
const Navbar = dynamic(() => import("../components/common/Navbar"));
const RiskScoreDashboard = dynamic(() => import("../components/RiskScoreDashboard"));
const ExportOptions = dynamic(() => import("../components/ExportOptions"));
const Footer = dynamic(() => import("../components/Footer"));

const Dashboard: NextPage = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [riskScores, setRiskScores] = useState<RiskScore[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch alerts from API
        const alertsResponse = await fetch("/api/data/alerts");
        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json();
          setAlerts(alertsData);
        }

        // Fetch risk scores from API
        const scoresResponse = await fetch("/api/data/risk-scores");
        if (scoresResponse.ok) {
          const scoresData = await scoresResponse.json();
          setRiskScores(scoresData.data?.scores || []);
        }

        setError(null);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleExport = useCallback((selectedOptions: string[]) => {
    console.log("Exporting with options:", selectedOptions);
    // Implement export logic here
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar currentPage="Dashboard" />
        <main style={{ flexGrow: 1, padding: "2rem" }}>
          <div className="glass-panel" style={{ textAlign: "center" }}>
            <h1 className="page-title" style={{ marginBottom: "1rem" }}>
              Dashboard
            </h1>
            <div
              style={{
                color: "var(--jet-black)",
                fontWeight: "700",
                textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
              }}
            >
              Loading...
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar currentPage="Dashboard" />
      <main style={{ flexGrow: 1, padding: "2rem" }}>
        {/* Title Section */}
        <div className="glass-panel" style={{ marginBottom: "2rem", textAlign: "center" }}>
          <h1 className="page-title" style={{ marginBottom: "1rem" }}>
            Dashboard
          </h1>
          <p
            style={{
              color: "var(--jet-black)",
              fontWeight: "700",
              textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
              fontSize: "1.2rem",
            }}
          >
            Monitor risk scores and system alerts in real-time
          </p>
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

        {/* Risk Score Dashboard */}
        <div className="glass-panel" style={{ marginBottom: "2rem" }}>
          <h2
            style={{
              color: "var(--jet-black)",
              fontWeight: "900",
              textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
              marginBottom: "1.5rem",
            }}
          >
            Risk Score Analysis
          </h2>
          <RiskScoreDashboard alerts={alerts} riskScores={riskScores} />
        </div>

        {/* Export Options */}
        <div className="glass-panel">
          <h2
            style={{
              color: "var(--jet-black)",
              fontWeight: "900",
              textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
              marginBottom: "1.5rem",
            }}
          >
            Export Data
          </h2>
          <ExportOptions
            exportTypes={["pdf", "csv", "json"]}
            onExport={(format: string) => handleExport([format])}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default withPageAuth(Dashboard);

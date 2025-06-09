import React, { useState } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { DecisionChainData } from "../types/analysis";

const Navbar = dynamic(() => import("../components/Navbar"));
const Footer = dynamic(() => import("../components/Footer"));

const AnalysisPage: React.FC = () => {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState("");
  const [selectedScenario, setSelectedScenario] = useState("");
  const [analysisResult, setAnalysisResult] = useState<DecisionChainData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAnalysis = async () => {
    if (!selectedJurisdiction || !selectedScenario) {
      setError("Please select both jurisdiction and scenario");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jurisdiction: selectedJurisdiction,
          scenario: selectedScenario,
        }),
      });

      if (!response.ok) {
        throw new Error("Analysis request failed");
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err) {
      setError("Failed to perform analysis. Please try again.");
      console.error("Analysis error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    try {
      return new Date(dateStr || new Date()).toLocaleString();
    } catch {
      return new Date().toLocaleString();
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Head>
        <title>CIVIC TRACE OPS - Decision Chain Analysis</title>
        <meta
          name="description"
          content="Analyze child welfare decision chains and processes across different jurisdictions"
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
              <button onClick={() => router.push("/search")} className="h2-link w-full text-left">
                Search Database
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
            {/* Title Section */}
            <div className="glass-panel" style={{ marginBottom: "2rem", textAlign: "center" }}>
              <h1 className="page-title" style={{ marginBottom: "1rem" }}>
                Decision Chain Analysis
              </h1>
              <p
                style={{
                  color: "var(--jet-black)",
                  fontWeight: "700",
                  textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
                  fontSize: "1.2rem",
                }}
              >
                Analyze child welfare decision processes using OpenAI GPT-4
              </p>
            </div>

            {/* Analysis Form */}
            <div className="glass-panel" style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  color: "var(--jet-black)",
                  fontWeight: "900",
                  textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
                  marginBottom: "1.5rem",
                }}
              >
                Analysis Parameters
              </h2>

              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  htmlFor="jurisdiction-select"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    color: "var(--jet-black)",
                    fontWeight: "700",
                    textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
                  }}
                >
                  Jurisdiction
                </label>
                <select
                  id="jurisdiction-select"
                  className="glass-input"
                  value={selectedJurisdiction}
                  onChange={e => setSelectedJurisdiction(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <option value="">Select a jurisdiction</option>
                  <option value="wa-king">King County, WA</option>
                  <option value="ca-la">Los Angeles County, CA</option>
                  <option value="ny-nyc">New York City, NY</option>
                  <option value="tx-harris">Harris County, TX</option>
                  <option value="fl-miami">Miami-Dade County, FL</option>
                </select>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  htmlFor="scenario-select"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    color: "var(--jet-black)",
                    fontWeight: "700",
                    textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
                  }}
                >
                  Scenario Type
                </label>
                <select
                  id="scenario-select"
                  className="glass-input"
                  value={selectedScenario}
                  onChange={e => setSelectedScenario(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <option value="">Select a scenario</option>
                  <option value="initial-report">Initial Report Processing</option>
                  <option value="investigation">Investigation Process</option>
                  <option value="placement">Placement Decision</option>
                  <option value="reunification">Reunification Assessment</option>
                  <option value="court-proceedings">Court Proceedings</option>
                  <option value="case-closure">Case Closure</option>
                </select>
              </div>

              <button
                className="glass-button"
                onClick={handleAnalysis}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "1rem",
                  fontSize: "1.2rem",
                  fontWeight: "900",
                }}
              >
                {loading ? "🤖 Analyzing with OpenAI..." : "🔍 ANALYZE DECISION CHAIN"}
              </button>
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

            {/* Results Display */}
            {analysisResult && (
              <div className="glass-panel">
                <h2
                  style={{
                    color: "var(--jet-black)",
                    fontWeight: "900",
                    textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
                    marginBottom: "1.5rem",
                  }}
                >
                  OpenAI Analysis Results
                </h2>

                {/* Key Findings */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <h3
                    style={{
                      color: "var(--jet-black)",
                      fontWeight: "800",
                      textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
                      marginBottom: "1rem",
                    }}
                  >
                    Key Findings
                  </h3>
                  <ul style={{ listStyle: "disc", paddingLeft: "1.5rem" }}>
                    {analysisResult.findings?.map((finding: string, index: number) => (
                      <li
                        key={index}
                        style={{
                          color: "var(--jet-black)",
                          fontWeight: "700",
                          textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {finding}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <h3
                    style={{
                      color: "var(--jet-black)",
                      fontWeight: "800",
                      textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
                      marginBottom: "1rem",
                    }}
                  >
                    Recommendations
                  </h3>
                  <ul style={{ listStyle: "disc", paddingLeft: "1.5rem" }}>
                    {analysisResult.recommendations?.map((rec: string, index: number) => (
                      <li
                        key={index}
                        style={{
                          color: "var(--jet-black)",
                          fontWeight: "700",
                          textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Raw Analysis if available */}
                {analysisResult.rawAnalysis && (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <h3
                      style={{
                        color: "var(--jet-black)",
                        fontWeight: "800",
                        textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
                        marginBottom: "1rem",
                      }}
                    >
                      Detailed Analysis
                    </h3>
                    <div
                      style={{
                        background: "rgba(0, 0, 0, 0.1)",
                        padding: "1rem",
                        borderRadius: "8px",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        whiteSpace: "pre-wrap",
                        color: "var(--jet-black)",
                        fontWeight: "600",
                        textShadow: "0 0 2px rgba(255, 255, 255, 0.5)",
                      }}
                    >
                      {analysisResult.rawAnalysis}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                {analysisResult.metadata && (
                  <div style={{ fontSize: "0.9rem", color: "var(--jet-black)", fontWeight: "600" }}>
                    <p>Generated: {formatDate(analysisResult.metadata.generatedAt)}</p>
                    <p>AI Model: {analysisResult.metadata.aiModel || "GPT-4"}</p>
                    {analysisResult.metadata.confidence && (
                      <p>Confidence: {(analysisResult.metadata.confidence * 100).toFixed(1)}%</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="side-panel">
          <div className="panel-logo">
            <img src="/images/logos/logo2.jpg" alt="Logo 2" className="panel-logo-img" />
          </div>
          <h2>AI Analysis</h2>
          <div className="stats-window">
            <h3>OpenAI Status</h3>
            <p style={{ color: "green", fontWeight: "900" }}>✅ GPT-4 Active</p>
            <p style={{ color: "green", fontWeight: "900" }}>✅ Analysis Ready</p>
            <p style={{ color: "green", fontWeight: "900" }}>✅ Real-time Processing</p>
          </div>

          <div className="stats-window" style={{ marginTop: "1rem" }}>
            <h3>Analysis Types</h3>
            <p className="total-2025">Decision Chains</p>
            <p className="total-2024">Performance Metrics</p>
            <p className="total-2023">Recommendations</p>
            <p className="total-kids">Bottleneck Detection</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AnalysisPage;

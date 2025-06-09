import React, { useState } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { FOIARequest } from "../types/foia";

const Navbar = dynamic(() => import("../components/Navbar"));
const Footer = dynamic(() => import("../components/Footer"));

const FOIAGeneratorPage: React.FC = () => {
  const [request, setRequest] = useState<FOIARequest>({
    jurisdiction: "",
    agency: "",
    requestType: "",
    dateRange: {
      start: "",
      end: "",
    },
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedRequest, setGeneratedRequest] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-foia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error("Failed to generate FOIA request");
      }

      const data = await response.json();
      setGeneratedRequest(data.request);
    } catch (err) {
      setError("Failed to generate FOIA request. Please try again.");
      console.error("FOIA generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      if (parent === "dateRange") {
        setRequest(prev => ({
          ...prev,
          dateRange: {
            ...prev.dateRange,
            [child]: value,
          },
        }));
      }
    } else {
      setRequest(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Head>
        <title>FOIA Request Generator - CIVIC TRACE OPS</title>
        <meta
          name="description"
          content="Generate professional FOIA requests for child welfare data and documents"
        />
      </Head>

      <Navbar currentPage="FOIA Generator" />

      <main style={{ flexGrow: 1, padding: "2rem" }}>
        {/* Title Section */}
        <div className="glass-panel" style={{ marginBottom: "2rem", textAlign: "center" }}>
          <h1 className="page-title" style={{ marginBottom: "1rem" }}>
            FOIA Request Generator
          </h1>
          <p
            style={{
              color: "var(--jet-black)",
              fontWeight: "700",
              textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
              fontSize: "1.2rem",
            }}
          >
            Generate professional Freedom of Information Act requests for child welfare data
          </p>
        </div>

        {/* FOIA Request Form */}
        <form onSubmit={handleSubmit} className="glass-panel" style={{ marginBottom: "2rem" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="jurisdiction"
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
              id="jurisdiction"
              name="jurisdiction"
              className="glass-input"
              value={request.jurisdiction}
              onChange={handleInputChange}
              required
              style={{ width: "100%" }}
            >
              <option value="">Select a jurisdiction</option>
              <option value="wa-king">King County, WA</option>
              <option value="ca-la">Los Angeles County, CA</option>
              <option value="ny-nyc">New York City, NY</option>
            </select>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="agency"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "var(--jet-black)",
                fontWeight: "700",
                textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
              }}
            >
              Agency
            </label>
            <select
              id="agency"
              name="agency"
              className="glass-input"
              value={request.agency}
              onChange={handleInputChange}
              required
              style={{ width: "100%" }}
            >
              <option value="">Select an agency</option>
              <option value="dcyf">Department of Children, Youth & Families</option>
              <option value="dcfs">Department of Children & Family Services</option>
              <option value="acs">Administration for Children&apos;s Services</option>
            </select>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="requestType"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "var(--jet-black)",
                fontWeight: "700",
                textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
              }}
            >
              Request Type
            </label>
            <select
              id="requestType"
              name="requestType"
              className="glass-input"
              value={request.requestType}
              onChange={handleInputChange}
              required
              style={{ width: "100%" }}
            >
              <option value="">Select request type</option>
              <option value="case-data">Case Data</option>
              <option value="policies">Policies & Procedures</option>
              <option value="contracts">Contracts & Agreements</option>
              <option value="reports">Reports & Statistics</option>
            </select>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="dateRange.start"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "var(--jet-black)",
                fontWeight: "700",
                textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
              }}
            >
              Date Range
            </label>
            <div style={{ display: "flex", gap: "1rem" }}>
              <input
                type="date"
                id="dateRange.start"
                name="dateRange.start"
                className="glass-input"
                value={request.dateRange.start}
                onChange={handleInputChange}
                required
                style={{ flex: 1 }}
              />
              <input
                type="date"
                id="dateRange.end"
                name="dateRange.end"
                className="glass-input"
                value={request.dateRange.end}
                onChange={handleInputChange}
                required
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="description"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "var(--jet-black)",
                fontWeight: "700",
                textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
              }}
            >
              Request Description
            </label>
            <textarea
              id="description"
              name="description"
              className="glass-input"
              value={request.description}
              onChange={handleInputChange}
              required
              rows={4}
              style={{ width: "100%", resize: "vertical" }}
              placeholder="Describe the specific records or information you are requesting..."
            />
          </div>

          <button
            type="submit"
            className="glass-button"
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? "Generating..." : "Generate FOIA Request"}
          </button>
        </form>

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

        {/* Generated Request Display */}
        {generatedRequest && (
          <div className="glass-panel">
            <h2
              style={{
                color: "var(--jet-black)",
                fontWeight: "900",
                textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
                marginBottom: "1.5rem",
              }}
            >
              Generated FOIA Request
            </h2>

            <div
              style={{
                whiteSpace: "pre-wrap",
                fontFamily: "monospace",
                padding: "1.5rem",
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "var(--jet-black)",
                fontWeight: "500",
                textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
                marginBottom: "1.5rem",
              }}
            >
              {generatedRequest}
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                className="glass-button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedRequest);
                }}
                style={{ flex: 1 }}
              >
                Copy to Clipboard
              </button>
              <button
                className="glass-button"
                onClick={() => {
                  const blob = new Blob([generatedRequest], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "FOIA_Request.txt";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                style={{ flex: 1 }}
              >
                Download as Text
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default FOIAGeneratorPage;

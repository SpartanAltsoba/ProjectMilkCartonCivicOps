import React, { useState, useEffect } from "react";
import { NextPage } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import Head from "next/head";

// Dynamic imports for code splitting
const Navbar = dynamic(() => import("../components/Navbar"));
const Footer = dynamic(() => import("../components/Footer"));
const DecisionChainViewer = dynamic(() => import("../components/DecisionChainViewer"));

interface DiagramData {
  pumlContent: string;
  nodes: Array<{
    id: string;
    type: "agency" | "worker" | "ngo" | "grant" | "contract" | "legal";
    title: string;
    details: {
      description?: string;
      amount?: number;
      date?: string;
      status?: string;
      contact?: string;
      jurisdiction?: string;
      [key: string]: any;
    };
  }>;
  metadata: {
    location: string;
    scenario: string;
    generatedAt: string;
  };
}

const DiagramPage: NextPage = () => {
  const [diagramData, setDiagramData] = useState<DiagramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedResult = localStorage.getItem("searchResult");
      if (storedResult) {
        const result = JSON.parse(storedResult);
        if (result.decisionChain) {
          setDiagramData({
            pumlContent: result.decisionChain.pumlContent || generateSamplePuml(),
            nodes: result.decisionChain.nodes || generateSampleNodes(),
            metadata: {
              location:
                `${result.location?.city}, ${result.location?.county}, ${result.location?.state}` ||
                "Unknown Location",
              scenario: result.scenario?.type || "Unknown Scenario",
              generatedAt: new Date().toISOString(),
            },
          });
        } else {
          // Generate a sample diagram if none exists
          setDiagramData({
            pumlContent: generateSamplePuml(),
            nodes: generateSampleNodes(),
            metadata: {
              location: "Sample Location",
              scenario: "Sample Investigation",
              generatedAt: new Date().toISOString(),
            },
          });
        }
      } else {
        setError("No diagram data found. Please run a search first.");
      }
    } catch (err) {
      console.error("Error loading diagram data:", err);
      setError("Error loading diagram data.");
    } finally {
      setLoading(false);
    }
  }, []);

  const generateSamplePuml = () => `@startuml
!theme plain
title Decision Chain Analysis

actor "Reporter" as reporter
participant "CPS Intake" as intake
participant "Investigation Unit" as invest
participant "Court System" as court
participant "Foster Care Agency" as foster
participant "Service Provider" as service

reporter -> intake : Report Filed
intake -> invest : Case Assigned
invest -> court : Petition Filed
court -> foster : Placement Order
foster -> service : Service Referral

note right of invest : Risk Assessment Required
note right of court : Legal Review Process
note right of foster : Background Checks

@enduml`;

  const generateSampleNodes = () => [
    {
      id: "cps-intake",
      type: "agency" as const,
      title: "CPS Intake Unit",
      details: {
        description: "Initial assessment and case intake",
        contact: "1-800-CPS-HELP",
        jurisdiction: "County Level",
        status: "Active",
      },
    },
    {
      id: "investigation",
      type: "worker" as const,
      title: "Investigation Unit",
      details: {
        description: "Case investigation and assessment",
        contact: "Investigation Supervisor",
        jurisdiction: "State Level",
        status: "Active",
      },
    },
    {
      id: "court-system",
      type: "legal" as const,
      title: "Family Court",
      details: {
        description: "Legal proceedings and court orders",
        contact: "Family Court Clerk",
        jurisdiction: "Judicial District",
        status: "Active",
      },
    },
  ];

  const downloadDiagram = () => {
    if (!diagramData) return;

    const blob = new Blob([diagramData.pumlContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `decision-chain-${Date.now()}.puml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Head>
          <title>CIVIC TRACE OPS - Loading Diagram</title>
        </Head>
        <Navbar />
        <div className="main-container">
          <div className="center-panel flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-xl font-bold text-black">Loading Diagram...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !diagramData) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Head>
          <title>CIVIC TRACE OPS - Error</title>
        </Head>
        <Navbar />
        <div className="main-container">
          <div className="center-panel flex items-center justify-center">
            <div className="glass-panel text-center">
              <h1 className="text-2xl font-black text-red-600 mb-4">Error</h1>
              <p className="text-black mb-4">{error}</p>
              <button onClick={() => router.push("/search")} className="glass-button">
                Back to Search
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Head>
        <title>CIVIC TRACE OPS - Decision Chain Diagram</title>
        <meta name="description" content="Interactive decision chain diagram visualization" />
      </Head>

      <Navbar />

      <div className={`main-container ${isFullscreen ? "fixed inset-0 z-50 bg-white" : ""}`}>
        {!isFullscreen && (
          <>
            {/* Left Panel */}
            <div className="side-panel h-full">
              <div className="panel-logo">
                <img src="/images/logos/logo1.jpg" alt="Logo 1" className="panel-logo-img" />
              </div>
              <h2>Diagram Controls</h2>
              <ul>
                <li>
                  <button onClick={downloadDiagram} className="h2-link w-full text-left">
                    Download .puml
                  </button>
                </li>
                <li>
                  <button onClick={toggleFullscreen} className="h2-link w-full text-left">
                    Fullscreen View
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push("/results")}
                    className="h2-link w-full text-left"
                  >
                    Back to Results
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push("/search")}
                    className="h2-link w-full text-left"
                  >
                    New Search
                  </button>
                </li>
              </ul>
            </div>
          </>
        )}

        {/* Center Panel */}
        <div
          className={`${isFullscreen ? "w-full" : "center-panel"} overflow-y-auto h-[calc(100vh-4rem)] flex-grow`}
        >
          <div className="max-w-6xl mx-auto px-8 py-6">
            {/* Header Section */}
            <div className="glass-panel mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-black text-black mb-2">Decision Chain Diagram</h1>
                  <p className="text-black">
                    <strong>Location:</strong> {diagramData.metadata.location} |
                    <strong> Scenario:</strong> {diagramData.metadata.scenario}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button onClick={downloadDiagram} className="glass-button">
                    Download .puml
                  </button>
                  <button onClick={toggleFullscreen} className="glass-button">
                    {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Decision Chain Viewer */}
            <motion.div
              className="glass-panel mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <DecisionChainViewer
                pumlContent={diagramData.pumlContent}
                nodes={diagramData.nodes}
                onDownload={downloadDiagram}
              />
            </motion.div>

            {/* Node Details */}
            <AnimatePresence>
              {false && (
                <motion.div
                  className="glass-panel"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.h2
                    className="text-2xl font-black text-black mb-4"
                    initial={{ x: -20 }}
                    animate={{ x: 0 }}
                  >
                    Node Details
                  </motion.h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <h3 className="font-black text-black mb-2">Basic Information</h3>
                      <div className="space-y-2">
                        <p>Node details will appear here when implemented</p>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {!isFullscreen && (
          <>
            {/* Right Panel */}
            <div className="side-panel h-full">
              <div className="panel-logo">
                <img src="/images/logos/logo2.jpg" alt="Logo 2" className="panel-logo-img" />
              </div>
              <h2>Diagram Info</h2>
              <div className="stats-window">
                <h3>Metadata</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Generated:</strong>
                    <br />
                    {new Date(diagramData.metadata.generatedAt).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Nodes:</strong>
                    <br />
                    {diagramData.nodes.length} identified
                  </div>
                  <div>
                    <strong>Format:</strong>
                    <br />
                    PlantUML (.puml)
                  </div>
                </div>
              </div>

              <div className="stats-window mt-4">
                <h3>Instructions</h3>
                <ul className="text-sm space-y-1">
                  <li>• Click diagram nodes to view details</li>
                  <li>• Use fullscreen for better viewing</li>
                  <li>• Download .puml for external rendering</li>
                  <li>• Interactive zoom and pan controls</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default DiagramPage;

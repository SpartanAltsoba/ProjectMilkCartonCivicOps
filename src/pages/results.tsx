import React, { useState, useEffect } from "react";
import { NextPage } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import Head from "next/head";

// Dynamic imports for code splitting
const Navbar = dynamic(() => import("../components/Navbar"));
const Footer = dynamic(() => import("../components/Footer"));
const ScoreBadge = dynamic(() => import("../components/ScoreBadge"));
const FoiaPackageList = dynamic(() => import("../components/FoiaPackageList"));
const SourceList = dynamic(() => import("../components/SourceList"));
const ZipcodeTraceMap = dynamic(() => import("../components/ZipcodeTraceMap"));

interface SearchResult {
  location?: {
    zipCode: string;
    city: string;
    state: string;
    county: string;
  };
  frameworkAnalysis: {
    framework: string;
    description: string;
    confidence: number;
  };
  agencyStructure: {
    agencyName: string;
    type: string;
    jurisdiction: string;
    contact: string;
  };
  performance: {
    caseloadSize: number;
    responseTime: string;
    successRate: number;
    budgetUtilization: number;
    metrics?: {
      cpsReports: number;
      fosterCareChildren: number;
      adoptionRate: number;
      reunificationRate: number;
    };
  };
  funding: {
    totalBudget: number;
    federalFunding: number;
    stateFunding: number;
    localFunding: number;
    contractorSpending: number;
    sources?: Array<{
      source: string;
      amount: number;
      purpose: string;
    }>;
    contracts?: Array<{
      contractor: string;
      amount: number;
      purpose: string;
      startDate: string;
    }>;
    grants?: Array<{
      recipient: string;
      amount: number;
      purpose: string;
      status: string;
    }>;
  };
  scoringReport: {
    level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "GOOD" | "EXCELLENT";
    score: number;
    factors: string[];
  };
  foiaPackages: Array<{
    id: string;
    title: string;
    agency: string;
    description: string;
    status: "PENDING" | "SUBMITTED" | "PROCESSING" | "COMPLETED" | "DENIED";
    submittedDate?: string;
    expectedResponse?: string;
    documents: Array<{
      name: string;
      type: string;
      size?: string;
      url?: string;
    }>;
    requestDetails: {
      requestType: string;
      urgency: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
      estimatedCost?: number;
      processingTime?: string;
    };
  }>;
  sourceLinks: Array<{
    id: string;
    title: string;
    url: string;
    type: "GOVERNMENT" | "ACADEMIC" | "NEWS" | "LEGAL" | "NGO" | "DATABASE" | "REPORT";
    description: string;
    reliability: "HIGH" | "MEDIUM" | "LOW";
    lastUpdated?: string;
    accessDate: string;
    metadata: {
      author?: string;
      organization?: string;
      publishDate?: string;
      jurisdiction?: string;
      documentType?: string;
      relevanceScore?: number;
      [key: string]: any;
    };
  }>;
  decisionChain?: {
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
  };
}

const ResultsPage: NextPage = () => {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const router = useRouter();

  useEffect(() => {
    try {
      const storedResult = localStorage.getItem("searchResult");
      if (storedResult) {
        setResult(JSON.parse(storedResult));
      } else {
        setError("No search results found. Please run a search first.");
      }
    } catch (err) {
      console.error("Error loading results:", err);
      setError("Error loading search results.");
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "LOW":
        return "bg-green-100 text-green-800 border-green-300";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "CRITICAL":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Head>
          <title>CIVIC TRACE OPS - Loading Results</title>
        </Head>
        <Navbar />
        <div className="main-container">
          <motion.div
            className="center-panel flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center">
              <motion.div
                className="rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              />
              <motion.p
                className="text-xl font-bold text-black"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Loading Results...
              </motion.p>
            </div>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Head>
          <title>CIVIC TRACE OPS - Error</title>
        </Head>
        <Navbar />
        <div className="main-container">
          <motion.div
            className="center-panel flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="glass-panel text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.h1
                className="text-2xl font-black text-red-600 mb-4"
                initial={{ y: -20 }}
                animate={{ y: 0 }}
              >
                Error
              </motion.h1>
              <motion.p
                className="text-black mb-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {error}
              </motion.p>
              <motion.button
                onClick={() => router.push("/search")}
                className="glass-button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Back to Search
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Head>
        <title>CIVIC TRACE OPS - Investigation Results</title>
        <meta
          name="description"
          content="Comprehensive investigation results for child welfare systems"
        />
      </Head>

      <Navbar />

      <div className="main-container">
        {/* Left Panel */}
        <div className="side-panel h-full">
          <div className="panel-logo">
            <img src="/images/logos/logo1.jpg" alt="Logo 1" className="panel-logo-img" />
          </div>
          <h2>Navigation</h2>
          <ul>
            <li>
              <button onClick={() => router.push("/search")} className="h2-link w-full text-left">
                New Search
              </button>
            </li>
            <li>
              <button onClick={() => router.push("/diagram")} className="h2-link w-full text-left">
                View Diagram
              </button>
            </li>
            <li>
              <a href="#framework" className="h2-link">
                Framework Analysis
              </a>
            </li>
            <li>
              <a href="#performance" className="h2-link">
                Performance Data
              </a>
            </li>
            <li>
              <a href="#foia" className="h2-link">
                FOIA Packages
              </a>
            </li>
          </ul>
        </div>

        {/* Center Panel */}
        <div className="center-panel overflow-y-auto h-[calc(100vh-4rem)] flex-grow">
          <div className="max-w-4xl mx-auto px-8 py-6">
            {/* Location and Risk Assessment */}
            <motion.div
              className="glass-panel mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <motion.h1
                className="text-3xl font-black text-black text-center mb-4"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                Investigation Results
              </motion.h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Location Trace */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {result.location ? (
                    <ZipcodeTraceMap
                      zipCode={result.location.zipCode}
                      onDataLoaded={data => {
                        console.log("Zipcode data loaded:", data);
                      }}
                    />
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-black font-bold">No location data available</p>
                    </div>
                  )}
                </motion.div>

                {/* Risk Score */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex justify-center items-center"
                >
                  <ScoreBadge
                    level={result.scoringReport.level}
                    score={result.scoringReport.score}
                    size="large"
                    animated={true}
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Framework Analysis */}
            <motion.div
              id="framework"
              className="glass-panel mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <motion.button
                className="w-full flex justify-between items-center p-4 text-left"
                onClick={() => toggleSection("framework")}
                whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                whileTap={{ scale: 0.98 }}
              >
                <h2 className="text-2xl font-black text-black">Framework Analysis</h2>
                <motion.span
                  className="text-2xl"
                  animate={{ rotate: expandedSections.framework ? 180 : 0 }}
                >
                  ▼
                </motion.span>
              </motion.button>
              <AnimatePresence>
                {expandedSections.framework && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 space-y-4">
                      <div>
                        <h3 className="font-black text-black mb-2">Framework Type</h3>
                        <p className="text-black">{result.frameworkAnalysis.framework}</p>
                      </div>
                      <div>
                        <h3 className="font-black text-black mb-2">Description</h3>
                        <p className="text-black">{result.frameworkAnalysis.description}</p>
                      </div>
                      <div>
                        <h3 className="font-black text-black mb-2">Confidence Level</h3>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-blue-600 h-4 rounded-full"
                            style={{ width: `${result.frameworkAnalysis.confidence * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-black mt-1">
                          {Math.round(result.frameworkAnalysis.confidence * 100)}%
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Agency Structure */}
            <motion.div
              className="glass-panel mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.button
                className="w-full flex justify-between items-center p-4 text-left"
                onClick={() => toggleSection("agency")}
                whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                whileTap={{ scale: 0.98 }}
              >
                <h2 className="text-2xl font-black text-black">Agency Structure</h2>
                <motion.span
                  className="text-2xl"
                  animate={{ rotate: expandedSections.agency ? 180 : 0 }}
                >
                  ▼
                </motion.span>
              </motion.button>
              <AnimatePresence>
                {expandedSections.agency && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-black text-black mb-2">Agency Name</h3>
                        <p className="text-black">{result.agencyStructure.agencyName}</p>
                      </div>
                      <div>
                        <h3 className="font-black text-black mb-2">Type</h3>
                        <p className="text-black">{result.agencyStructure.type}</p>
                      </div>
                      <div>
                        <h3 className="font-black text-black mb-2">Jurisdiction</h3>
                        <p className="text-black">{result.agencyStructure.jurisdiction}</p>
                      </div>
                      <div>
                        <h3 className="font-black text-black mb-2">Contact</h3>
                        <p className="text-black">{result.agencyStructure.contact}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Performance Data */}
            <motion.div
              id="performance"
              className="glass-panel mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.button
                className="w-full flex justify-between items-center p-4 text-left"
                onClick={() => toggleSection("performance")}
                whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                whileTap={{ scale: 0.98 }}
              >
                <h2 className="text-2xl font-black text-black">Performance Metrics</h2>
                <motion.span
                  className="text-2xl"
                  animate={{ rotate: expandedSections.performance ? 180 : 0 }}
                >
                  ▼
                </motion.span>
              </motion.button>
              <AnimatePresence>
                {expandedSections.performance && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-black text-blue-600">
                          {result.performance.caseloadSize}
                        </div>
                        <div className="text-sm text-black">Caseload Size</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-black text-blue-600">
                          {result.performance.responseTime}
                        </div>
                        <div className="text-sm text-black">Response Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-black text-blue-600">
                          {result.performance.successRate}%
                        </div>
                        <div className="text-sm text-black">Success Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-black text-blue-600">
                          {result.performance.budgetUtilization}%
                        </div>
                        <div className="text-sm text-black">Budget Utilization</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Funding Information */}
            <motion.div
              className="glass-panel mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <motion.button
                className="w-full flex justify-between items-center p-4 text-left"
                onClick={() => toggleSection("funding")}
                whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                whileTap={{ scale: 0.98 }}
              >
                <h2 className="text-2xl font-black text-black">Funding Breakdown</h2>
                <motion.span
                  className="text-2xl"
                  animate={{ rotate: expandedSections.funding ? 180 : 0 }}
                >
                  ▼
                </motion.span>
              </motion.button>
              <AnimatePresence>
                {expandedSections.funding && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-black text-black mb-2">Total Budget</h3>
                          <p className="text-2xl font-black text-blue-600">
                            ${result.funding.totalBudget.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <h3 className="font-black text-black mb-2">Contractor Spending</h3>
                          <p className="text-2xl font-black text-orange-600">
                            ${result.funding.contractorSpending.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-xl font-black text-green-600">
                            ${result.funding.federalFunding.toLocaleString()}
                          </div>
                          <div className="text-sm text-black">Federal</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-black text-blue-600">
                            ${result.funding.stateFunding.toLocaleString()}
                          </div>
                          <div className="text-sm text-black">State</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-black text-purple-600">
                            ${result.funding.localFunding.toLocaleString()}
                          </div>
                          <div className="text-sm text-black">Local</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* FOIA Packages */}
            <div id="foia" className="glass-panel mb-6">
              <motion.button
                className="w-full flex justify-between items-center p-4 text-left"
                onClick={() => toggleSection("foia")}
                whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                whileTap={{ scale: 0.98 }}
              >
                <h2 className="text-2xl font-black text-black">FOIA Packages</h2>
                <motion.span
                  className="text-2xl"
                  animate={{ rotate: expandedSections.foia ? 180 : 0 }}
                >
                  ▼
                </motion.span>
              </motion.button>
              <AnimatePresence>
                {expandedSections.foia && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4">
                      <FoiaPackageList
                        packages={result.foiaPackages}
                        onDownload={packageId => {
                          const pkg = result.foiaPackages.find(p => p.id === packageId);
                          if (pkg && pkg.documents.length > 0) {
                            // Handle download
                            console.log("Downloading package:", packageId);
                          }
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Source Links */}
            <div className="glass-panel mb-6">
              <motion.button
                className="w-full flex justify-between items-center p-4 text-left"
                onClick={() => toggleSection("sources")}
                whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                whileTap={{ scale: 0.98 }}
              >
                <h2 className="text-2xl font-black text-black">Source Citations</h2>
                <motion.span
                  className="text-2xl"
                  animate={{ rotate: expandedSections.sources ? 180 : 0 }}
                >
                  ▼
                </motion.span>
              </motion.button>
              <AnimatePresence>
                {expandedSections.sources && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4">
                      <SourceList
                        sources={result.sourceLinks}
                        onSourceClick={source => {
                          window.open(source.url, "_blank", "noopener,noreferrer");
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="side-panel h-full">
          <div className="panel-logo">
            <img src="/images/logos/logo2.jpg" alt="Logo 2" className="panel-logo-img" />
          </div>
          <h2>Risk Assessment</h2>
          <div className="stats-window">
            <h3>Scoring Report</h3>
            <div className={`p-3 rounded-lg mb-3 ${getRiskColor(result.scoringReport.level)}`}>
              <div className="font-black text-lg">{result.scoringReport.level}</div>
              <div className="text-sm">Score: {result.scoringReport.score}/100</div>
            </div>
            <h4 className="font-bold mb-2">Risk Factors:</h4>
            <ul className="text-sm space-y-1">
              {result.scoringReport.factors.map((factor, index) => (
                <li key={index} className="text-black">
                  • {factor}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ResultsPage;

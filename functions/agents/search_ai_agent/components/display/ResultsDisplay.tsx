import React from "react";
import dynamic from "next/dynamic";

type ResultsDisplayProps = {
  data: {
    legalFrameworks: string[];
    agencyHierarchy: object;
    performanceMetrics: object[];
    fundingTraces: object[];
    decisionChains: object[];
  } | null;
};

// Dynamically load the Chart component as it might not be needed every time
const PerformanceMetricsChart = dynamic(() => import("./PerformanceMetricsChart"), {
  ssr: false, // Disable server-side rendering for the chart
  loading: () => <p>Loading charts...</p>,
});

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ data }) => {
  if (!data) {
    return <div className="text-center text-gray-500">No results available.</div>;
  }

  const { legalFrameworks, agencyHierarchy, performanceMetrics, fundingTraces, decisionChains } =
    data;

  return (
    <div className="p-4 space-y-8">
      <div className="bg-white shadow p-4 rounded">
        <h2 className="text-xl font-bold mb-2">Legal Frameworks</h2>
        <ul className="list-disc list-inside">
          {legalFrameworks.map((framework, index) => (
            <li key={index}>{framework}</li>
          ))}
        </ul>
      </div>

      <div className="bg-white shadow p-4 rounded">
        <h2 className="text-xl font-bold mb-2">Agency Hierarchy</h2>
        <pre className="whitespace-pre-wrap break-word text-sm">
          {JSON.stringify(agencyHierarchy, null, 2)}
        </pre>
      </div>

      <div className="bg-white shadow p-4 rounded">
        <h2 className="text-xl font-bold mb-2">Performance Metrics</h2>
        {performanceMetrics.length > 0 ? (
          <PerformanceMetricsChart metrics={performanceMetrics} />
        ) : (
          <p>No metrics to display.</p>
        )}
      </div>

      <div className="bg-white shadow p-4 rounded">
        <h2 className="text-xl font-bold mb-2">Funding Traces</h2>
        {/* Render funding traces here, could be charts or simple lists */}
        <pre className="whitespace-pre-wrap break-word text-sm">
          {JSON.stringify(fundingTraces, null, 2)}
        </pre>
      </div>

      <div className="bg-white shadow p-4 rounded">
        <h2 className="text-xl font-bold mb-2">Decision Chains</h2>
        {/* Render decision chains here, could be diagrams or simple lists */}
        <pre className="whitespace-pre-wrap break-word text-sm">
          {JSON.stringify(decisionChains, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ResultsDisplay;

import React from "react";

// Define a type for component props
interface AnalysisSummaryProps {
  summary: {
    keywords: string[];
    progress: number; // progress as a percentage
    note?: string; // optional note from analysis
  };
}

const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({ summary }) => {
  // Helper function to format the progress
  const formatProgress = (progress: number): string => {
    // Ensure progress is within 0-100 range
    if (progress < 0) return "0%";
    if (progress > 100) return "100%";
    return `${progress.toFixed(1)}%`;
  };

  return (
    <div className="bg-white shadow-md p-5 rounded-lg">
      <h3 className="text-xl font-semibold mb-4">Analysis Summary</h3>

      <div className="mb-4">
        <h4 className="text-lg font-medium">Keywords</h4>
        <ul className="list-disc pl-5">
          {summary.keywords.map((keyword, index) => (
            <li key={index} className="text-gray-700">
              {keyword}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-4">
        <h4 className="text-lg font-medium">Progress</h4>
        <div className="w-full bg-gray-200 h-5 rounded">
          <div
            className="bg-blue-600 h-5 rounded"
            style={{ width: formatProgress(summary.progress) }}
          ></div>
        </div>
        <p className="text-right text-sm mt-1">{formatProgress(summary.progress)}</p>
      </div>

      {summary.note && (
        <div className="mt-4">
          <h4 className="text-lg font-medium">Note</h4>
          <p className="text-gray-600">{summary.note}</p>
        </div>
      )}
    </div>
  );
};

export default AnalysisSummary;

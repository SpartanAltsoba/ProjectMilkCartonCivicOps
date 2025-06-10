import React from "react";
import { CPSData } from "../types";

interface CPSAnalysisComponentProps {
  data: CPSData;
}

const CPSAnalysisComponent: React.FC<CPSAnalysisComponentProps> = ({ data }) => {
  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-4">CPS Analysis for {data.city}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800">Location</h3>
          <p className="text-blue-600">
            {data.city}, {data.county} County, {data.state}
          </p>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800">Case Count</h3>
          <p className="text-2xl font-bold text-yellow-600">{data.caseCount}</p>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800">Risk Score</h3>
          <p className="text-2xl font-bold text-red-600">{data.riskScore}</p>
        </div>
      </div>

      {data.agencies && data.agencies.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Agencies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.agencies.map((agency, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold">{agency.name}</h3>
                <p className="text-sm text-gray-600">Type: {agency.type}</p>
                <p className="text-sm text-gray-600">Jurisdiction: {agency.jurisdiction}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500">
        Last updated: {data.lastUpdated.toLocaleDateString()}
      </div>
    </div>
  );
};

export default CPSAnalysisComponent;

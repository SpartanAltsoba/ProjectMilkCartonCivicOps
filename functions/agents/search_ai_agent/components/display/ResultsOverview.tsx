import React from 'react';
import PropTypes from 'prop-types';

interface ResultsOverviewProps {
  data: {
    totalAgencies: number;
    totalFunding: number;
    performanceScore: number;
    decisionChainsExtracted: number;
  };
}

const ResultsOverview: React.FC<ResultsOverviewProps> = ({ data }) => {
  const { totalAgencies, totalFunding, performanceScore, decisionChainsExtracted } = data;

  return (
    <div className="p-6 bg-white shadow rounded-md">
      <h2 className="text-xl font-semibold mb-4">Analysis Results Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {typeof totalAgencies === 'number' ? (
          <div className="bg-blue-50 p-4 rounded">
            <p className="text-sm font-medium text-gray-700">Total Agencies</p>
            <p className="text-lg font-bold text-blue-700">{totalAgencies}</p>
          </div>
        ) : (
          <div className="text-red-600">Error retrieving total agencies.</div>
        )}
        {typeof totalFunding === 'number' ? (
          <div className="bg-green-50 p-4 rounded">
            <p className="text-sm font-medium text-gray-700">Total Funding</p>
            <p className="text-lg font-bold text-green-700">${totalFunding.toLocaleString()}</p>
          </div>
        ) : (
          <div className="text-red-600">Error retrieving total funding information.</div>
        )}
        {typeof performanceScore === 'number' ? (
          <div className="bg-yellow-50 p-4 rounded">
            <p className="text-sm font-medium text-gray-700">Performance Score</p>
            <p className="text-lg font-bold text-yellow-700">{performanceScore.toFixed(2)}</p>
          </div>
        ) : (
          <div className="text-red-600">Error retrieving performance score.</div>
        )}
        {typeof decisionChainsExtracted === 'number' ? (
          <div className="bg-purple-50 p-4 rounded">
            <p className="text-sm font-medium text-gray-700">Decision Chains Extracted</p>
            <p className="text-lg font-bold text-purple-700">{decisionChainsExtracted}</p>
          </div>
        ) : (
          <div className="text-red-600">Error retrieving decision chains data.</div>
        )}
      </div>
    </div>
  );
};

ResultsOverview.propTypes = {
  data: PropTypes.shape({
    totalAgencies: PropTypes.number.isRequired,
    totalFunding: PropTypes.number.isRequired,
    performanceScore: PropTypes.number.isRequired,
    decisionChainsExtracted: PropTypes.number.isRequired,
  }).isRequired,
};

export default ResultsOverview;

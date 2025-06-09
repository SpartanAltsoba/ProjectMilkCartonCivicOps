import React from 'react';

// Props type definition
interface LegalFrameworkDetailsProps {
  frameworkData: {
    name: string;
    description: string;
    jurisdiction: string;
    relevantLaws: string[];
  } | null;
}

// Component Definition
const LegalFrameworkDetails: React.FC<LegalFrameworkDetailsProps> = ({ frameworkData }) => {
  // Render loader or framework details
  if (!frameworkData) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>Loading legal framework data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded shadow-md my-4">
      <h2 className="text-2xl font-semibold mb-2">{frameworkData.name}</h2>
      <p className="text-gray-700 mb-4">{frameworkData.description}</p>

      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Jurisdiction</h3>
        <p className="text-gray-700">{frameworkData.jurisdiction}</p>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Relevant Laws</h3>
        {frameworkData.relevantLaws.length ? (
          <ul className="list-disc pl-5">
            {frameworkData.relevantLaws.map((law, index) => (
              <li key={index} className="text-gray-700">
                {law}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No laws found.</p>
        )}
      </div>
    </div>
  );
};

export default LegalFrameworkDetails;

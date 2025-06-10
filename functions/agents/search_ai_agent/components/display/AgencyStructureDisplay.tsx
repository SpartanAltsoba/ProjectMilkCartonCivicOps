import React from "react";
import { HierarchyData } from "../../types";

interface AgencyStructureDisplayProps {
  hierarchyData: HierarchyData;
}

const AgencyStructureDisplay: React.FC<AgencyStructureDisplayProps> = ({ hierarchyData }) => {
  // Function to render agency structure recursively
  const renderAgencyNode = (node: HierarchyData, depth: number = 0): React.ReactNode => {
    return (
      <div className={`ml-${depth * 4}`} key={node.id}>
        <div className="font-semibold text-gray-800">{node.name}</div>
        {node.children && node.children.length > 0 && (
          <div className="ml-2 mt-2">
            {node.children.map(child => renderAgencyNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!hierarchyData) {
    return <div className="text-red-500">Error: No agency structure data available.</div>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <h3 className="text-xl font-bold mb-4">Agency Structure</h3>
      {renderAgencyNode(hierarchyData)}
    </div>
  );
};

export default AgencyStructureDisplay;

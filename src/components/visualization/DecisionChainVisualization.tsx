import React, { useEffect, useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { IStakeholder, IRelationship } from "../types";

interface DecisionChainVisualizationProps {
  stakeholders: IStakeholder[];
  relationships: IRelationship[];
}

interface ChartData {
  name: string;
  influence: number;
  dependencies: number;
  total: number;
  index: number;
}

const DecisionChainVisualization: React.FC<DecisionChainVisualizationProps> = ({
  stakeholders,
  relationships,
}) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);

  const processData = useMemo(() => {
    return stakeholders.map((stakeholder, index) => {
      const incomingRelations = relationships.filter(rel => rel.to === stakeholder.id).length;
      const outgoingRelations = relationships.filter(rel => rel.from === stakeholder.id).length;

      return {
        name: stakeholder.name,
        influence: outgoingRelations,
        dependencies: incomingRelations,
        total: incomingRelations + outgoingRelations,
        index: index,
      };
    });
  }, [stakeholders, relationships]);

  useEffect(() => {
    try {
      setChartData(processData);
    } catch (error) {
      console.error("Error processing decision chain data:", error);
    }
  }, [processData]);

  return (
    <div className="decision-chain-visualization w-full h-96 bg-white shadow-md rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Stakeholder Influence & Dependencies</h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="influence"
              stroke="#8884d8"
              strokeWidth={2}
              name="Influence (Outgoing)"
            />
            <Line
              type="monotone"
              dataKey="dependencies"
              stroke="#82ca9d"
              strokeWidth={2}
              name="Dependencies (Incoming)"
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#ffc658"
              strokeWidth={2}
              name="Total Connections"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">No stakeholders available for visualization.</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(DecisionChainVisualization);

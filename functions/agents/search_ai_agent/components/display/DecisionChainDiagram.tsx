import React from "react";
import { useEffect, useState } from "react";
import { Diagram, Node } from "react-hold-diagram"; // Hypothetical library for rendering diagrams
import "../styles/DecisionChainDiagram.css"; // Local stylesheet for custom styles

interface DecisionChainNode {
  id: string;
  label: string;
  details: string;
  type: "decision" | "action" | "outcome";
}

interface DecisionChainLink {
  source: string;
  target: string;
}

interface DecisionChainDiagramProps {
  diagramData: {
    nodes: DecisionChainNode[];
    links: DecisionChainLink[];
  };
}

const DecisionChainDiagram: React.FC<DecisionChainDiagramProps> = ({ diagramData }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<any[]>([]);

  useEffect(() => {
    if (diagramData) {
      try {
        const formattedNodes = diagramData.nodes.map(node => ({
          id: node.id,
          label: node.label,
          className: `node-${node.type}`,
        }));

        const formattedLinks = diagramData.links.map(link => ({
          source: link.source,
          target: link.target,
        }));

        setNodes(formattedNodes);
        setLinks(formattedLinks);
      } catch (error) {
        console.error("Error formatting diagram data:", error);
      }
    }
  }, [diagramData]);

  return (
    <div className="decision-chain-diagram">
      {nodes.length > 0 ? (
        <Diagram nodes={nodes} links={links} layout="hierarchical" className="diagram" />
      ) : (
        <p>Loading diagram...</p>
      )}
    </div>
  );
};

export default DecisionChainDiagram;

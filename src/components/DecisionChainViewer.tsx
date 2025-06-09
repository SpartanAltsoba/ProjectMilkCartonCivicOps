/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NodeData {
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
}

interface DecisionChainViewerProps {
  pumlContent: string;
  nodes: NodeData[];
  onDownload?: () => void;
}

const DecisionChainViewer: React.FC<DecisionChainViewerProps> = ({
  pumlContent,
  nodes: _nodes,
  onDownload,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Convert PlantUML to SVG (in a real implementation, you'd use a proper PlantUML server)
  const [svgContent, setSvgContent] = useState<string>("");

  useEffect(() => {
    // In a real implementation, you would:
    // 1. Encode the PlantUML content
    // 2. Send it to a PlantUML server
    // 3. Get back the SVG and set it
    // For now, we'll use a placeholder SVG
    const mockSvg = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <style>
          .node { cursor: pointer; transition: all 0.3s ease; }
          .node:hover { filter: brightness(1.2); }
          .edge { stroke: #666; stroke-width: 2; }
          text { font-family: Arial; }
        </style>
        <!-- Mock diagram content would go here -->
        <g transform="translate(50,50)">
          <rect class="node" x="0" y="0" width="100" height="50" rx="5" fill="#4CAF50" />
          <text x="50" y="30" text-anchor="middle" fill="white">Start</text>
        </g>
      </svg>
    `;
    setSvgContent(mockSvg);
  }, [pumlContent]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.min(Math.max(prev + delta, 0.5), 3));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      // Left click only
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const _handleNodeClick = (node: NodeData, event: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    }
    setSelectedNode(node);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[600px] glass-panel overflow-hidden"
      role="application"
      aria-label="Interactive decision chain diagram viewer"
      tabIndex={0}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onKeyDown={e => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          const delta = e.key === "ArrowUp" ? 0.1 : -0.1;
          setScale(prev => Math.min(Math.max(prev + delta, 0.5), 3));
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          const deltaX = e.key === "ArrowRight" ? 10 : -10;
          setPosition(prev => ({ ...prev, x: prev.x + deltaX }));
        }
      }}
    >
      {/* Controls */}
      <motion.div
        className="absolute top-4 right-4 flex gap-2 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          className="glass-button p-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setScale(prev => prev + 0.1)}
        >
          <span role="img" aria-label="zoom in">
            🔍+
          </span>
        </motion.button>
        <motion.button
          className="glass-button p-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setScale(prev => prev - 0.1)}
        >
          <span role="img" aria-label="zoom out">
            🔍-
          </span>
        </motion.button>
        <motion.button
          className="glass-button p-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleFullscreen}
        >
          <span role="img" aria-label="fullscreen">
            {isFullscreen ? "⬆️" : "⤢"}
          </span>
        </motion.button>
        {onDownload && (
          <motion.button
            className="glass-button p-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDownload}
          >
            <span role="img" aria-label="download">
              💾
            </span>
          </motion.button>
        )}
      </motion.div>

      {/* SVG Container */}
      <motion.div
        style={{
          transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? "grabbing" : "grab",
        }}
        className="origin-center w-full h-full"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />

      {/* Node Details Tooltip */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute glass-panel p-4 max-w-sm"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              transform: "translate(-50%, -100%)",
              zIndex: 20,
            }}
          >
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedNode(null)}
            >
              ✕
            </button>
            <h3 className="text-lg font-bold mb-2">{selectedNode.title}</h3>
            <div className="space-y-2">
              {Object.entries(selectedNode.details).map(([key, value]) => (
                <div key={key}>
                  <span className="font-bold">{key}: </span>
                  <span>
                    {key === "amount"
                      ? new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(value as number)
                      : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DecisionChainViewer;

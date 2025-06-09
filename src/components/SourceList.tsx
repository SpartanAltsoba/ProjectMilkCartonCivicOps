import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Source {
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
}

interface SourceListProps {
  sources: Source[];
  onSourceClick?: (source: Source) => void;
  showReliabilityFilter?: boolean;
  showTypeFilter?: boolean;
}

const SourceList: React.FC<SourceListProps> = ({
  sources,
  onSourceClick,
  showReliabilityFilter = true,
  showTypeFilter = true,
}) => {
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterReliability, setFilterReliability] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"relevance" | "date" | "title">("relevance");
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  const toggleSource = (sourceId: string) => {
    const newExpanded = new Set(expandedSources);
    if (newExpanded.has(sourceId)) {
      newExpanded.delete(sourceId);
    } else {
      newExpanded.add(sourceId);
    }
    setExpandedSources(newExpanded);
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "GOVERNMENT":
        return {
          color: "#1e40af",
          bgColor: "rgba(30, 64, 175, 0.1)",
          icon: "🏛️",
        };
      case "ACADEMIC":
        return {
          color: "#7c3aed",
          bgColor: "rgba(124, 58, 237, 0.1)",
          icon: "🎓",
        };
      case "NEWS":
        return {
          color: "#dc2626",
          bgColor: "rgba(220, 38, 38, 0.1)",
          icon: "📰",
        };
      case "LEGAL":
        return {
          color: "#059669",
          bgColor: "rgba(5, 150, 105, 0.1)",
          icon: "⚖️",
        };
      case "NGO":
        return {
          color: "#ea580c",
          bgColor: "rgba(234, 88, 12, 0.1)",
          icon: "🤝",
        };
      case "DATABASE":
        return {
          color: "#0891b2",
          bgColor: "rgba(8, 145, 178, 0.1)",
          icon: "🗄️",
        };
      case "REPORT":
        return {
          color: "#65a30d",
          bgColor: "rgba(101, 163, 13, 0.1)",
          icon: "📊",
        };
      default:
        return {
          color: "#6b7280",
          bgColor: "rgba(107, 114, 128, 0.1)",
          icon: "📄",
        };
    }
  };

  const getReliabilityConfig = (reliability: string) => {
    switch (reliability) {
      case "HIGH":
        return {
          color: "#16a34a",
          bgColor: "rgba(22, 163, 74, 0.1)",
          icon: "🟢",
        };
      case "MEDIUM":
        return {
          color: "#d97706",
          bgColor: "rgba(217, 119, 6, 0.1)",
          icon: "🟡",
        };
      case "LOW":
        return {
          color: "#dc2626",
          bgColor: "rgba(220, 38, 38, 0.1)",
          icon: "🔴",
        };
      default:
        return {
          color: "#6b7280",
          bgColor: "rgba(107, 114, 128, 0.1)",
          icon: "⚪",
        };
    }
  };

  const filteredAndSortedSources = sources
    .filter(
      source =>
        (filterType === "ALL" || source.type === filterType) &&
        (filterReliability === "ALL" || source.reliability === filterReliability)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "relevance":
          return (b.metadata.relevanceScore || 0) - (a.metadata.relevanceScore || 0);
        case "date":
          return new Date(b.accessDate).getTime() - new Date(a.accessDate).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  if (!sources || sources.length === 0) {
    return (
      <motion.div
        className="glass-panel text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.div
          className="text-6xl mb-4"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          📚
        </motion.div>
        <h3 className="text-lg font-bold text-black mb-2">No Sources Available</h3>
        <p className="text-black font-bold">
          Source references will appear here once the investigation is complete.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter and Sort Controls */}
      <motion.div
        className="glass-panel p-4 space-y-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Type Filter */}
        {showTypeFilter && (
          <div>
            <span className="font-bold text-black mr-2">Filter by Type:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {["ALL", "GOVERNMENT", "ACADEMIC", "NEWS", "LEGAL", "NGO", "DATABASE", "REPORT"].map(
                type => (
                  <motion.button
                    key={type}
                    className={`px-3 py-1 rounded-lg font-bold text-sm ${
                      filterType === type ? "bg-blue-500 text-white" : "glass-button"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFilterType(type)}
                  >
                    {type}
                  </motion.button>
                )
              )}
            </div>
          </div>
        )}

        {/* Reliability Filter */}
        {showReliabilityFilter && (
          <div>
            <span className="font-bold text-black mr-2">Filter by Reliability:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {["ALL", "HIGH", "MEDIUM", "LOW"].map(reliability => (
                <motion.button
                  key={reliability}
                  className={`px-3 py-1 rounded-lg font-bold text-sm ${
                    filterReliability === reliability ? "bg-green-500 text-white" : "glass-button"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilterReliability(reliability)}
                >
                  {reliability}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Sort Options */}
        <div>
          <span className="font-bold text-black mr-2">Sort by:</span>
          <div className="flex gap-2 mt-2">
            {[
              { key: "relevance", label: "Relevance" },
              { key: "date", label: "Date" },
              { key: "title", label: "Title" },
            ].map(option => (
              <motion.button
                key={option.key}
                className={`px-3 py-1 rounded-lg font-bold text-sm ${
                  sortBy === option.key ? "bg-purple-500 text-white" : "glass-button"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSortBy(option.key as any)}
              >
                {option.label}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Sources List */}
      <AnimatePresence>
        {filteredAndSortedSources.map((source, index) => {
          const typeConfig = getTypeConfig(source.type);
          const reliabilityConfig = getReliabilityConfig(source.reliability);
          const isExpanded = expandedSources.has(source.id);

          return (
            <motion.div
              key={source.id}
              className="glass-panel cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -2, boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)" }}
              onClick={() => toggleSource(source.id)}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 mr-4">
                  <motion.h3
                    className="text-lg font-bold text-blue-700 mb-1 hover:text-blue-900"
                    whileHover={{ scale: 1.01 }}
                  >
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => {
                        e.stopPropagation();
                        if (onSourceClick) onSourceClick(source);
                      }}
                      className="hover:underline"
                    >
                      {source.title}
                    </a>
                  </motion.h3>
                  <p className="text-sm text-green-700 font-bold mb-2">{source.url}</p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Type Badge */}
                  <motion.div
                    className="px-2 py-1 rounded text-xs font-bold flex items-center gap-1"
                    style={{
                      color: typeConfig.color,
                      backgroundColor: typeConfig.bgColor,
                    }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <span>{typeConfig.icon}</span>
                    {source.type}
                  </motion.div>

                  {/* Reliability Badge */}
                  <motion.div
                    className="px-2 py-1 rounded text-xs font-bold flex items-center gap-1"
                    style={{
                      color: reliabilityConfig.color,
                      backgroundColor: reliabilityConfig.bgColor,
                    }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <span>{reliabilityConfig.icon}</span>
                    {source.reliability}
                  </motion.div>

                  {/* Relevance Score */}
                  {source.metadata.relevanceScore && (
                    <motion.div
                      className="px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-800"
                      whileHover={{ scale: 1.05 }}
                    >
                      🎯 {Math.round(source.metadata.relevanceScore * 100)}%
                    </motion.div>
                  )}

                  {/* Expand/Collapse Button */}
                  <motion.button
                    className="text-blue-600 hover:text-blue-800 p-1"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </motion.button>
                </div>
              </div>

              {/* Description */}
              <p className="text-black font-bold mb-3">
                {isExpanded
                  ? source.description
                  : `${source.description.slice(0, 150)}${source.description.length > 150 ? "..." : ""}`}
              </p>

              {/* Collapsible Metadata */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="font-bold text-black mb-2">Source Details:</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {source.metadata.author && (
                          <div>
                            <span className="font-bold">Author:</span> {source.metadata.author}
                          </div>
                        )}
                        {source.metadata.organization && (
                          <div>
                            <span className="font-bold">Organization:</span>{" "}
                            {source.metadata.organization}
                          </div>
                        )}
                        {source.metadata.publishDate && (
                          <div>
                            <span className="font-bold">Published:</span>{" "}
                            {new Date(source.metadata.publishDate).toLocaleDateString()}
                          </div>
                        )}
                        <div>
                          <span className="font-bold">Accessed:</span>{" "}
                          {new Date(source.accessDate).toLocaleDateString()}
                        </div>
                        {source.metadata.jurisdiction && (
                          <div>
                            <span className="font-bold">Jurisdiction:</span>{" "}
                            {source.metadata.jurisdiction}
                          </div>
                        )}
                        {source.metadata.documentType && (
                          <div>
                            <span className="font-bold">Document Type:</span>{" "}
                            {source.metadata.documentType}
                          </div>
                        )}
                        {source.lastUpdated && (
                          <div>
                            <span className="font-bold">Last Updated:</span>{" "}
                            {new Date(source.lastUpdated).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {filteredAndSortedSources.length === 0 &&
        (filterType !== "ALL" || filterReliability !== "ALL") && (
          <motion.div
            className="glass-panel text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-black font-bold">No sources found matching the selected filters.</p>
          </motion.div>
        )}
    </div>
  );
};

export default SourceList;

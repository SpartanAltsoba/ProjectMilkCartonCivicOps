import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FoiaPackage {
  id: string;
  title: string;
  agency: string;
  description: string;
  status: "PENDING" | "SUBMITTED" | "PROCESSING" | "COMPLETED" | "DENIED";
  submittedDate?: string;
  expectedResponse?: string;
  documents: Array<{
    name: string;
    type: string;
    size?: string;
    url?: string;
  }>;
  requestDetails: {
    requestType: string;
    urgency: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    estimatedCost?: number;
    processingTime?: string;
  };
}

interface FoiaPackageListProps {
  packages: FoiaPackage[];
  onDownload?: (packageId: string) => void;
  onViewDetails?: (packageId: string) => void;
}

const FoiaPackageList: React.FC<FoiaPackageListProps> = ({
  packages,
  onDownload,
  onViewDetails,
}) => {
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const togglePackage = (packageId: string) => {
    const newExpanded = new Set(expandedPackages);
    if (newExpanded.has(packageId)) {
      newExpanded.delete(packageId);
    } else {
      newExpanded.add(packageId);
    }
    setExpandedPackages(newExpanded);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          color: "#f59e0b",
          bgColor: "rgba(245, 158, 11, 0.1)",
          icon: "⏳",
        };
      case "SUBMITTED":
        return {
          color: "#3b82f6",
          bgColor: "rgba(59, 130, 246, 0.1)",
          icon: "📤",
        };
      case "PROCESSING":
        return {
          color: "#8b5cf6",
          bgColor: "rgba(139, 92, 246, 0.1)",
          icon: "⚙️",
        };
      case "COMPLETED":
        return {
          color: "#10b981",
          bgColor: "rgba(16, 185, 129, 0.1)",
          icon: "✅",
        };
      case "DENIED":
        return {
          color: "#ef4444",
          bgColor: "rgba(239, 68, 68, 0.1)",
          icon: "❌",
        };
      default:
        return {
          color: "#6b7280",
          bgColor: "rgba(107, 114, 128, 0.1)",
          icon: "❓",
        };
    }
  };

  const getUrgencyConfig = (urgency: string) => {
    switch (urgency) {
      case "URGENT":
        return { color: "#dc2626", icon: "🚨" };
      case "HIGH":
        return { color: "#ea580c", icon: "⚡" };
      case "MEDIUM":
        return { color: "#d97706", icon: "📋" };
      case "LOW":
        return { color: "#059669", icon: "📄" };
      default:
        return { color: "#6b7280", icon: "📄" };
    }
  };

  const filteredPackages = packages.filter(
    pkg => filterStatus === "ALL" || pkg.status === filterStatus
  );

  if (!packages || packages.length === 0) {
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
          📋
        </motion.div>
        <h3 className="text-lg font-bold text-black mb-2">No FOIA Packages Available</h3>
        <p className="text-black font-bold">
          FOIA requests will appear here once the investigation is complete.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <motion.div
        className="glass-panel p-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-wrap gap-2">
          <span className="font-bold text-black mr-2">Filter by Status:</span>
          {["ALL", "PENDING", "SUBMITTED", "PROCESSING", "COMPLETED", "DENIED"].map(status => (
            <motion.button
              key={status}
              className={`px-3 py-1 rounded-lg font-bold text-sm ${
                filterStatus === status ? "bg-blue-500 text-white" : "glass-button"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilterStatus(status)}
            >
              {status}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Package List */}
      <AnimatePresence>
        {filteredPackages.map((pkg, index) => {
          const statusConfig = getStatusConfig(pkg.status);
          const urgencyConfig = getUrgencyConfig(pkg.requestDetails.urgency);
          const isExpanded = expandedPackages.has(pkg.id);

          return (
            <motion.div
              key={pkg.id}
              className="glass-panel cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -2, boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)" }}
              onClick={() => togglePackage(pkg.id)}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-black mb-1">{pkg.title}</h3>
                  <p className="text-sm font-bold text-gray-700">Agency: {pkg.agency}</p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Badge */}
                  <motion.div
                    className="px-3 py-1 rounded-lg font-bold text-sm flex items-center gap-1"
                    style={{
                      color: statusConfig.color,
                      backgroundColor: statusConfig.bgColor,
                    }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <span>{statusConfig.icon}</span>
                    {pkg.status}
                  </motion.div>

                  {/* Urgency Badge */}
                  <motion.div
                    className="px-2 py-1 rounded text-xs font-bold flex items-center gap-1"
                    style={{ color: urgencyConfig.color }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <span>{urgencyConfig.icon}</span>
                    {pkg.requestDetails.urgency}
                  </motion.div>

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
                  ? pkg.description
                  : `${pkg.description.slice(0, 100)}${pkg.description.length > 100 ? "..." : ""}`}
              </p>

              {/* Collapsible Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-gray-200 pt-4 space-y-4">
                      {/* Request Details */}
                      <div>
                        <h4 className="font-bold text-black mb-2">Request Details:</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-bold">Type:</span>{" "}
                            {pkg.requestDetails.requestType}
                          </div>
                          {pkg.requestDetails.estimatedCost && (
                            <div>
                              <span className="font-bold">Est. Cost:</span> $
                              {pkg.requestDetails.estimatedCost}
                            </div>
                          )}
                          {pkg.requestDetails.processingTime && (
                            <div>
                              <span className="font-bold">Processing Time:</span>{" "}
                              {pkg.requestDetails.processingTime}
                            </div>
                          )}
                          {pkg.submittedDate && (
                            <div>
                              <span className="font-bold">Submitted:</span>{" "}
                              {new Date(pkg.submittedDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Documents */}
                      {pkg.documents.length > 0 && (
                        <div>
                          <h4 className="font-bold text-black mb-2">
                            Documents ({pkg.documents.length}):
                          </h4>
                          <div className="space-y-2">
                            {pkg.documents.map((doc, docIndex) => (
                              <motion.div
                                key={docIndex}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                whileHover={{ backgroundColor: "#f3f4f6" }}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-600">📄</span>
                                  <span className="font-bold">{doc.name}</span>
                                  <span className="text-sm text-gray-600">({doc.type})</span>
                                  {doc.size && (
                                    <span className="text-xs text-gray-500">{doc.size}</span>
                                  )}
                                </div>
                                {doc.url && (
                                  <motion.a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-sm font-bold"
                                    whileHover={{ scale: 1.05 }}
                                  >
                                    Download
                                  </motion.a>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        {onViewDetails && (
                          <motion.button
                            className="glass-button px-4 py-2"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={e => {
                              e.stopPropagation();
                              onViewDetails(pkg.id);
                            }}
                          >
                            📋 View Details
                          </motion.button>
                        )}
                        {onDownload && (
                          <motion.button
                            className="glass-button px-4 py-2"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={e => {
                              e.stopPropagation();
                              onDownload(pkg.id);
                            }}
                          >
                            💾 Download Package
                          </motion.button>
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

      {filteredPackages.length === 0 && filterStatus !== "ALL" && (
        <motion.div
          className="glass-panel text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-black font-bold">No packages found with status: {filterStatus}</p>
        </motion.div>
      )}
    </div>
  );
};

export default FoiaPackageList;

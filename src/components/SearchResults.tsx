import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchResult } from "../types/search";

interface SearchResultsProps {
  results: SearchResult[];
  loading?: boolean;
  error?: string;
  query?: string;
  totalResults?: number;
  searchTime?: number;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  loading = false,
  error,
  query,
  totalResults,
  searchTime,
}) => {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const toggleCard = (index: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCards(newExpanded);
  };
  if (loading) {
    return (
      <div className="w-full">
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <motion.div
              key={index}
              className="glass-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.div
                className="h-4 bg-gray-300 rounded w-3/4 mb-2"
                style={{ opacity: 0.3 }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
              <motion.div
                className="h-3 bg-gray-300 rounded w-1/2 mb-4"
                style={{ opacity: 0.3 }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
              />
              <div className="space-y-2">
                <motion.div
                  className="h-3 bg-gray-300 rounded"
                  style={{ opacity: 0.3 }}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                />
                <motion.div
                  className="h-3 bg-gray-300 rounded w-5/6"
                  style={{ opacity: 0.3 }}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="w-full"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <motion.div
          className="glass-panel"
          style={{
            border: "3px solid #dc2626",
            background: "rgba(239, 68, 68, 0.1)",
          }}
          animate={{
            boxShadow: [
              "0 0 0 rgba(220, 38, 38, 0.4)",
              "0 0 20px rgba(220, 38, 38, 0.4)",
              "0 0 0 rgba(220, 38, 38, 0.4)",
            ],
          }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="flex items-center">
            <motion.svg
              className="w-5 h-5 text-red-600 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </motion.svg>
            <h3
              className="text-lg font-bold text-red-800"
              style={{ textShadow: "0 0 3px rgba(255, 255, 255, 0.5)" }}
            >
              Search Error
            </h3>
          </div>
          <p
            className="mt-2 text-red-700 font-bold"
            style={{ textShadow: "0 0 3px rgba(255, 255, 255, 0.5)" }}
          >
            {error}
          </p>
        </motion.div>
      </motion.div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <motion.div
        className="w-full"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <motion.div
          className="glass-panel text-center"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <motion.svg
            className="w-12 h-12 text-gray-600 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            initial={{ rotate: -10 }}
            animate={{ rotate: [0, -10, 10, -10] }}
            transition={{
              repeat: Infinity,
              duration: 4,
              ease: "easeInOut",
            }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </motion.svg>
          <motion.h3
            className="text-lg font-bold text-black mb-2"
            style={{ textShadow: "0 0 3px rgba(255, 255, 255, 0.5)" }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            No results found
          </motion.h3>
          <motion.p
            className="text-black font-bold"
            style={{ textShadow: "0 0 3px rgba(255, 255, 255, 0.5)" }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {query
              ? `No results found for "${query}". Try adjusting your search terms or filters.`
              : "Try entering a search query."}
          </motion.p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="w-full">
      {/* Search Stats */}
      {(totalResults !== undefined || searchTime !== undefined) && (
        <div
          className="mb-6 text-sm font-bold text-black"
          style={{ textShadow: "0 0 3px rgba(255, 255, 255, 0.5)" }}
        >
          {totalResults !== undefined && <span>About {totalResults.toLocaleString()} results</span>}
          {searchTime !== undefined && (
            <span className="ml-2">({searchTime.toFixed(2)} seconds)</span>
          )}
        </div>
      )}

      {/* Results */}
      <div className="space-y-6">
        <AnimatePresence>
          {results.map((result, index) => (
            <motion.div
              key={index}
              className="glass-panel cursor-pointer"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{
                delay: index * 0.1,
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              whileHover={{
                y: -4,
                boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15), 0 0 20px rgba(255, 255, 255, 0.8)",
                transition: { type: "spring", stiffness: 400 },
              }}
              onClick={() => toggleCard(index)}
            >
              {/* Header with expand/collapse button */}
              <div className="flex justify-between items-start mb-2">
                <motion.h3
                  className="text-lg font-bold flex-1 mr-4"
                  style={{
                    color: "#1e40af",
                    textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
                  }}
                  whileHover={{ scale: 1.02 }}
                >
                  <a
                    href={result.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                    onClick={e => e.stopPropagation()}
                  >
                    {result.title}
                  </a>
                </motion.h3>

                <motion.button
                  className="text-blue-600 hover:text-blue-800 p-1"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  animate={{ rotate: expandedCards.has(index) ? 180 : 0 }}
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

              {/* URL */}
              <motion.div
                className="text-sm font-bold mb-2"
                style={{
                  color: "#059669",
                  textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
                }}
                whileHover={{ scale: 1.01 }}
              >
                {result.link}
              </motion.div>

              {/* Snippet - Always visible */}
              <motion.p
                className="font-bold leading-relaxed mb-4"
                style={{
                  color: "var(--jet-black)",
                  textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
                }}
                initial={false}
              >
                {expandedCards.has(index)
                  ? result.snippet
                  : `${result.snippet.slice(0, 150)}${result.snippet.length > 150 ? "..." : ""}`}
              </motion.p>

              {/* Collapsible content */}
              <AnimatePresence>
                {expandedCards.has(index) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    {/* Additional metadata if available */}
                    {result.metadata && (
                      <motion.div
                        className="flex flex-wrap gap-2 mt-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        {result.metadata.source && (
                          <motion.span
                            className="glass-button"
                            style={{
                              width: "auto",
                              padding: "0.25rem 0.75rem",
                              fontSize: "0.75rem",
                              background: "rgba(59, 130, 246, 0.2)",
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            📊 {result.metadata.source}
                          </motion.span>
                        )}
                        {result.metadata.type && (
                          <motion.span
                            className="glass-button"
                            style={{
                              width: "auto",
                              padding: "0.25rem 0.75rem",
                              fontSize: "0.75rem",
                              background: "rgba(107, 114, 128, 0.2)",
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            📄 {result.metadata.type}
                          </motion.span>
                        )}
                        {result.metadata.date && (
                          <motion.span
                            className="glass-button"
                            style={{
                              width: "auto",
                              padding: "0.25rem 0.75rem",
                              fontSize: "0.75rem",
                              background: "rgba(34, 197, 94, 0.2)",
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            📅 {new Date(result.metadata.date).toLocaleDateString()}
                          </motion.span>
                        )}
                        {result.metadata.relevance && (
                          <motion.span
                            className="glass-button"
                            style={{
                              width: "auto",
                              padding: "0.25rem 0.75rem",
                              fontSize: "0.75rem",
                              background: "rgba(245, 158, 11, 0.2)",
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            🎯 {Math.round(result.metadata.relevance * 100)}%
                          </motion.span>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Load More Button (if needed) */}
      {results.length > 0 && totalResults && results.length < totalResults && (
        <div className="mt-8 text-center">
          <button
            className="glass-button"
            style={{
              width: "auto",
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
            }}
          >
            Load More Results
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchResults;

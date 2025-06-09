import React, { FC, useMemo } from "react";
import { SearchResult, LocalSearchResult, GoogleSearchResult } from "../types/search";

interface SearchResultsProps {
  results: SearchResult[];
}

const SearchResults: FC<SearchResultsProps> = ({ results }) => {
  const renderResult = useMemo(() => {
    return results.map((result, index) => {
      if ("id" in result && "publishedAt" in result) {
        const localResult = result as LocalSearchResult;
        return (
          <li key={index} className="bg-white shadow-md rounded p-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">{localResult.title}</h3>
              <p className="text-gray-700 mt-2">{localResult.summary || "No summary available"}</p>
              <div className="text-sm text-gray-500 mt-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                  Local Database
                </span>
                {localResult.publishedAt && (
                  <span>Published: {new Date(localResult.publishedAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </li>
        );
      } else if ("url" in result && "snippet" in result) {
        const googleResult = result as GoogleSearchResult;
        return (
          <li key={index} className="bg-white shadow-md rounded p-4">
            <div>
              <a
                href={googleResult.url}
                className="text-blue-500 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                <h3 className="text-xl font-semibold">{googleResult.title}</h3>
              </a>
              <p className="text-gray-700 mt-2">{googleResult.snippet}</p>
              <div className="text-sm text-gray-500 mt-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded mr-2">
                  Google Search
                </span>
                <span className="text-blue-600">{googleResult.url}</span>
              </div>
            </div>
          </li>
        );
      } else {
        return (
          <li key={index} className="bg-white shadow-md rounded p-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Unknown Result Type</h3>
              <pre className="text-sm text-gray-600 mt-2">{JSON.stringify(result, null, 2)}</pre>
            </div>
          </li>
        );
      }
    });
  }, [results]);

  return (
    <div className="py-4 px-2 max-w-5xl mx-auto">
      {results.length > 0 ? (
        <ul className="space-y-4">{renderResult}</ul>
      ) : (
        <div className="text-center text-gray-600">
          <p>No results found. Please try a different search query.</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(SearchResults);

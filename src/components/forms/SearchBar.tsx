import React, { useState, useCallback, useMemo } from "react";

interface SearchBarProps {
  query: string;
  onSearch: (query: string, source?: "all" | "local" | "google") => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ query, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState(query);
  const [searchSource, setSearchSource] = useState<"all" | "local" | "google">("all");

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  }, []);

  const handleSourceChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchSource(event.target.value as "all" | "local" | "google");
  }, []);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim() === "") {
      alert("Please enter a query to search.");
      return;
    }
    onSearch(searchQuery, searchSource);
  }, [onSearch, searchQuery, searchSource]);

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch]
  );

  const searchInputProps = useMemo(
    () => ({
      type: "text",
      value: searchQuery,
      onChange: handleInputChange,
      onKeyPress: handleKeyPress,
      className:
        "border rounded-l px-3 py-2 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500",
      placeholder: "Search for laws, policies, and news...",
    }),
    [searchQuery, handleInputChange, handleKeyPress]
  );

  const searchSelectProps = useMemo(
    () => ({
      value: searchSource,
      onChange: handleSourceChange,
      className: "border-t border-b px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
    }),
    [searchSource, handleSourceChange]
  );

  const searchButtonProps = useMemo(
    () => ({
      onClick: handleSearch,
      className:
        "bg-blue-500 text-white font-bold py-2 px-4 rounded-r hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500",
    }),
    [handleSearch]
  );

  return (
    <div className="flex flex-col items-center justify-center my-4 space-y-2">
      <div className="flex items-center">
        <input {...searchInputProps} />
        <select {...searchSelectProps}>
          <option value="all">All Sources</option>
          <option value="local">Local Database</option>
          <option value="google">Google Search</option>
        </select>
        <button {...searchButtonProps}>Search</button>
      </div>
    </div>
  );
};

export default React.memo(SearchBar);

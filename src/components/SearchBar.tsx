import React, { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string, filters?: SearchFilters) => void;
  placeholder?: string;
  showFilters?: boolean;
  loading?: boolean;
}

interface SearchFilters {
  source?: "all" | "local" | "google" | "legal" | "policy";
  location?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Search child welfare data...",
  showFilters = true,
  loading = false,
}) => {
  const [query, setQuery] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    source: "all",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), filters);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className="glass-panel"
          style={{ padding: "0.5rem", display: "flex", alignItems: "center" }}
        >
          <div className="flex-1 relative">
            <label htmlFor="search-input" className="sr-only">
              Search
            </label>
            <input
              id="search-input"
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={placeholder}
              className="glass-input w-full"
              style={{ margin: 0 }}
              disabled={loading}
            />
          </div>

          {showFilters && (
            <button
              type="button"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="glass-button"
              style={{
                width: "auto",
                margin: "0 0.5rem",
                padding: "0.75rem",
              }}
              disabled={loading}
              aria-label="Toggle filters"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
            </button>
          )}

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="glass-button"
            style={{
              width: "auto",
              padding: "0.75rem 1.5rem",
              margin: 0,
              opacity: loading || !query.trim() ? 0.5 : 1,
            }}
            aria-label="Search"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            )}
          </button>
        </div>
      </form>

      {/* Filter Panel */}
      {showFilterPanel && showFilters && (
        <div className="glass-panel mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Source Filter */}
            <div>
              <label
                htmlFor="source-select"
                className="block text-sm font-bold text-black mb-2"
                style={{ textShadow: "0 0 3px rgba(255, 255, 255, 0.5)" }}
              >
                Search Source
              </label>
              <select
                id="source-select"
                value={filters.source}
                onChange={e => handleFilterChange("source", e.target.value)}
                className="glass-input w-full"
              >
                <option value="all">All Sources</option>
                <option value="local">Local Database</option>
                <option value="google">Google Search</option>
                <option value="legal">Legal Documents</option>
                <option value="policy">Policy Documents</option>
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label
                htmlFor="location-input"
                className="block text-sm font-bold text-black mb-2"
                style={{ textShadow: "0 0 3px rgba(255, 255, 255, 0.5)" }}
              >
                Location
              </label>
              <input
                id="location-input"
                type="text"
                value={filters.location || ""}
                onChange={e => handleFilterChange("location", e.target.value)}
                placeholder="e.g., King County, WA"
                className="glass-input w-full"
              />
            </div>

            {/* Date Range */}
            <div>
              <label
                htmlFor="date-start"
                className="block text-sm font-bold text-black mb-2"
                style={{ textShadow: "0 0 3px rgba(255, 255, 255, 0.5)" }}
              >
                Date Range
              </label>
              <div className="flex space-x-2">
                <input
                  id="date-start"
                  type="date"
                  value={filters.dateRange?.start || ""}
                  onChange={e =>
                    handleFilterChange("dateRange", {
                      ...filters.dateRange,
                      start: e.target.value,
                    })
                  }
                  className="glass-input flex-1"
                  aria-label="Start date"
                />
                <input
                  id="date-end"
                  type="date"
                  value={filters.dateRange?.end || ""}
                  onChange={e =>
                    handleFilterChange("dateRange", {
                      ...filters.dateRange,
                      end: e.target.value,
                    })
                  }
                  className="glass-input flex-1"
                  aria-label="End date"
                />
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="mt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setFilters({ source: "all" });
                setShowFilterPanel(false);
              }}
              className="glass-button"
              style={{ width: "auto", padding: "0.5rem 1rem" }}
            >
              Clear Filters
            </button>
            <button
              type="button"
              onClick={() => setShowFilterPanel(false)}
              className="glass-button"
              style={{ width: "auto", padding: "0.5rem 1rem" }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;

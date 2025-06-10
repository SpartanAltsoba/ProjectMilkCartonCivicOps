import React, { memo, useCallback } from "react";
import ErrorBoundary from "../ErrorBoundary"; // Import ErrorBoundary from the parent directory

// Define interfaces for type safety
interface StateCountySelectorProps {
  states: string[];
  counties: Record<string, string[]>; // State name to array of counties
  selectedState: string;
  selectedCounty: string;
  onStateChange: (state: string) => void;
  onCountyChange: (county: string) => void;
}

// StateCountySelector component with enhanced logic
const StateCountySelector: React.FC<StateCountySelectorProps> = ({
  states,
  counties,
  selectedState,
  selectedCounty,
  onStateChange,
  onCountyChange,
}) => {
  // Handle state change with reset logic for county
  const handleStateChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newState = event.target.value;
      if (!states.includes(newState)) {
        console.warn(`Invalid state selected: ${newState}`);
        return;
      }
      onStateChange(newState);
      // Reset county if state changes
      if (newState !== selectedState) {
        onCountyChange("");
      }
    },
    [states, selectedState, onStateChange, onCountyChange]
  );

  // Handle county change with validation
  const handleCountyChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newCounty = event.target.value;
      const availableCounties = counties[selectedState] || [];
      if (!availableCounties.includes(newCounty) && newCounty !== "") {
        console.warn(`Invalid county selected: ${newCounty} for state ${selectedState}`);
        return;
      }
      onCountyChange(newCounty);
    },
    [counties, selectedState, onCountyChange]
  );

  // Get available counties for the selected state
  const availableCounties = counties[selectedState] || [];

  return (
    <ErrorBoundary>
      <div className="flex flex-col space-y-4">
        {/* State selector */}
        <div className="flex flex-col">
          <label htmlFor="state-selector" className="mb-1 text-sm font-medium text-gray-700">
            Select State
          </label>
          <select
            id="state-selector"
            value={selectedState}
            onChange={handleStateChange}
            className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Select a state to view CPS data"
            disabled={states.length === 0}
          >
            <option value="" disabled>
              {states.length === 0 ? "Loading states..." : "Select a state"}
            </option>
            {states.map(state => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        {/* County selector */}
        <div className="flex flex-col">
          <label htmlFor="county-selector" className="mb-1 text-sm font-medium text-gray-700">
            Select County
          </label>
          <select
            id="county-selector"
            value={selectedCounty}
            onChange={handleCountyChange}
            className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Select a county to view CPS data"
            disabled={!selectedState || availableCounties.length === 0}
          >
            <option value="" disabled>
              {selectedState
                ? availableCounties.length === 0
                  ? "No counties available"
                  : "Select a county"
                : "Select a state first"}
            </option>
            {availableCounties.map(county => (
              <option key={county} value={county}>
                {county}
              </option>
            ))}
          </select>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default memo(StateCountySelector);

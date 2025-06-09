import React from "react";

interface StateCountySelectorProps {
  states: string[];
  counties: Record<string, string[]>;
  selectedState: string;
  selectedCounty: string;
  onStateChange: (state: string) => void;
  onCountyChange: (county: string) => void;
}

const StateCountySelector: React.FC<StateCountySelectorProps> = ({
  states,
  counties,
  selectedState,
  selectedCounty,
  onStateChange,
  onCountyChange,
}) => {
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    onStateChange(newState);
    onCountyChange(""); // Reset county when state changes
  };

  const handleCountyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onCountyChange(e.target.value);
  };

  const availableCounties = selectedState ? counties[selectedState] || [] : [];

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <div>
          <label
            htmlFor="state-select"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "var(--jet-black)",
              fontWeight: "700",
              textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
            }}
          >
            State
          </label>
          <select
            id="state-select"
            value={selectedState}
            onChange={handleStateChange}
            className="glass-input"
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "var(--jet-black)",
              fontWeight: "500",
            }}
          >
            <option value="">Select a state...</option>
            {states.map(state => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="county-select"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "var(--jet-black)",
              fontWeight: "700",
              textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
            }}
          >
            County
          </label>
          <select
            id="county-select"
            value={selectedCounty}
            onChange={handleCountyChange}
            disabled={!selectedState}
            className="glass-input"
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "var(--jet-black)",
              fontWeight: "500",
              opacity: !selectedState ? "0.5" : "1",
              cursor: !selectedState ? "not-allowed" : "pointer",
            }}
          >
            <option value="">Select a county...</option>
            {availableCounties.map(county => (
              <option key={county} value={county}>
                {county}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedState && selectedCounty && (
        <div
          className="glass-panel"
          style={{
            padding: "1rem",
            marginTop: "1rem",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            borderRadius: "0.5rem",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <p style={{ color: "var(--jet-black)", fontWeight: "700" }}>
            <strong>Selected Location:</strong> {selectedCounty} County, {selectedState}
          </p>
        </div>
      )}
    </div>
  );
};

export default StateCountySelector;

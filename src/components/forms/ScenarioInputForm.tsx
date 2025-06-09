import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const StateCountySelector = dynamic(() => import("../StateCountySelector"));
const LoadingSpinner = dynamic(() => import("../LoadingSpinner"));

interface ScenarioInputFormProps {
  onSubmit: (data: {
    state: string;
    county: string;
    city: string;
    scenarioType: string;
    scenarioDetails: string;
  }) => Promise<void>;
}

const ScenarioInputForm: React.FC<ScenarioInputFormProps> = ({ onSubmit }) => {
  const [state, setState] = useState("");
  const [county, setCounty] = useState("");
  const [city, setCity] = useState("");
  const [scenarioType, setScenarioType] = useState("");
  const [scenarioDetails, setScenarioDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statesData, setStatesData] = useState<string[]>([]);
  const [countiesData, setCountiesData] = useState<Record<string, string[]>>({});

  // Load states and counties data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/api/locations");
        if (response.ok) {
          const data = await response.json();
          setStatesData(data.states || []);
          setCountiesData(data.counties || {});
        } else {
          // Fallback data
          const fallbackData = {
            states: ["California", "Texas", "Florida", "New York", "Pennsylvania"],
            counties: {
              California: ["Los Angeles", "San Francisco", "Orange", "San Diego", "Sacramento"],
              Texas: ["Harris", "Dallas", "Tarrant", "Bexar", "Travis"],
              Florida: ["Miami-Dade", "Broward", "Palm Beach", "Hillsborough", "Orange"],
              "New York": ["New York", "Kings", "Queens", "Suffolk", "Nassau"],
              Pennsylvania: ["Philadelphia", "Allegheny", "Montgomery", "Bucks", "Chester"],
            },
          };
          setStatesData(fallbackData.states);
          setCountiesData(fallbackData.counties);
        }
      } catch (err) {
        console.error("Error loading location data:", err);
        // Use fallback data
        const fallbackData = {
          states: ["California", "Texas", "Florida", "New York", "Pennsylvania"],
          counties: {
            California: ["Los Angeles", "San Francisco", "Orange", "San Diego", "Sacramento"],
            Texas: ["Harris", "Dallas", "Tarrant", "Bexar", "Travis"],
            Florida: ["Miami-Dade", "Broward", "Palm Beach", "Hillsborough", "Orange"],
            "New York": ["New York", "Kings", "Queens", "Suffolk", "Nassau"],
            Pennsylvania: ["Philadelphia", "Allegheny", "Montgomery", "Bucks", "Chester"],
          },
        };
        setStatesData(fallbackData.states);
        setCountiesData(fallbackData.counties);
      }
    };

    loadData();
  }, []);

  const scenarios = [
    "Mandated Reporter Investigation",
    "Foster Care Placement",
    "Runaway Recovery",
    "Parental Rights Termination",
    "NGO Contract Oversight",
    "Mental Health Referral",
    "Federal Audit Response",
    "State Policy Implementation",
    "Court Petition Filing",
    "CPS Investigation",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state || !county || !city || !scenarioType || !scenarioDetails) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({ state, county, city, scenarioType, scenarioDetails });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="glass-panel">
        <h2 className="text-xl font-black text-black mb-4">Location Details</h2>

        <StateCountySelector
          states={statesData}
          counties={countiesData}
          selectedState={state}
          selectedCounty={county}
          onStateChange={setState}
          onCountyChange={setCounty}
        />

        <div className="mt-4">
          <label htmlFor="city" className="block text-sm font-black text-black mb-2">
            City
          </label>
          <input
            type="text"
            id="city"
            value={city}
            onChange={e => setCity(e.target.value)}
            className="glass-input"
            placeholder="Enter city name"
            required
          />
        </div>
      </div>

      <div className="glass-panel">
        <h2 className="text-xl font-black text-black mb-4">Investigation Scenario</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="scenarioType" className="block text-sm font-black text-black mb-2">
              Scenario Type
            </label>
            <select
              id="scenarioType"
              value={scenarioType}
              onChange={e => setScenarioType(e.target.value)}
              className="glass-input"
              required
            >
              <option value="">Select a scenario type...</option>
              {scenarios.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="scenarioDetails" className="block text-sm font-black text-black mb-2">
              Scenario Details
            </label>
            <textarea
              id="scenarioDetails"
              value={scenarioDetails}
              onChange={e => setScenarioDetails(e.target.value)}
              className="glass-input"
              placeholder="Provide detailed information about the scenario..."
              rows={5}
              required
              style={{ resize: "vertical", minHeight: "120px" }}
            />
            <p className="text-sm text-black/70 mt-1">
              Include relevant dates, key events, involved parties, and any specific concerns or
              questions.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-panel bg-red-50">
          <p className="text-red-600 font-bold">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`glass-button w-full ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <LoadingSpinner size="small" />
            <span>Running Investigation...</span>
          </div>
        ) : (
          "Run Investigation"
        )}
      </button>
    </form>
  );
};

export default ScenarioInputForm;

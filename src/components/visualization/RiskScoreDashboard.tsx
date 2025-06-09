import React, { FC, useEffect, useState } from "react";
import axios from "axios";
import LoadingSpinner from "./LoadingSpinner";

interface RiskScore {
  id: string;
  name: string;
  source: string;
  timestamp: string;
  confidence: number;
  value: number;
}

interface Alert {
  id: string;
  message: string;
  timestamp: number;
  severity: "low" | "medium" | "high";
}

interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

interface RiskScoreDashboardProps {
  riskScores: RiskScore[];
  alerts: Alert[];
  className?: string;
}

interface EnhancedRiskScoreDashboardProps extends RiskScoreDashboardProps {
  showAlertsOnly?: boolean;
}

const RiskScoreDashboard: FC<EnhancedRiskScoreDashboardProps> = ({
  riskScores,
  alerts,
  className,
  showAlertsOnly = false,
}) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    error: null,
  });

  const [displayedAlerts, setDisplayedAlerts] = useState<Alert[]>(alerts);

  const fetchData = async () => {
    try {
      setLoadingState({ isLoading: true, error: null });
      const [scoresResponse, alertsResponse] = await Promise.all([
        !showAlertsOnly
          ? axios.get<{ data: RiskScore[] }>("/api/data/risk-scores")
          : Promise.resolve(null),
        axios.get<Alert[]>("/api/data/alerts"),
      ]);

      if (alertsResponse) {
        setDisplayedAlerts(alertsResponse.data);
      }

      console.log("Data fetched:", {
        scores: scoresResponse?.data,
        alerts: alertsResponse.data,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch data";
      setLoadingState({
        isLoading: false,
        error: errorMessage,
      });
      console.error("Error fetching data:", err);
    } finally {
      if (!loadingState.error) {
        setLoadingState({ isLoading: false, error: null });
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [showAlertsOnly]);

  const getSeverityColor = (value: number): string => {
    if (value >= 75) return "text-red-600";
    if (value >= 50) return "text-yellow-600";
    return "text-green-600";
  };

  const getAlertSeverityColor = (severity: Alert["severity"]): string => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderAlerts = () => (
    <div className={showAlertsOnly ? "" : "mt-8 border-t pt-6"}>
      <h3 className="text-xl font-semibold mb-4" id="alerts-title">
        Active Alerts
      </h3>
      {displayedAlerts.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No active alerts</p>
      ) : (
        <ul className="space-y-3" role="list" aria-labelledby="alerts-title">
          {displayedAlerts.map(alert => (
            <li
              key={alert.id}
              className={`p-4 rounded-md ${getAlertSeverityColor(alert.severity)}`}
              role="alert"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{alert.message}</span>
                <span className="text-sm">{new Date(alert.timestamp).toLocaleDateString()}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const renderRiskScores = () =>
    riskScores.length > 0 ? (
      <div className="space-y-6">
        <ul className="divide-y divide-gray-200" role="list" aria-label="Risk scores list">
          {riskScores.map(score => (
            <li key={score.id} className="py-4 transition-colors hover:bg-gray-50 rounded-md">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">{score.name}</span>
                  <span className="text-sm text-gray-500">
                    Source: {score.source} | Updated:{" "}
                    {new Date(score.timestamp).toLocaleDateString()}
                  </span>
                  <span className="text-sm text-gray-500">Confidence: {score.confidence}%</span>
                </div>
                <div className="flex items-center">
                  <span className={`text-lg font-semibold ${getSeverityColor(score.value)}`}>
                    {score.value}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    ) : (
      <p className="text-gray-500 text-center py-4">No risk scores available</p>
    );

  return (
    <div
      className={`p-6 bg-white shadow-md rounded-lg ${className || ""}`}
      role="region"
      aria-label={showAlertsOnly ? "Risk Alerts" : "Risk Score Dashboard"}
    >
      <h2 className="text-2xl font-semibold mb-6" id="dashboard-title">
        {showAlertsOnly ? "Risk Alerts" : "Risk Score Dashboard"}
      </h2>

      {loadingState.isLoading ? (
        <div className="p-8">
          <LoadingSpinner size="large" />
        </div>
      ) : loadingState.error ? (
        <div className="text-center py-4">
          <p className="text-red-600 mb-4" role="alert">
            {loadingState.error}
          </p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            aria-label="Retry loading data"
          >
            Retry
          </button>
        </div>
      ) : (
        <div aria-labelledby="dashboard-title">
          {!showAlertsOnly && renderRiskScores()}
          {renderAlerts()}
        </div>
      )}
    </div>
  );
};

export default RiskScoreDashboard;

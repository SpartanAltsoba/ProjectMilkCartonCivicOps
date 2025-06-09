import React from "react";
import { RiskScore, Alert } from "../types/dashboard";

interface RiskScoreDashboardProps {
  riskScores: RiskScore[];
  alerts: Alert[];
  loading?: boolean;
}

const RiskScoreDashboard: React.FC<RiskScoreDashboardProps> = ({
  riskScores,
  alerts,
  loading = false,
}) => {
  const getRiskLevelColor = (score: number): string => {
    if (score >= 80) return "rgba(239, 68, 68, 0.1)"; // red
    if (score >= 60) return "rgba(249, 115, 22, 0.1)"; // orange
    if (score >= 40) return "rgba(234, 179, 8, 0.1)"; // yellow
    return "rgba(34, 197, 94, 0.1)"; // green
  };

  const getRiskLevelTextColor = (score: number): string => {
    if (score >= 80) return "#dc2626"; // red
    if (score >= 60) return "#ea580c"; // orange
    if (score >= 40) return "#ca8a04"; // yellow
    return "#16a34a"; // green
  };

  const getRiskLevelText = (score: number): string => {
    if (score >= 80) return "Critical";
    if (score >= 60) return "High";
    if (score >= 40) return "Medium";
    return "Low";
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Loading skeleton for risk scores */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1rem",
          }}
        >
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="glass-panel animate-pulse">
              <div
                style={{
                  height: "1.5rem",
                  width: "60%",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  marginBottom: "1rem",
                }}
              ></div>
              <div
                style={{
                  height: "2rem",
                  width: "40%",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                }}
              ></div>
            </div>
          ))}
        </div>
        <div className="glass-panel" style={{ textAlign: "center" }}>
          <p
            style={{
              color: "var(--jet-black)",
              fontWeight: "700",
              textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
            }}
          >
            Loading risk assessment data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Risk Scores Section */}
      {riskScores.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1rem",
          }}
        >
          {riskScores.map((score, index) => (
            <div
              key={index}
              className="glass-panel"
              style={{
                background: getRiskLevelColor(score.value),
                border: `2px solid ${getRiskLevelTextColor(score.value)}`,
              }}
            >
              <h3
                style={{
                  color: "var(--jet-black)",
                  fontWeight: "700",
                  textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
                  marginBottom: "0.5rem",
                }}
              >
                {score.category}
              </h3>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "900",
                    color: getRiskLevelTextColor(score.value),
                  }}
                >
                  {score.value}
                </span>
                <span
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "700",
                    color: getRiskLevelTextColor(score.value),
                  }}
                >
                  {getRiskLevelText(score.value)}
                </span>
              </div>
              {score.description && (
                <p
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.875rem",
                    color: "var(--jet-black)",
                    textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
                  }}
                >
                  {score.description}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ textAlign: "center" }}>
          <p
            style={{
              color: "var(--jet-black)",
              fontWeight: "700",
              textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
            }}
          >
            Select a location to view risk scores
          </p>
        </div>
      )}

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h3
            style={{
              color: "var(--jet-black)",
              fontWeight: "900",
              textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
              fontSize: "1.25rem",
            }}
          >
            Active Alerts
          </h3>
          {alerts.map((alert, index) => (
            <div
              key={index}
              className="glass-panel"
              style={{
                background:
                  alert.severity === "high"
                    ? "rgba(239, 68, 68, 0.1)"
                    : alert.severity === "medium"
                      ? "rgba(234, 179, 8, 0.1)"
                      : "rgba(59, 130, 246, 0.1)",
                border: `2px solid ${
                  alert.severity === "high"
                    ? "#dc2626"
                    : alert.severity === "medium"
                      ? "#ca8a04"
                      : "#2563eb"
                }`,
              }}
            >
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}
              >
                <h4
                  style={{
                    color: "var(--jet-black)",
                    fontWeight: "700",
                    textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
                  }}
                >
                  {alert.title}
                </h4>
                <span
                  style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: "0.25rem",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    background:
                      alert.severity === "high"
                        ? "rgba(239, 68, 68, 0.2)"
                        : alert.severity === "medium"
                          ? "rgba(234, 179, 8, 0.2)"
                          : "rgba(59, 130, 246, 0.2)",
                    color:
                      alert.severity === "high"
                        ? "#dc2626"
                        : alert.severity === "medium"
                          ? "#ca8a04"
                          : "#2563eb",
                  }}
                >
                  {alert.severity.toUpperCase()}
                </span>
              </div>
              <p
                style={{
                  marginTop: "0.5rem",
                  color: "var(--jet-black)",
                  textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
                }}
              >
                {alert.message}
              </p>
              {alert.timestamp && (
                <p
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.75rem",
                    color: "var(--jet-black)",
                    opacity: 0.7,
                    textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
                  }}
                >
                  Reported: {new Date(alert.timestamp).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recommendations Section */}
      {riskScores.length > 0 && riskScores.some(score => score.value >= 60) && (
        <div className="glass-panel">
          <h3
            style={{
              color: "var(--jet-black)",
              fontWeight: "900",
              textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
              marginBottom: "1rem",
              fontSize: "1.25rem",
            }}
          >
            Recommendations
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {riskScores
              .filter(score => score.value >= 60)
              .map((score, index) => (
                <div
                  key={index}
                  className="glass-panel"
                  style={{
                    background: getRiskLevelColor(score.value),
                    border: `2px solid ${getRiskLevelTextColor(score.value)}`,
                  }}
                >
                  <h4
                    style={{
                      color: "var(--jet-black)",
                      fontWeight: "700",
                      textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {score.category} Risk Mitigation
                  </h4>
                  <ul
                    style={{
                      listStyleType: "disc",
                      listStylePosition: "inside",
                      color: "var(--jet-black)",
                      textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
                      margin: 0,
                      padding: 0,
                    }}
                  >
                    <li style={{ marginBottom: "0.5rem" }}>
                      Review current protocols and procedures
                    </li>
                    <li style={{ marginBottom: "0.5rem" }}>
                      Schedule immediate stakeholder meeting
                    </li>
                    <li style={{ marginBottom: "0.5rem" }}>
                      Implement enhanced monitoring measures
                    </li>
                    <li>Document all mitigation steps taken</li>
                  </ul>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskScoreDashboard;

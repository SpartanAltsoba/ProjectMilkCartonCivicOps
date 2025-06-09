import React from "react";

interface ExportOptionsProps {
  onExport?: (format: string) => void;
  exportTypes?: string[];
  selectedOptions?: string[];
}

const ExportOptions: React.FC<ExportOptionsProps> = ({
  onExport,
  exportTypes = ["pdf", "csv", "json"],
}) => {
  const handleExport = (format: string) => {
    if (onExport) {
      onExport(format);
    }
  };

  return (
    <div className="export-options">
      <div className="export-buttons" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {exportTypes.map(format => (
          <button
            key={format}
            onClick={() => handleExport(format)}
            className="glass-button"
            style={{ flex: 1, minWidth: "120px" }}
          >
            Export as {String(format).toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExportOptions;

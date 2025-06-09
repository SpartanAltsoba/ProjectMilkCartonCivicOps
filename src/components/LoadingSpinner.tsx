import React from "react";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "medium" }) => {
  const dimensions = {
    small: { width: "20px", height: "20px", border: "2px" },
    medium: { width: "30px", height: "30px", border: "3px" },
    large: { width: "40px", height: "40px", border: "4px" },
  };

  const { width, height, border } = dimensions[size];

  return (
    <div
      style={{
        width,
        height,
        border: `${border} solid rgba(255, 255, 255, 0.3)`,
        borderTop: `${border} solid white`,
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        display: "inline-block",
      }}
    />
  );
};

export default LoadingSpinner;

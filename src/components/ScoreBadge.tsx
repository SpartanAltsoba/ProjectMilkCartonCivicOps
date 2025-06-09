import React from "react";
import { motion } from "framer-motion";

interface ScoreBadgeProps {
  level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "GOOD" | "EXCELLENT";
  score?: number;
  size?: "small" | "medium" | "large";
  animated?: boolean;
}

const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  level,
  score,
  size = "medium",
  animated = true,
}) => {
  const getScoreConfig = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return {
          color: "#dc2626",
          bgColor: "rgba(220, 38, 38, 0.1)",
          borderColor: "#dc2626",
          icon: "🚨",
          pulse: true,
        };
      case "HIGH":
        return {
          color: "#ea580c",
          bgColor: "rgba(234, 88, 12, 0.1)",
          borderColor: "#ea580c",
          icon: "⚠️",
          pulse: true,
        };
      case "MEDIUM":
        return {
          color: "#d97706",
          bgColor: "rgba(217, 119, 6, 0.1)",
          borderColor: "#d97706",
          icon: "⚡",
          pulse: false,
        };
      case "LOW":
        return {
          color: "#059669",
          bgColor: "rgba(5, 150, 105, 0.1)",
          borderColor: "#059669",
          icon: "📊",
          pulse: false,
        };
      case "GOOD":
        return {
          color: "#16a34a",
          bgColor: "rgba(22, 163, 74, 0.1)",
          borderColor: "#16a34a",
          icon: "✅",
          pulse: false,
        };
      case "EXCELLENT":
        return {
          color: "#0d9488",
          bgColor: "rgba(13, 148, 136, 0.1)",
          borderColor: "#0d9488",
          icon: "🏆",
          pulse: false,
        };
      default:
        return {
          color: "#6b7280",
          bgColor: "rgba(107, 114, 128, 0.1)",
          borderColor: "#6b7280",
          icon: "❓",
          pulse: false,
        };
    }
  };

  const getSizeConfig = (size: string) => {
    switch (size) {
      case "small":
        return {
          padding: "0.25rem 0.5rem",
          fontSize: "0.75rem",
          iconSize: "0.875rem",
        };
      case "large":
        return {
          padding: "0.75rem 1.5rem",
          fontSize: "1.125rem",
          iconSize: "1.5rem",
        };
      default: // medium
        return {
          padding: "0.5rem 1rem",
          fontSize: "0.875rem",
          iconSize: "1rem",
        };
    }
  };

  const config = getScoreConfig(level);
  const sizeConfig = getSizeConfig(size);

  const badgeVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30,
      },
    },
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
      },
    },
  };

  const pulseVariants = {
    pulse: {
      boxShadow: [
        `0 0 0 0 ${config.color}40`,
        `0 0 0 10px ${config.color}00`,
        `0 0 0 0 ${config.color}40`,
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.div
      className="inline-flex items-center gap-2 font-bold rounded-lg border-2"
      style={{
        padding: sizeConfig.padding,
        fontSize: sizeConfig.fontSize,
        color: config.color,
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
        textShadow: "0 0 3px rgba(255, 255, 255, 0.5)",
      }}
      variants={badgeVariants}
      initial={animated ? "initial" : false}
      animate={animated ? ["animate", config.pulse ? "pulse" : ""] : false}
      whileHover={animated ? "hover" : undefined}
      {...(config.pulse && animated ? pulseVariants : {})}
    >
      <motion.span
        style={{ fontSize: sizeConfig.iconSize }}
        animate={
          config.pulse && animated
            ? {
                scale: [1, 1.2, 1],
                transition: { duration: 1, repeat: Infinity },
              }
            : {}
        }
      >
        {config.icon}
      </motion.span>

      <span>{level}</span>

      {score !== undefined && (
        <motion.span
          className="ml-1 px-2 py-1 rounded text-xs"
          style={{
            backgroundColor: config.color,
            color: "white",
          }}
          initial={animated ? { scale: 0 } : false}
          animate={animated ? { scale: 1 } : false}
          transition={animated ? { delay: 0.3, type: "spring", stiffness: 500 } : {}}
        >
          {score}
        </motion.span>
      )}
    </motion.div>
  );
};

export default ScoreBadge;

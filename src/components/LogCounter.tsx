import React from "react";
import { motion } from "framer-motion";

interface LogCounterProps {
  logCounts: { [key: string]: number };
  activeFilters: string[];
  toggleFilter: (level: string) => void;
}

const LogCounter: React.FC<LogCounterProps> = React.memo(
  ({ logCounts, activeFilters, toggleFilter }) => {
    return (
      <div className="log-counters">
        {Object.entries(logCounts).map(([level, count]) => (
          <motion.span
            key={level}
            className={`log-counter ${level.toLowerCase()} ${
              activeFilters.includes(level) ? "active" : ""
            } ${count === 0 ? "disabled" : ""}`}
            whileHover={count > 0 ? { scale: 1.03 } : {}}
            whileTap={count > 0 ? { scale: 0.97 } : {}}
            transition={{ duration: 0.2 }}
            onClick={() => count > 0 && toggleFilter(level)}
          >
            {level}: {count}
          </motion.span>
        ))}
      </div>
    );
  },
);

export default LogCounter;

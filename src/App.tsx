import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";
import LogCounter from "./components/LogCounter";
import ServiceMenu from "./components/ServiceMenu";

interface LogEvent {
  id: string; // Add this if your logs don't already have a unique id
  service_name: string;
  operation_name: string;
  level: string;
  message: string;
  timestamp: string;
}

interface LogCounts {
  [key: string]: number;
}

const carbonColors = [
  "#4589ff", // Blue 50
  "#33b1ff", // Cyan 40
  "#3ddbd9", // Teal 30
  "#42be65", // Green 50
  "#f1c21b", // Yellow 30
  "#ff8389", // Red 40
  "#d12771", // Magenta 60
  "#a56eff", // Purple 50
  "#08bdba", // Teal 40
  "#ff7eb6", // Magenta 40
];

function getColorForService(serviceName: string) {
  const index =
    serviceName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    carbonColors.length;
  return carbonColors[index];
}

function highlightSearchTerm(text: string, searchTerm: string) {
  if (!searchTerm) return text;
  const parts = text.split(new RegExp(`(${searchTerm})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === searchTerm.toLowerCase() ? (
      <mark key={i} className="highlight">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

function LogEntry({
  log,
  searchTerm,
  searchTermChangeCounter,
}: {
  log: LogEvent;
  searchTerm: string;
  searchTermChangeCounter: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const serviceColor = getColorForService(log.service_name);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const highlightedMessage = useMemo(
    () => highlightSearchTerm(log.message, searchTerm),
    [log.message, searchTerm],
  );

  // Collapse when search term changes
  useEffect(() => {
    setIsExpanded(false);
  }, [searchTermChangeCounter]);

  return (
    <div
      className={`log-entry ${log.level.toLowerCase()} ${isExpanded ? "expanded" : ""}`}
    >
      <div className="log-entry-header" onClick={toggleExpand}>
        <span className="timestamp">
          {new Date(log.timestamp).toLocaleString()}
        </span>
        <span className="service-name" style={{ color: serviceColor }}>
          {log.service_name}
        </span>
        <span className={`log-level ${log.level.toLowerCase()}`}>
          {log.level}
        </span>
        <span className="log-message">{highlightedMessage}</span>
        <span className="expand-indicator">{isExpanded ? "▲" : "▼"}</span>
      </div>
      {isExpanded && (
        <div className="log-entry-card">
          <div className="card-row">
            <span className="card-label">Operation:</span>
            <span className="card-value operation">{log.operation_name}</span>
          </div>
          <div className="card-row">
            <span className="card-label">Full Message:</span>
            <span className="card-value message">{highlightedMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [isReceivingLogs, setIsReceivingLogs] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [activeLevelFilters, setActiveLevelFilters] = useState<string[]>([]);
  const [activeServiceFilters, setActiveServiceFilters] = useState<string[]>(
    [],
  );

  const timeoutRef = useRef<number | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermChangeCounter, setSearchTermChangeCounter] = useState(0);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const levelMatch =
        activeLevelFilters.length === 0 ||
        activeLevelFilters.includes(log.level);
      const serviceMatch =
        activeServiceFilters.length === 0 ||
        activeServiceFilters.includes(log.service_name);
      const searchMatch =
        searchTerm === "" ||
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.operation_name.toLowerCase().includes(searchTerm.toLowerCase());
      return levelMatch && serviceMatch && searchMatch;
    });
  }, [logs, activeLevelFilters, activeServiceFilters, searchTerm]);

  const memoizedLogCounts = useMemo(() => {
    const counts: LogCounts = { INFO: 0, WARN: 0, ERROR: 0, FATAL: 0 };
    logs.forEach((log) => {
      counts[log.level] = (counts[log.level] || 0) + 1;
    });
    return counts;
  }, [logs]);

  const memoizedServiceCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    logs.forEach((log) => {
      counts[log.service_name] = (counts[log.service_name] || 0) + 1;
    });
    return counts;
  }, [logs]);

  useEffect(() => {
    const unlisten = listen<LogEvent>("new-log", (event) => {
      setLogs((prevLogs) => [...prevLogs, event.payload]);
      setIsReceivingLogs(true);

      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        setIsReceivingLogs(false);
      }, 1000);

      if (logContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } =
          logContainerRef.current;
        setShowScrollIndicator(scrollHeight - scrollTop - clientHeight > 1);
      }
    });

    return () => {
      unlisten.then((f) => f());
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    setShowScrollIndicator(false);
    setActiveLevelFilters([]);
    setActiveServiceFilters([]);
  }, []);

  const scrollToBottom = () => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      setShowScrollIndicator(false);
    }
  };

  const toggleLevelFilter = useCallback((level: string) => {
    setActiveLevelFilters((prevFilters) => {
      if (prevFilters.includes(level)) {
        return prevFilters.filter((f) => f !== level);
      } else {
        return [...prevFilters, level];
      }
    });
  }, []);

  const toggleServiceFilter = useCallback((service: string) => {
    setActiveServiceFilters((prevFilters) =>
      prevFilters.includes(service)
        ? prevFilters.filter((f) => f !== service)
        : [...prevFilters, service],
    );
  }, []);

  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setSearchTermChangeCounter((prev) => prev + 1);
  };

  return (
    <div className="app-container">
      <div className="main-header">
        <h1>KizunaLabs ET</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={handleSearchTermChange}
            className="search-input"
          />
        </div>
      </div>
      <div className="content-container">
        <ServiceMenu
          services={memoizedServiceCounts}
          activeServices={activeServiceFilters}
          toggleService={toggleServiceFilter}
          getColorForService={getColorForService}
        />
        <div className="main-content">
          <div className="sub-header">
            <LogCounter
              logCounts={memoizedLogCounts}
              activeFilters={activeLevelFilters}
              toggleFilter={toggleLevelFilter}
            />
            <div className="header-controls">
              <span
                className={`log-indicator ${isReceivingLogs ? "receiving" : "idle"}`}
              >
                <span className="indicator-content">
                  <span className="arrow">{">"}</span>
                  <span className="arrow">{">"}</span>
                  <span className="arrow">{">"}</span>
                </span>
              </span>
              <button
                onClick={clearLogs}
                className={`clear-button ${logs.length === 0 ? "disabled" : ""}`}
                disabled={logs.length === 0}
              >
                Clear
              </button>
            </div>
          </div>
          <motion.div
            className="log-container"
            ref={logContainerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {filteredLogs.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="no-logs-message"
              >
                {logs.length === 0
                  ? "Waiting for new logs..."
                  : "No logs match the current filters"}
              </motion.div>
            )}
            <AnimatePresence>
              {filteredLogs.map((log) => (
                <LogEntry
                  key={log.id}
                  log={log}
                  searchTerm={searchTerm}
                  searchTermChangeCounter={searchTermChangeCounter}
                />
              ))}
            </AnimatePresence>
          </motion.div>
          <AnimatePresence>
            {showScrollIndicator && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="scroll-indicator"
                onClick={scrollToBottom}
              >
                ↓ New logs below
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default App;

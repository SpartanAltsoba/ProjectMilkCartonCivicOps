import React from 'react';
import styles from '../styles/LogsDisplay.module.css';

interface LogEntry {
  time: string;
  message: string;
  level: string;
}

interface LogsDisplayProps {
  logsData: LogEntry[];
}

const LogsDisplay: React.FC<LogsDisplayProps> = ({ logsData }) => {
  return (
    <div className={styles.logsDisplay}>
      {logsData.map((log, index) => (
        <div key={index} className={styles.logEntry}>
          <p><strong>Time:</strong> {log.time}</p>
          <p><strong>Message:</strong> {log.message}</p>
          <p><strong>Level:</strong> {log.level}</p>
        </div>
      ))}
    </div>
  );
};

export default LogsDisplay;

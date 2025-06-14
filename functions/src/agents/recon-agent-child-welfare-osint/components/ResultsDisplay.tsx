import React from 'react';
import styles from '../styles/ResultsDisplay.module.css';

interface ResultsDisplayProps {
  resultsData: Array<{
    id: string;
    title: string;
    summary: string;
    source: string;
    error?: string;
  }>;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ resultsData }) => {
  const renderResults = () => {
    if (!resultsData || resultsData.length === 0) {
      return <div>No results found. Please try another query or adjust your search parameters.</div>;
    }

    return resultsData.map((result) => (
      <div key={result.id} className={styles.resultCard}>
        <h3 className={styles.title}>{result.title}</h3>
        <p className={styles.summary}>{result.summary}</p>
        <p className={styles.source}><strong>Source:</strong> {result.source}</p>
        {result.error && <p className={styles.error}><strong>Error:</strong> {result.error}</p>}
      </div>
    ));
  };

  return (
    <div className={styles.resultsContainer}>
      <h2 className={styles.header}>Analysis Results</h2>
      {renderResults()}
    </div>
  );
};

export default ResultsDisplay;
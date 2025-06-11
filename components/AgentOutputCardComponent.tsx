import React from 'react';
import PropTypes from 'prop-types';
import styles from '../styles/AgentOutputCardComponent.module.css';

interface AgentOutputCardComponentProps {
  agentData: {
    title: string;
    summary: string;
    findings: string[];
    recommendations: string[];
    riskLevel: 'low' | 'medium' | 'high';
  };
}

const AgentOutputCardComponent: React.FC<AgentOutputCardComponentProps> = ({ agentData }) => {
  const { title, summary, findings, recommendations, riskLevel } = agentData;

  const renderFindings = () => {
    if (findings.length === 0) {
      return <p>No findings available.</p>;
    }

    return (
      <ul>
        {findings.map((finding, index) => (
          <li key={index}>{finding}</li>
        ))}
      </ul>
    );
  };

  const renderRecommendations = () => {
    if (recommendations.length === 0) {
      return <p>No recommendations available.</p>;
    }

    return (
      <ul>
        {recommendations.map((recommendation, index) => (
          <li key={index}>{recommendation}</li>
        ))}
      </ul>
    );
  };

  return (
    <div className={`${styles.card} ${styles[riskLevel]}`}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.summary}>{summary}</p>
      <div className={styles.findingsSection}>
        <h4>Findings</h4>
        {renderFindings()}
      </div>
      <div className={styles.recommendationsSection}>
        <h4>Recommendations</h4>
        {renderRecommendations()}
      </div>
      <div className={styles.riskIndicator}>
        Risk Level: <span className={styles.riskLevel}>{riskLevel}</span>
      </div>
    </div>
  );
};

AgentOutputCardComponent.propTypes = {
  agentData: PropTypes.shape({
    title: PropTypes.string.isRequired,
    summary: PropTypes.string.isRequired,
    findings: PropTypes.arrayOf(PropTypes.string).isRequired,
    recommendations: PropTypes.arrayOf(PropTypes.string).isRequired,
    riskLevel: PropTypes.oneOf(['low', 'medium', 'high']).isRequired,
  }).isRequired,
};

export default AgentOutputCardComponent;

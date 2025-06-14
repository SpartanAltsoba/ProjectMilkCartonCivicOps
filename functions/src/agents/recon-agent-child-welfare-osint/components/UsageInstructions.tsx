import React from 'react';
import styles from '../styles/UsageInstructions.module.css';

const UsageInstructions: React.FC = () => {
  return (
    <section className={styles.usageInstructions}>
      <h2>Usage Instructions</h2>
      <p>Welcome to the Recon Agent for Child Welfare OSINT application. This tool is designed to streamline intelligence gathering, processing both local and web data for insightful analysis in the domain of child welfare and foster care systems.</p>
      <ul>
        <li><strong>Local Data Analysis:</strong> Begin by uploading your local data files which will be pre-processed to extract any valuable information before querying online resources.</li>
        <li><strong>Google CSE Integration:</strong> Perform controlled search queries using Google Custom Search Engine for optimized result gathering from the web.</li>
        <li><strong>Advanced Web Scraping:</strong> Utilize the integrated web scraping capabilities using Playwright or Puppeteer to extract data from JavaScript-rendered pages.</li>
        <li><strong>GPT-4 Content Analysis:</strong> The application leverages GPT-4 for summarizing findings and extracting entities from the gathered data.</li>
        <li><strong>JSON Output Structure:</strong> Once processing is complete, results are presented in a standardized JSON format with all related error logs and data reconciled accordingly.</li>
      </ul>
      <p>We recommend users familiarize themselves with the capabilities to ensure comprehensive and effective analysis for maximizing the utility of the Recon Agent.</p>
    </section>
  );
};

export default UsageInstructions;
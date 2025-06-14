import React, { useEffect, useState } from 'react';
import { firestore } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import AgentOutputCardComponent from './AgentOutputCardComponent';
import styles from '../styles/JobStatusComponent.module.css';

interface JobStatusComponentProps {
  jobId: string;
}

interface JobData {
  status: string;
  query: string;
  localData?: any;
  webData?: any;
  gptAnalysis?: any;
  error?: string;
  createdAt?: any;
}

const JobStatusComponent: React.FC<JobStatusComponentProps> = ({ jobId }) => {
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const jobDocRef = doc(firestore, 'jobs', jobId);
    const unsubscribe = onSnapshot(
      jobDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setJobData(docSnap.data() as JobData);
          setError(null);
        } else {
          setError('Job not found');
          setJobData(null);
        }
      },
      (error) => {
        console.error('Error fetching job status:', error);
        setError('Error fetching job status');
        setJobData(null);
      }
    );

    return () => unsubscribe();
  }, [jobId]);

  const transformJobDataToAgentData = (data: JobData) => {
    if (!data || !data.gptAnalysis) return null;
    
    return {
      title: `Analysis Results for "${data.query}"`,
      summary: data.gptAnalysis.summary || 'No summary available',
      findings: data.gptAnalysis.entities || [],
      recommendations: [], // No recommendations in current data
      riskLevel: 'medium' as 'low' | 'medium' | 'high',
    };
  };

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!jobData) {
    return <div className={styles.loading}>Loading job status...</div>;
  }

  return (
    <div className={styles.jobStatus}>
      <div className={styles.header}>
        <h3>Job: {jobId}</h3>
        <span className={`${styles.status} ${styles[jobData.status]}`}>
          {jobData.status}
        </span>
      </div>
      {jobData.error && (
        <div className={styles.error}>Error: {jobData.error}</div>
      )}
      {jobData.status === 'completed' && jobData.gptAnalysis && (
        <AgentOutputCardComponent 
          agentData={transformJobDataToAgentData(jobData)}
        />
      )}
      {jobData.status !== 'completed' && jobData.status !== 'error' && (
        <div className={styles.progress}>
          <p>Processing your query: {jobData.query}</p>
          {/* Add progress indicator based on status */}
          {jobData.status === 'processing_local' && <p>Analyzing local data...</p>}
          {jobData.status === 'processing_web' && <p>Gathering web data...</p>}
          {jobData.status === 'processing_gpt' && <p>Analyzing with GPT...</p>}
        </div>
      )}
      {jobData.createdAt && (
        <div className={styles.timestamp}>
          Started: {new Date(jobData.createdAt.toDate()).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default JobStatusComponent;

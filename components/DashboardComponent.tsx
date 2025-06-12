import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { useRouter } from 'next/router';
import JobStatusComponent from './JobStatusComponent';
import styles from '../styles/Dashboard.module.css';

interface Job {
  id: string;
  status: string;
  // Add any other fields you use in JobStatusComponent
}

const DashboardComponent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { documents: jobs, loading: jobsLoading, error: jobsError } = useFirestore('jobs');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const handleNewAnalysis = () => {
    if (!user) {
      setError('You must be logged in to start a new analysis');
      return;
    }
    // TODO: Add logic to start new analysis (e.g., routing to a form or opening a modal)
  };

  return (
    <div className={styles.dashboard}>
      <h1>Dashboard</h1>
      {error && <div className={styles.error}>{error}</div>}
      <button onClick={handleNewAnalysis} className={styles.newAnalysisButton}>
        Start New Analysis
      </button>
      {jobsLoading ? (
        <div>Loading jobs...</div>
      ) : jobsError ? (
        <div className={styles.error}>{jobsError}</div>
      ) : !jobs || jobs.length === 0 ? (
        <div>No jobs found. Start a new analysis to see results.</div>
      ) : (
        <div className={styles.jobsList}>
          {jobs.map((job: Job) => (
            <JobStatusComponent
              key={job.id}
              jobId={job.id}
              // Pass any additional props required by JobStatusComponent
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardComponent;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { useRouter } from 'next/router';
import JobStatusComponent from './JobStatusComponent';

// Define styles in a CSS Modules or Styled Components manner
import styles from '../styles/Dashboard.module.css';

interface DashboardComponentProps {}

const DashboardComponent: React.FC<DashboardComponentProps> = () => {
  const { user, loading: authLoading } = useAuth();
  const { jobs, loading: jobsLoading } = useFirestore('jobs');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const handleNewAnalysis = () => {
    if (!user) {
      setError('You must be logged in to start a new analysis');
      return;
    }
    // Logic to start a new analysis
    // This could involve routing to a new page or opening a modal
  };

  const renderJobs = () => {
    if (jobsLoading) {
      return <div>Loading jobs...</div>;
    }

    if (!jobs || jobs.length === 0) {
      return <div>No jobs found. Start a new analysis to see results.</div>;
    }

    return (
      <div className={styles.jobsList}>
        {jobs.map((job) => (
          <JobStatusComponent
            key={job.id}
            jobId={job.id}
            status={job.status}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={styles.dashboard}>
      <h1>Dashboard</h1>
      {error && <div className={styles.error}>{error}</div>}
      <button onClick={handleNewAnalysis} className={styles.newAnalysisButton}>
        Start New Analysis
      </button>
      {renderJobs()}
    </div>
  );
};

export default DashboardComponent;

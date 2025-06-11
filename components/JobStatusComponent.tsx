import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface JobStatusComponentProps {
  jobId: string;
}

const JobStatusComponent: React.FC<JobStatusComponentProps> = ({ jobId }) => {
  const [status, setStatus] = useState<string>('Loading...');

  useEffect(() => {
    const jobDocRef = doc(db, 'jobs', jobId);
    const unsubscribe = onSnapshot(
      jobDocRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setStatus(data?.status || 'Unknown');
        } else {
          setStatus('Job not found');
        }
      },
      (error) => {
        console.error('Error fetching job status:', error);
        setStatus('Error fetching job status');
      }
    );

    // Clean up subscription on unmount
    return () => unsubscribe();
  }, [jobId]);

  return (
    <div className="job-status">
      <h2>Job Status</h2>
      <p>{status}</p>
    </div>
  );
};

export default JobStatusComponent;

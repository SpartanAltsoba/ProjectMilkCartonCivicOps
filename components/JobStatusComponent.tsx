import React, { useEffect, useState } from 'react';
import { firestore } from '../lib/firebase'; // adjust this import if your Firestore export is named differently
import { doc, onSnapshot } from 'firebase/firestore';

interface JobStatusComponentProps {
  jobId: string;
}

const JobStatusComponent: React.FC<JobStatusComponentProps> = ({ jobId }) => {
  const [status, setStatus] = useState<string>('Loading...');

  useEffect(() => {
    if (!jobId) return;

    const jobDocRef = doc(firestore, 'jobs', jobId);
    const unsubscribe = onSnapshot(
      jobDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStatus(data?.status ?? 'Unknown');
        } else {
          setStatus('Job not found');
        }
      },
      (error) => {
        console.error('Error fetching job status:', error);
        setStatus('Error fetching job status');
      }
    );

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

// pages/case/[caseId].tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { JobStatusComponent } from '../../components/JobStatusComponent';
import { AgentOutputCardComponent } from '../../components/AgentOutputCardComponent';
import { initializeFirebase } from '../../lib/firebase';
import styles from '../../styles/Case.module.css';

interface CaseDetailsProps {
  caseId: string;
}

const CaseDetails: NextPage<CaseDetailsProps> = () => {
  const router = useRouter();
  const { caseId } = router.query as { caseId: string };

  const { user } = useAuth();
  const [caseData, setCaseData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const db = getFirestore(initializeFirebase());
    const caseDocRef = doc(db, 'cases', caseId);

    const unsubscribe = onSnapshot(caseDocRef, (doc) => {
      if (doc.exists()) {
        setCaseData(doc.data());
      } else {
        setError('Case not found');
      }
    }, (err) => {
      setError(`Error retrieving case: ${err.message}`);
    });

    return () => unsubscribe();
  }, [caseId, user, router]);

  if (error) {
    return (<div className={styles.error}>{error}</div>);
  }

  if (!caseData) {
    return (<div className={styles.loading}>Loading case details...</div>);
  }

  return (
    <div className={styles.caseDetails}>
      <h1>Case Details for {caseId}</h1>
      <JobStatusComponent jobId={caseId} status={caseData.status} />
      {caseData.agentOutputs && caseData.agentOutputs.map((output: any, index: number) => (
        <AgentOutputCardComponent key={index} agentData={output} />
      ))}
    </div>
  );
};

export default CaseDetails;

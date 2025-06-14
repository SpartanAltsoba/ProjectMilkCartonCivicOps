import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { useRouter } from 'next/router';
import JobStatusComponent from './JobStatusComponent';
import AgentOutputCardComponent from './AgentOutputCardComponent';
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
  const [query, setQuery] = useState<string>('');
  const [loadingAnalysis, setLoadingAnalysis] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const handleNewAnalysis = async () => {
    if (!user) {
      setError('You must be logged in to start a new analysis');
      return;
    }
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }
    setError(null);
    setLoadingAnalysis(true);
    setAnalysisResult(null);

    try {
      const token = await user.getIdToken();
      // Call local API route instead of Firebase Function
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Analysis failed');
        setLoadingAnalysis(false);
        return;
      }
      const data = await response.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      if (!data.result) {
        setError('No analysis results returned');
        return;
      }
      setAnalysisResult(data.result);
    } catch (err) {
      setError('Failed to perform analysis: ' + (err.message || 'Unknown error'));
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const transformAnalysisToAgentData = (analysis: any) => {
    if (!analysis) return null;
    
    // Extract findings from local data and GPT analysis
    const findings = [];
    
    // Add local data findings
    if (analysis.localData?.summary) {
      findings.push(`Local Data: ${analysis.localData.summary}`);
    }
    if (analysis.localData?.keywords?.length > 0) {
      findings.push(`Keywords found: ${analysis.localData.keywords.join(', ')}`);
    }
    
    // Add web data findings
    if (analysis.webData?.title) {
      findings.push(`Web source: ${analysis.webData.title}`);
    }
    
    // Add GPT analysis findings
    if (analysis.gptAnalysis?.entities?.length > 0) {
      findings.push(...analysis.gptAnalysis.entities);
    }
    
    // Generate recommendations based on findings
    const recommendations = [];
    if (analysis.localData?.keywords?.length > 0) {
      recommendations.push('Review local data matches for relevant case information');
    }
    if (analysis.webData) {
      recommendations.push('Cross-reference web findings with local database');
    }
    if (findings.length > 3) {
      recommendations.push('Consider escalating due to multiple findings');
    }
    
    // Determine risk level based on number of findings
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (findings.length > 5) {
      riskLevel = 'high';
    } else if (findings.length > 2) {
      riskLevel = 'medium';
    }
    
    return {
      title: 'Child Welfare OSINT Analysis',
      summary: analysis.gptAnalysis?.summary || `Analysis completed with ${findings.length} findings from local and web sources.`,
      findings: findings.length > 0 ? findings : ['No specific findings identified'],
      recommendations: recommendations.length > 0 ? recommendations : ['No specific recommendations at this time'],
      riskLevel,
    };
  };

  return (
    <div className={styles.dashboard}>
      <h1>Dashboard</h1>
      {error && <div className={styles.error}>{error}</div>}
      <input
        type="text"
        placeholder="Enter your query"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={styles.queryInput}
      />
      <button onClick={handleNewAnalysis} className={styles.newAnalysisButton} disabled={loadingAnalysis}>
        {loadingAnalysis ? 'Analyzing...' : 'Start New Analysis'}
      </button>
      {analysisResult && (
        <AgentOutputCardComponent agentData={transformAnalysisToAgentData(analysisResult)} />
      )}
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

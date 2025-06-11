import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import DashboardComponent from '../components/DashboardComponent';
import JobStatusComponent from '../components/JobStatusComponent';
import Head from 'next/head';

const Dashboard: NextPage = () => {
  const router = useRouter();
  const { user, loading, error } = useAuth();
  const { jobs, fetchJobs, jobsLoading, jobsError } = useFirestore();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      fetchJobs();
    }
  }, [user, loading, router, fetchJobs]);

  if (loading || jobsLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (error || jobsError) {
    return <div className="error">Error: {error?.message || jobsError?.message}</div>;
  }

  return (
    <>
      <Head>
        <title>Dashboard - Secure Modular Intelligence App</title>
        <meta name="description" content="Dashboard for managing jobs and viewing activity." />
      </Head>
      <div className="dashboard-container">
        <h1>Welcome to your Dashboard</h1>
        <DashboardComponent />
        {jobs?.map((job) => (
          <JobStatusComponent key={job.id} jobId={job.id} status={job.status} />
        ))}
      </div>
      <style jsx>{`
        .dashboard-container {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
        }
        .loading, .error {
          text-align: center;
          margin-top: 50px;
          font-size: 18px;
        }
      `}</style>
    </>
  );
};

export default Dashboard;

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import LogsDisplay from '../components/LogsDisplay';
import Footer from '../components/Footer';

const fetchLogs = async () => {
  const response = await fetch('/api/logs');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

const LogsPage: React.FC = () => {
  const [logsData, setLogsData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const getLogs = async () => {
      try {
        const data = await fetchLogs();
        setLogsData(data);
      } catch (err) {
        setError('Failed to load logs. Please try again later.');
        console.error('Error fetching logs:', err);
      } finally {
        setLoading(false);
      }
    };

    getLogs();
  }, []);

  return (
    <div>
      <Head>
        <title>Logs - Child Welfare OSINT Recon Agent</title>
        <meta
          name="description"
          content="Review recent error logs and application performance metrics."
        />
      </Head>

      <Header title="Logs" navigationLinks={[
        { name: 'Home', path: '/' }, 
        { name: 'Analysis', path: '/analysis' }
      ]} />

      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">Application Logs</h1>

        {loading ? (
          <p>Loading logs...</p>
        ) : error ? (
          <div className="text-red-500">
            <p>{error}</p>
          </div>
        ) : (logsData.length > 0 ? (
          <LogsDisplay logsData={logsData} />
        ) : (
          <p>No logs to display.</p>
        ))}
      </main>

      <Footer />
    </div>
  );
};

export default LogsPage;

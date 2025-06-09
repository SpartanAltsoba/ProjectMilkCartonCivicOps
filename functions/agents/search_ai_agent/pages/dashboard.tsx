import { GetServerSideProps } from 'next';
import { Session } from 'next-auth';
import { getSession } from 'next-auth/react';
import React, { useState } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import LocationInputForm from '../components/form/LocationInputForm';
import AnalysisSummary from '../components/display/AnalysisSummary';
import ResultsDisplay from '../components/display/ResultsDisplay';
import FOIARequestForm from '../components/form/FOIARequestForm';

interface DashboardProps {
  session: Session | null;
}

const Dashboard: React.FC<DashboardProps> = ({ session }) => {
  const [analysisSummary, setAnalysisSummary] = useState(null);
  const [results, setResults] = useState(null);

  const handleLocationSubmit = async (location: string) => {
    try {
      // Call an API route to trigger the analysis
      const response = await fetch('/api/data/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location }),
      });

      if (!response.ok) {
        throw new Error('Failed to start analysis.');
      }

      const data = await response.json();
      setAnalysisSummary(data.summary);
      setResults(data.results);
    } catch (error) {
      console.error('Error starting analysis:', error);
    }
  };

  const handleFOIASubmit = (foiaRequest: any) => {
    // TODO: Implement submission logic for FOIA requests
    console.log('FOIA request submitted:', foiaRequest);
  };

  return (
      <div className="min-h-screen flex flex-col">
        <Header title="Civic Trace Ops Dashboard" navigationLinks={['/', '/results', '/foia', '/about']} />
        <main className="container mx-auto flex-grow p-6">
          <LocationInputForm onSubmit={handleLocationSubmit} />
          {analysisSummary && <AnalysisSummary summary={analysisSummary} />}
          {results && <ResultsDisplay data={results} />}
          <FOIARequestForm onSubmit={handleFOIASubmit} />
        </main>
        <Footer contactInfo={{ email: 'contact@civictraceops.com' }} socialLinks={[]} />
      </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  // Redirect to login if not authenticated
  if (!session) {
    return {
      redirect: {
        destination: '/api/auth/signin',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
};

export default Dashboard;

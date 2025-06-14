import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Header from '../components/Header';
import QueryForm from '../components/QueryForm';
import ResultsDisplay from '../components/ResultsDisplay';
import Footer from '../components/Footer';

const Analysis: NextPage = () => {
  const [analysisData, setAnalysisData] = useState<Array<{
    id: string;
    title: string;
    summary: string;
    source: string;
    error?: string;
  }> | null>(null);

  const handleQuerySubmit = async (query: string) => {
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Transform the API response into the format expected by ResultsDisplay
      const results = [];
      
      if (data.localData) {
        results.push({
          id: 'local-data',
          title: 'Local Data Analysis',
          summary: data.localData.summary || 'No summary available',
          source: 'Local Database',
          error: data.localData.error
        });
      }

      if (data.webData) {
        results.push({
          id: 'web-data',
          title: 'Web Data Analysis',
          summary: data.webData.content || 'No content available',
          source: data.webData.title || 'Web Source',
          error: data.webData.error
        });
      }

      if (data.gptAnalysis) {
        results.push({
          id: 'gpt-analysis',
          title: 'GPT Analysis',
          summary: data.gptAnalysis.summary || 'No analysis available',
          source: 'GPT-4',
          error: data.gptAnalysis.error
        });
      }

      setAnalysisData(results);
    } catch (error) {
      setAnalysisData([{
        id: 'error',
        title: 'Error',
        summary: 'Failed to perform analysis',
        source: 'System',
        error: (error as Error).message
      }]);
    }
  };

  return (
    <div>
      <Head>
        <title>Analysis | Recon Agent for Child Welfare OSINT</title>
        <meta
          name="description"
          content="Start a new analysis query and view results derived from local files and web scraping."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header title="Analysis" navigationLinks={[
        { name: 'Home', path: '/' },
        { name: 'Logs', path: '/logs' }
      ]} />

      <main style={{ padding: '20px' }}>
        <h1>Start Your Analysis</h1>
        <QueryForm onSubmit={handleQuerySubmit} />
        {analysisData && <ResultsDisplay resultsData={analysisData} />}
      </main>

      <Footer />
    </div>
  );
};

export default Analysis;

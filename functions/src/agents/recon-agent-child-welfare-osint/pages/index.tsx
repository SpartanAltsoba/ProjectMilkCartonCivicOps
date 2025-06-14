import React from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import UsageInstructions from '../components/UsageInstructions';
import Footer from '../components/Footer';

const Home: React.FC = () => {
  // Example navigation links configuration for the Header component
  const navigationLinks = [
    { name: 'Home', path: '/' },
    { name: 'Analysis', path: '/analysis' },
    { name: 'Logs', path: '/logs' },
  ];

  return (
    <div>
      <Head>
        <title>Recon Agent for Child Welfare OSINT</title>
        <meta
          name="description"
          content="A modular, production-ready Recon Agent designed for OSINT intelligence gathering specifically in the domain of child welfare and foster care systems."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header title="Recon Agent for Child Welfare OSINT" navigationLinks={navigationLinks} />

      <main className="container mx-auto p-4">
        <h1 className="text-3xl font-bold">
          Welcome to the Recon Agent for Child Welfare OSINT
        </h1>
        <UsageInstructions />
      </main>

      <Footer />
    </div>
  );
};

export default Home;

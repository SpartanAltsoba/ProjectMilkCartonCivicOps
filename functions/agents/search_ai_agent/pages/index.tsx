import { NextPage } from 'next';
import Head from 'next/head';
import Header from '../components/layout/Header';
import OverviewSection from '../components/display/OverviewSection';
import Footer from '../components/layout/Footer';

const Home: NextPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Civic Trace Ops - Home</title>
        <meta
          name="description"
          content="Civic Trace Ops: A platform for autonomous forensic analysis of child welfare systems."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header
        title="Civic Trace Ops"
        navigationLinks={[{ name: 'Dashboard', href: '/dashboard' }, { name: 'FOIA Requests', href: '/foia' }, { name: 'About', href: '/about' }]}
      />

      <main className="flex-grow">
        <OverviewSection
          content="Welcome to Civic Trace Ops, a revolutionary platform providing autonomous, multi-stage forensic analysis of child welfare systems. Through location-aware analysis, our system investigates legal frameworks, agency performance metrics, and more to offer insightful visual and legal outputs."
        />
      </main>

      <Footer
        contactInfo="Contact us at contact@civictraceops.com"
        socialLinks={{
          twitter: 'https://twitter.com/civictraceops',
          facebook: 'https://facebook.com/civictraceops',
          linkedin: 'https://linkedin.com/company/civictraceops',
        }}
      />
    </div>
  );
};

export default Home;

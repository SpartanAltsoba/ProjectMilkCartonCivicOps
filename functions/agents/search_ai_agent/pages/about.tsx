import React from "react";
import Head from "next/head";
import Header from "../components/layout/Header";
import ContentSection from "../components/display/ContentSection";
import Footer from "../components/layout/Footer";

const About: React.FC = () => {
  return (
    <>
      <Head>
        <title>Civic Trace Ops - About</title>
        <meta
          name="description"
          content="Learn more about the Civic Trace Ops application purpose, usage, and disclaimers."
        />
      </Head>
      <div className="min-h-screen flex flex-col justify-between">
        <Header
          title="Civic Trace Ops"
          navigationLinks={[
            { href: "/", label: "Home" },
            { href: "/about", label: "About" },
            { href: "/dashboard", label: "Dashboard" },
            { href: "/foia", label: "FOIA Requests" },
          ]}
        />
        <main className="flex-grow">
          <ContentSection
            content={
              <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-3xl font-bold">About Civic Trace Ops</h1>
                <p className="mt-4">
                  Civic Trace Ops is a groundbreaking application designed to conduct multi-stage,
                  autonomous forensic analysis in child welfare systems. Our aim is to empower users
                  with insights-driven analytics by mapping legal frameworks, uncovering agency
                  hierarchies, and tracking performance and financial flows.
                </p>
                <h2 className="text-2xl font-semibold mt-6">Application Features</h2>
                <ul className="list-disc list-inside mt-2">
                  <li>Keyword generation for location-aware, context-sensitive searches</li>
                  <li>Detection of applicable legal frameworks for child welfare</li>
                  <li>Mapping of child protective services agency hierarchies</li>
                  <li>Collection of agency performance metrics</li>
                  <li>Tracing of financial flows and contractor involvement</li>
                  <li>Synthesis of decision chains using collected data</li>
                  <li>Automated generation of FOIA requests</li>
                  <li>Data provenance logging and auditing</li>
                </ul>
                <h2 className="text-2xl font-semibold mt-6">Disclaimer</h2>
                <p className="mt-2">
                  While we strive to provide accurate and up-to-date information, the analyses
                  conducted by Civic Trace Ops should not be considered legal advice. Users are
                  encouraged to consult professional legal or agency experts.
                </p>
              </div>
            }
          />
        </main>
        <Footer
          contactInfo="Contact us at info@civictraceops.org"
          socialLinks={[
            { href: "https://twitter.com/civictraceops", label: "Twitter" },
            { href: "https://facebook.com/civictraceops", label: "Facebook" },
          ]}
        />
      </div>
    </>
  );
};

export default About;

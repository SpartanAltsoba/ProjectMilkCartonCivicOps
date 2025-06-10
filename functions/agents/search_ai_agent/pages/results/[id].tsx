import { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import ResultsOverview from "../../components/display/ResultsOverview";
import LegalFrameworkDetails from "../../components/display/LegalFrameworkDetails";
import AgencyStructureDisplay from "../../components/display/AgencyStructureDisplay";
import PerformanceMetricsChart from "../../components/display/PerformanceMetricsChart";
import FundingTraceMap from "../../components/interactive/FundingTraceMap";
import DecisionChainDiagram from "../../components/display/DecisionChainDiagram";
import { fetchAnalysisDetails } from "../../lib/analysis";
import { ResultData } from "../../types";

interface ResultsPageProps {
  results: ResultData | null;
  error?: string;
}

const ResultsPage: NextPage<ResultsPageProps> = ({ results, error }) => {
  const router = useRouter();
  const { id } = router.query;

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!results) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Analysis Results - Civic Trace Ops</title>
        <meta name="description" content="Detailed view of the Civic Trace Ops analysis results." />
      </Head>
      <div className="flex flex-col min-h-screen">
        <Header title="Civic Trace Ops" navigationLinks={[]} />
        <main className="flex-grow m-4">
          <h1 className="text-3xl font-bold mb-4">Analysis Results for {id}</h1>
          <ResultsOverview data={results.overview} />
          <LegalFrameworkDetails frameworkData={results.legalFramework} />
          <AgencyStructureDisplay hierarchyData={results.agencyStructure} />
          <PerformanceMetricsChart metrics={results.performanceMetrics} />
          <FundingTraceMap traceData={results.fundingTrace} />
          <DecisionChainDiagram diagramData={results.decisionChains} />
        </main>
        <Footer contactInfo="Contact us at example@civictraceops.com" socialLinks={[]} />
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async context => {
  const { id } = context.params;

  try {
    const results = await fetchAnalysisDetails(id as string);

    return {
      props: {
        results,
      },
    };
  } catch (error) {
    console.error("Failed to fetch analysis details:", error);
    return {
      props: {
        results: null,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      },
    };
  }
};

export default ResultsPage;

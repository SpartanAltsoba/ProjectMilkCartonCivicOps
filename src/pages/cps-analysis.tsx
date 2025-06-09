// pages/cps-analysis.tsx

import React, { useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { FirebaseAdmin } from "../utils/FirebaseAdmin";
import { CPSData, City } from "../types";
import { ResearchMonster } from "../utils/ResearchMonster";

// Dynamic import for code splitting
const CPSAnalysisComponent = dynamic(() => import("../components/CPSAnalysisComponent"));

interface CPSAnalysisPageProps {
  initialData: CPSData;
  city: City;
}

const CPSAnalysisPage: React.FC<CPSAnalysisPageProps> = ({ initialData, city }) => {
  const [data, setData] = useState<CPSData>(initialData);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const newData = await ResearchMonster.scrapeData(city);
        setData(newData);
      } catch (err) {
        setError("Failed to fetch data. Please try again later.");
      }
    };

    fetchData();
  }, [city]);

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return <CPSAnalysisComponent data={data} />;
};

export const getServerSideProps: GetServerSideProps = async context => {
  const city = context.params?.city as City;
  const firebaseAdmin = new FirebaseAdmin();
  let initialData: CPSData;

  try {
    initialData = await firebaseAdmin.fetchCPSData(city);
  } catch (err) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      initialData,
      city,
    },
  };
};

export default CPSAnalysisPage;

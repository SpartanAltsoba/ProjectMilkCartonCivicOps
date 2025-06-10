import { GetServerSideProps, NextPage } from "next";
import { getSession } from "next-auth/react";
import Head from "next/head";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import FOIARequestList from "../components/display/FOIARequestList";
import FOIARequestDetails from "../components/display/FOIARequestDetails";
import { fetchFOIARequests } from "../lib/foia";
import { FOIARequest } from "../types";

interface FOIAProps {
  requests: FOIARequest[];
  error?: string;
}

const FOIA: NextPage<FOIAProps> = ({ requests, error }) => {
  return (
    <>
      <Head>
        <title>FOIA Requests - Civic Trace Ops</title>
        <meta name="description" content="Manage and review generated FOIA requests." />
      </Head>
      <Header
        title="Civic Trace Ops - FOIA Requests"
        navigationLinks={["/", "/dashboard", "/about"]}
      />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">FOIA Requests</h1>
        {error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FOIARequestList requests={requests} />
            {requests.length > 0 && <FOIARequestDetails requestDetails={requests[0]} />}
          </div>
        )}
      </main>
      <Footer
        contactInfo={{ email: "support@civictraceops.com", phone: "123-456-7890" }}
        socialLinks={["facebook", "twitter", "linkedin"]}
      />
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async context => {
  const session = await getSession(context);
  if (!session) {
    return {
      redirect: {
        destination: "/api/auth/signin",
        permanent: false,
      },
    };
  }

  try {
    const requests = await fetchFOIARequests();
    return {
      props: {
        requests,
      },
    };
  } catch (error) {
    console.error("Failed to fetch FOIA requests:", error);
    return {
      props: {
        requests: [],
        error: "Failed to load FOIA requests. Please try again later.",
      },
    };
  }
};

export default FOIA;

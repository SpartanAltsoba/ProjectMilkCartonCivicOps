import React from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import { useRouter } from 'next/router';
import { fetchFOIARequestDetails } from '../../lib/api';
import { FOIARequest } from '../../types';
import Loader from '../common/Loader';

interface FOIARequestDetailsProps {
  requestDetails: FOIARequest | null;
}

const FOIARequestDetails: React.FC<FOIARequestDetailsProps> = ({ requestDetails }) => {
  const router = useRouter();
  const { id } = router.query;

  if (router.isFallback) {
    return <Loader />;
  }

  if (!requestDetails) {
    return <p className="text-center text-red-600">Failed to load FOIA Request details.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">FOIA Request Details</h1>
      <div className="bg-white shadow rounded-md p-6 mb-4">
        <h2 className="text-xl font-medium">Request ID: {id}</h2>
        <p className="mt-2 text-gray-700">Status: {requestDetails.status}</p>
        <p className="mt-2 text-gray-700">Submitted On: {new Date(requestDetails.submissionDate).toLocaleDateString()}</p>
        <p className="mt-2 text-gray-700">Requester Information: {requestDetails.requesterName}</p>
        <div className="mt-4">
          <h3 className="text-lg font-medium">Request Details:</h3>
          <p className="mt-2">{requestDetails.details}</p>
        </div>
      </div>
    </div>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Fetch all request IDs for currently existing FOIA Requests as placeholders
  const paths = await fetchAllFOIARequestIds();

  return {
    paths,
    fallback: true, // Enable fallback for dynamic generation of pages
  };
};

export const getStaticProps: GetStaticProps = async (context) => {
  const { params } = context;
  const id = params?.id as string;

  try {
    const requestDetails = await fetchFOIARequestDetails(id);
    return {
      props: {
        requestDetails: requestDetails ?? null,
      },
      revalidate: 60, // Revalidate every 60 seconds
    };
  } catch (error) {
    console.error(`Failed to fetch FOIA Request ${id}:`, error);
    return {
      props: {
        requestDetails: null,
      },
    };
  }
};

async function fetchAllFOIARequestIds(): Promise<Array<{ params: { id: string } }>> {
  // Replace with actual API calls to fetch all FOIA request IDs
  try {
    const response = await fetch('/api/foia/requests'); // Example endpoint
    if (!response.ok) {
      throw new Error('Failed to fetch FOIA request IDs');
    }
    const data = await response.json();
    return data.requests.map((request: any) => ({ params: { id: request.id.toString() } }));
  } catch (error) {
    console.error('Error fetching FOIA request IDs:', error);
    return [];
  }
}

export default FOIARequestDetails;
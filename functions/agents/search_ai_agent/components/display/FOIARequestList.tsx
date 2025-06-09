import React from 'react';
import { FOIARequest } from '../../types'; // Assuming types are defined here
import useSWR from 'swr';
import axios from 'axios';
import Link from 'next/link';

// Fetcher function for SWR
const fetcher = (url: string) => axios.get(url).then(res => res.data);

interface FOIARequestListProps {
  requests?: FOIARequest[];
}

const FOIARequestList: React.FC<FOIARequestListProps> = ({ requests }) => {
  // Use SWR to fetch FOIA requests
  const { data, error } = useSWR<FOIARequest[]>('/api/data/foia', fetcher, {
    suspense: true,
  });

  if (error) return <div>Error loading requests.</div>;
  const foiaRequests = data || requests;

  if (!foiaRequests || foiaRequests.length === 0) {
    return <div className="text-gray-500">No FOIA requests found.</div>;
  }

  return (
    <div className="bg-white shadow-md rounded overflow-hidden">
      <h2 className="text-xl font-bold border-b p-4">FOIA Requests</h2>
      <ul className="divide-y divide-gray-200">
        {foiaRequests.map((request) => (
          <li key={request.id} className="p-4">
            <Link href={`/foia/${request.id}`}>
              <a className="text-indigo-600 hover:text-indigo-900">
                {request.subject} – {new Date(request.createdAt).toLocaleDateString()}
              </a>
            </Link>
            <div className="text-sm text-gray-500">{request.status}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FOIARequestList;

// This component can be enhanced with further error handling,
// loading states, and better styling as per application design requirements.
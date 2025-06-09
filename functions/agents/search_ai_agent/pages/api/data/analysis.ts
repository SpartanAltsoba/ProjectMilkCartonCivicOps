import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { startAnalysisJob, AnalysisParams, AnalysisResult } from '../../../lib/analysis';
import { logDataProvenance } from '../../../lib/db';

interface ErrorResponse {
  error: string;
}

/**
 * Handles the API request to start and manage analysis processes.
 *
 * @param req Next.js API request object
 * @param res Next.js API response object
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalysisResult | ErrorResponse>
) {
  // Check the request method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
  }

  try {
    // Verify user authentication
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized access. Please log in.' });
    }

    // Parse the request body
    const { location, keywords }: AnalysisParams = req.body;
    if (!location || !keywords) {
      return res.status(400).json({ error: 'Missing required fields: location and/or keywords.' });
    }

    // Log the request for data provenance
    await logDataProvenance({ userId: session.user.id, action: 'start_analysis', details: { location, keywords } });

    // Start the analysis job
    const analysisResult = await startAnalysisJob(location, keywords);

    // Return the analysis result
    return res.status(200).json(analysisResult);
  } catch (error) {
    console.error('Error in analysis API handler:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { analyzeLocalData } from '../utils/localDataAnalysis';
import { WebScraper } from '../utils/webScraping';
import analyzeContent from '../utils/gptContentAnalysis';

// Initialize Firebase Admin if not already initialized
import { initializeApp, getApps, cert } from 'firebase-admin/app';
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS || '{}')),
  });
}

interface AnalysisResult {
  localData: any;
  webData: any;
  gptAnalysis: any;
  errors?: string[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Get authorization token from header
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  try {
    // Verify Firebase auth token
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        error: 'Query parameter is required'
      });
    }

    // Create a new job document
    const db = getFirestore();
    const jobRef = await db.collection('jobs').add({
      userId,
      query,
      status: 'started',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Start analysis process
    try {
      // Update status to processing
      await jobRef.update({
        status: 'processing_local',
        updatedAt: new Date()
      });

      // Perform local data analysis
      const localData = await analyzeLocalData('api/data');
      
      await jobRef.update({
        status: 'processing_web',
        localData,
        updatedAt: new Date()
      });

      // Initialize and use web scraper
      const scraper = new WebScraper();
      await scraper.initialize();
      const webData = await scraper.scrape(query, async (page) => {
        return await page.evaluate(() => {
          return {
            title: document.title,
            content: document.body.innerText
          };
        });
      });
      await scraper.close();
      
      await jobRef.update({
        status: 'processing_gpt',
        webData,
        updatedAt: new Date()
      });

      // Perform content analysis using GPT-4
      const combinedContent = `
        Local Data: ${JSON.stringify(localData)}
        Web Data: ${JSON.stringify(webData)}
      `;
      const gptAnalysis = await analyzeContent(combinedContent);

      // Update job with final results
      await jobRef.update({
        status: 'completed',
        gptAnalysis,
        completedAt: new Date(),
        updatedAt: new Date()
      });

      return res.status(200).json({
        jobId: jobRef.id,
        status: 'completed',
        result: { localData, webData, gptAnalysis }
      });

    } catch (error) {
      // Update job with error status
      await jobRef.update({
        status: 'error',
        error: error.message,
        updatedAt: new Date()
      });

      throw error;
    }

  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({
      error: 'Analysis failed: ' + error.message
    });
  }
}

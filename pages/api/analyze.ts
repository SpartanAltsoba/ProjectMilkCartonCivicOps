import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { analyzeLocalData } from '../../functions/src/agents/recon-agent-child-welfare-osint/utils/localDataAnalysis';
import { WebScraper } from '../../functions/src/agents/recon-agent-child-welfare-osint/utils/webScraping';
import analyzeContent from '../../functions/src/agents/recon-agent-child-welfare-osint/utils/gptContentAnalysis';

// Initialize Firebase Admin if not already initialized
import { initializeApp, getApps, cert } from 'firebase-admin/app';

import { getApps, initializeApp, cert } from "firebase-admin/app";

export function initializeFirebaseAdmin() {
  if (!getApps().length) {
    try {
      const raw = process.env.FIREBASE_ADMIN_CREDENTIALS;

      if (!raw) {
        throw new Error("FIREBASE_ADMIN_CREDENTIALS is missing from .env");
      }

      const cleaned = raw.trim();

      if (!cleaned.startsWith("{") || !cleaned.endsWith("}")) {
        throw new Error("Invalid JSON structure in FIREBASE_ADMIN_CREDENTIALS");
      }

      const credentials = JSON.parse(cleaned);

      initializeApp({
        credential: cert(credentials)
      });

      console.log("[✅] Firebase admin initialized.");
    } catch (error) {
      console.error("[🔥] Firebase init failed:", error.message);
      throw error;
    }
  }
}

      
      // Validate required fields
      const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
      for (const field of requiredFields) {
        if (!credentialsObj[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      initializeApp({
        credential: cert(credentialsObj),
        databaseURL: `https://projectmilkcartoncivicops.firebaseio.com`
      });
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
      throw new Error('Firebase Admin initialization failed: ' + error.message);
    }
  }
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
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Initialize Firebase Admin
  try {
    initializeFirebaseAdmin();
  } catch (error) {
    return res.status(500).json({ error: error.message });
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
      const localData = await analyzeLocalData('../../functions/src/data');
      
      await jobRef.update({
        status: 'processing_web',
        localData,
        updatedAt: new Date()
      });

      // Convert query to search URLs for web scraping
      const searchUrls = [
        `https://www.google.com/search?q=${encodeURIComponent(query + ' child welfare')}`,
        `https://www.google.com/search?q=${encodeURIComponent(query + ' CPS investigation')}`
      ];

      const scraper = new WebScraper();
      await scraper.initialize();
      
      const webData = [];
      for (const url of searchUrls) {
        try {
          const result = await scraper.scrape(url, async (page) => {
            return await page.evaluate(() => {
              return {
                title: document.title,
                content: document.body.innerText.substring(0, 5000) // Limit content size
              };
            });
          });
          webData.push(result);
        } catch (error) {
          console.error(`Failed to scrape ${url}:`, error);
          // Continue with other URLs even if one fails
        }
      }
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

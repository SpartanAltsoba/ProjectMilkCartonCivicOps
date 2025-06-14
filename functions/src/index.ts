import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { analyzeLocalData } from "./agents/recon-agent-child-welfare-osint/utils/localDataAnalysis";
import { WebScraper } from "./agents/recon-agent-child-welfare-osint/utils/webScraping";
import analyzeContent from "./agents/recon-agent-child-welfare-osint/utils/gptContentAnalysis";

// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../secrets/.env') });

// Initialize Firebase Admin with service account
const serviceAccount = require("../secrets/serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
  });
}

export const analyze = onRequest(async (request, response) => {
  // Set CORS headers for all requests
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).send('Method Not Allowed');
    return;
  }

  try {
    // Verify Firebase auth token
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const { query } = request.body;
    if (!query) {
      throw new Error('Query parameter is required');
    }

    // Create a new job document
    const jobRef = await admin.firestore().collection('jobs').add({
      userId,
      query,
      status: 'started',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Start analysis process
    try {
      // Update status to processing
      await jobRef.update({
        status: 'processing_local',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Perform local data analysis
      const localData = await analyzeLocalData('src/data');
      
      await jobRef.update({
        status: 'processing_web',
        localData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      response.status(200).json({
        jobId: jobRef.id,
        status: 'completed',
        result: { localData, webData, gptAnalysis }
      });

    } catch (error) {
      // Update job with error status
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await jobRef.update({
        status: 'error',
        error: errorMessage,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      throw error;
    }

  } catch (error) {
    console.error('Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    response.status(500).json({
      error: 'Analysis failed: ' + errorMessage
    });
  }
});

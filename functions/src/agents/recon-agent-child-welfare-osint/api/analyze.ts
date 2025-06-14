import type { NextApiRequest, NextApiResponse } from 'next';
import { analyzeLocalData } from '../utils/localDataAnalysis';
import { WebScraper } from '../utils/webScraping';
import analyzeContent from '../utils/gptContentAnalysis';

interface AnalysisResult {
  localData: any;
  webData: any;
  gptAnalysis: any;
  errors?: string[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalysisResult>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const query = req.body.query;

  if (!query) {
    return res.status(400).json({
      localData: null,
      webData: null,
      gptAnalysis: null,
      errors: ['Query parameter is required'],
    });
  }

  let errors: string[] = [];

  try {
    // Perform local data analysis on the data directory
    const localData = await analyzeLocalData('../data');

    // Convert query to search URLs for web scraping (following ReconWorker data fetching strategy)
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
        // Continue with other URLs even if one fails (following ReconWorker retry logic)
      }
    }
    await scraper.close();

    // Perform content analysis using GPT-4
    const combinedContent = `
      Local Data: ${JSON.stringify(localData)}
      Web Data: ${JSON.stringify(webData)}
    `;
    const gptAnalysis = await analyzeContent(combinedContent);

    // Return the combined results
    return res.status(200).json({ localData, webData, gptAnalysis });
  } catch (error) {
    errors.push((error as Error).message);
    return res.status(500).json({
      localData: null,
      webData: null,
      gptAnalysis: null,
      errors
    });
  }
}

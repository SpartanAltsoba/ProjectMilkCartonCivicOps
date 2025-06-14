import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

interface AnalysisResult {
  summary: string;
  keywords: string[];
  errors: string[];
}

/**
 * Reads and analyzes local JSON data files for relevant information.
 * @param directoryPath - Path to the directory containing data files.
 * @returns A structured JSON object containing analysis result.
 */
async function analyzeLocalData(directoryPath: string): Promise<AnalysisResult> {
  const readdir = promisify(fs.readdir);
  const readFile = promisify(fs.readFile);

  const results: AnalysisResult = {
    summary: '',
    keywords: [],
    errors: [],
  };

  try {
    const files = await readdir(directoryPath);
    const jsonFiles = files.filter(file => path.extname(file) === '.json');

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(directoryPath, file);
        const fileContent = await readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);

        // Example analysis logic (to be expanded as needed)
        if (data.summary) {
          results.summary += `${data.summary} `;
        }
        if (data.keywords) {
          results.keywords.push(...data.keywords);
        }

      } catch (error) {
        const readError = error as Error;
        results.errors.push(`Failed to read or process file ${file}: ${readError.message}`);
      }
    }

    // Consider deduplication or further processing of keywords if needed
    results.keywords = Array.from(new Set(results.keywords));

  } catch (error) {
    const dirError = error as Error;
    results.errors.push(`Failed to read directory ${directoryPath}: ${dirError.message}`);
  }

  return results;
}

export { analyzeLocalData };
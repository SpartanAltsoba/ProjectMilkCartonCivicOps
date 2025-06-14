import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

interface AnalysisResult {
  summary: string;
  keywords: string[];
  errors: string[];
  dataStats: {
    totalRecords: number;
    fileTypes: string[];
    statesAnalyzed: string[];
    vendorContracts: number;
    decisionTools: number;
    caseManagementSystems: number;
  };
}

/**
 * Reads and analyzes local JSON data files for child welfare information.
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
    dataStats: {
      totalRecords: 0,
      fileTypes: [],
      statesAnalyzed: [],
      vendorContracts: 0,
      decisionTools: 0,
      caseManagementSystems: 0,
    },
  };

  try {
    const files = await readdir(directoryPath);
    const jsonFiles = files.filter(file => path.extname(file) === '.json');
    results.dataStats.fileTypes = jsonFiles;

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(directoryPath, file);
        const fileContent = await readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);

        // Analyze different types of data files
        if (file.includes('case_management_systems')) {
          results.dataStats.caseManagementSystems = Array.isArray(data) ? data.length : 0;
          results.dataStats.totalRecords += results.dataStats.caseManagementSystems;
          
          // Extract states and vendors
          if (Array.isArray(data)) {
            data.forEach((record: any) => {
              if (record.state) results.dataStats.statesAnalyzed.push(record.state);
              if (record.vendor) results.keywords.push(record.vendor);
              if (record.system_name) results.keywords.push(record.system_name);
            });
          }
        }
        
        if (file.includes('decision_tools')) {
          results.dataStats.decisionTools = Array.isArray(data) ? data.length : 0;
          results.dataStats.totalRecords += results.dataStats.decisionTools;
          
          // Extract tools and entities
          if (Array.isArray(data)) {
            data.forEach((record: any) => {
              if (record.State) results.dataStats.statesAnalyzed.push(record.State);
              if (record.Tools) results.keywords.push(...record.Tools);
              if (record.Entity) results.keywords.push(record.Entity);
            });
          }
        }
        
        if (file.includes('vendor_contracts')) {
          results.dataStats.vendorContracts = Array.isArray(data) ? data.length : 0;
          results.dataStats.totalRecords += results.dataStats.vendorContracts;
          
          // Extract contractors and functions
          if (Array.isArray(data)) {
            data.forEach((record: any) => {
              if (record.state_or_territory) results.dataStats.statesAnalyzed.push(record.state_or_territory);
              if (record.contractor && record.contractor !== 'Not specified') {
                results.keywords.push(record.contractor);
              }
              if (record.function) results.keywords.push(record.function);
            });
          }
        }

      } catch (error) {
        const readError = error as Error;
        results.errors.push(`Failed to read or process file ${file}: ${readError.message}`);
      }
    }

    // Deduplicate and clean up data
    results.keywords = Array.from(new Set(results.keywords.filter(k => k && k.trim())));
    results.dataStats.statesAnalyzed = Array.from(new Set(results.dataStats.statesAnalyzed.filter(s => s && s.trim())));

    // Generate summary
    results.summary = `Analyzed ${results.dataStats.totalRecords} records across ${jsonFiles.length} data files. ` +
      `Found ${results.dataStats.caseManagementSystems} case management systems, ` +
      `${results.dataStats.decisionTools} decision tools, and ` +
      `${results.dataStats.vendorContracts} vendor contracts covering ` +
      `${results.dataStats.statesAnalyzed.length} states/territories. ` +
      `Extracted ${results.keywords.length} unique keywords for analysis.`;

  } catch (error) {
    const dirError = error as Error;
    results.errors.push(`Failed to read directory ${directoryPath}: ${dirError.message}`);
  }

  return results;
}

export { analyzeLocalData };

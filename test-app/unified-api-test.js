"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAPITests = runAPITests;
exports.testAPI = testAPI;
const axios_1 = require("axios");
const url_1 = require("url");
const path_1 = require("path");
const dotenv_1 = require("dotenv");
// Load environment variables
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = (0, path_1.dirname)(__filename);
const rootDir = (0, path_1.join)(__dirname, "..");
dotenv_1.default.config({ path: (0, path_1.join)(rootDir, ".env") });
// Helper function to get environment variable
function getEnvVar(name) {
  return process.env[name];
}
async function testAPI(config) {
  const {
    name,
    endpoint,
    method = "GET",
    headers = {},
    params = {},
    data,
    validateResponse,
    debug = false,
  } = config;
  try {
    console.log(`Testing ${name}...`);
    const requestConfig = {
      method,
      url: endpoint,
      headers,
      params,
      data,
      timeout: 10000,
    };
    if (debug) {
      console.log("\nRequest Configuration:", JSON.stringify(requestConfig, null, 2));
    }
    const startTime = Date.now();
    const response = await (0, axios_1.default)(requestConfig);
    const endTime = Date.now();
    const result = {
      success: true,
      name,
      result: response.data,
    };
    if (debug) {
      result.debugInfo = {
        requestConfig,
        responseStatus: response.status,
        responseHeaders: response.headers,
        responseTime: `${endTime - startTime}ms`,
        responseSize: JSON.stringify(response.data).length,
      };
    }
    if (validateResponse && !validateResponse(response.data)) {
      throw new Error("Response validation failed");
    }
    console.log(`✅ ${name} - SUCCESS`);
    return result;
  } catch (error) {
    console.error(`❌ ${name} - FAILED:`, error instanceof Error ? error.message : error);
    const result = {
      success: false,
      name,
      error: error instanceof Error ? error.message : error,
    };
    if (debug && axios_1.default.isAxiosError(error)) {
      result.debugInfo = {
        requestConfig: error.config,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
        responseHeaders: error.response?.headers,
      };
    }
    return result;
  }
}
async function runAPITests(debug = false) {
  console.log("Starting API Tests...\n");
  const results = [];
  // Test Court Listener API
  results.push(
    await testAPI({
      name: "Court Listener API",
      endpoint: "https://www.courtlistener.com/api/rest/v3/search/",
      headers: {
        Authorization: `Token ${getEnvVar("COURTLISTENER_TOKEN")}`,
        "Content-Type": "application/json",
      },
      params: {
        q: 'court_location:California AND nature_of_suit:"Child Welfare"',
        order_by: "-date_filed",
        type: "o",
      },
      validateResponse: data => {
        return data && typeof data === "object" && "results" in data;
      },
      debug,
    })
  );
  // Test Data.gov API
  results.push(
    await testAPI({
      name: "Data.gov API",
      endpoint: "https://catalog.data.gov/api/3/action/package_search",
      params: {
        q: "child welfare California",
        rows: 5,
      },
      validateResponse: data => {
        return data && data.success === true && Array.isArray(data.result?.results);
      },
      debug,
    })
  );
  // Test Google Search API
  results.push(
    await testAPI({
      name: "Google Search API",
      endpoint: "https://www.googleapis.com/customsearch/v1",
      params: {
        key: getEnvVar("GOOGLE_SEARCH_API_KEY"),
        cx: getEnvVar("GOOGLE_CSE_ID"),
        q: "test query",
      },
      validateResponse: data => {
        return data && typeof data === "object" && "items" in data;
      },
      debug,
    })
  );
  // Test FEC API
  results.push(
    await testAPI({
      name: "FEC API",
      endpoint: "https://api.open.fec.gov/v1/candidates",
      params: {
        api_key: getEnvVar("FEC_API_KEY"),
        per_page: 1,
      },
      validateResponse: data => {
        return data && typeof data === "object" && "results" in data;
      },
      debug,
    })
  );
  // Test EDGAR API
  results.push(
    await testAPI({
      name: "EDGAR API",
      endpoint: "https://data.sec.gov/api/xbrl/companyfacts/CIK0000789019.json",
      headers: {
        "User-Agent": "CivicTraceOps/1.0",
      },
      validateResponse: data => {
        return data && typeof data === "object" && "facts" in data;
      },
      debug,
    })
  );
  // Test OpenAI API
  results.push(
    await testAPI({
      name: "OpenAI API",
      endpoint: "https://api.openai.com/v1/chat/completions",
      method: "POST",
      headers: {
        Authorization: `Bearer ${getEnvVar("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      data: {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5,
      },
      validateResponse: data => {
        return data && Array.isArray(data.choices) && data.choices.length > 0;
      },
      debug,
    })
  );
  // Test Google Civic API
  results.push(
    await testAPI({
      name: "Google Civic API",
      endpoint: "https://www.googleapis.com/civicinfo/v2/representatives",
      params: {
        key: getEnvVar("GOOGLE_CIVIC_API_KEY"),
        address: "94043",
      },
      validateResponse: data => {
        return data && typeof data === "object" && "officials" in data;
      },
      debug,
    })
  );
  // Print Summary
  console.log("\nTest Summary:");
  console.log("=============");
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`Total Tests: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  if (failed > 0) {
    console.log("\nFailed Tests:");
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`\n${r.name}:`);
        console.log("Error:", r.error);
        if (r.debugInfo) {
          console.log("Debug Info:", JSON.stringify(r.debugInfo, null, 2));
        }
      });
  }
  if (debug) {
    console.log("\nDetailed Results:");
    console.log("================");
    results.forEach(r => {
      console.log(`\n${r.name}:`);
      console.log(JSON.stringify(r.debugInfo || r.result || r.error, null, 2));
    });
  }
  return {
    totalTests: results.length,
    successful,
    failed,
    results,
  };
}
// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const debug = process.argv.includes("--debug");
  runAPITests(debug).catch(console.error);
}

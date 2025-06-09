"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTestSuite = runTestSuite;
const e2e_integration_test_js_1 = require("./e2e-integration-test.js");
const unified_api_test_js_1 = require("./unified-api-test.js");
async function runTestSuite(options = {}) {
  const { apiOnly = false, uiOnly = false, debug = false, verbose = false } = options;
  console.log("🧪 CIVIC TRACE OPS - Test Runner");
  console.log("================================\n");
  if (verbose) {
    console.log("Test Options:");
    console.log(`- API Only: ${apiOnly}`);
    console.log(`- UI Only: ${uiOnly}`);
    console.log(`- Debug Mode: ${debug}`);
    console.log(`- Verbose: ${verbose}\n`);
  }
  try {
    if (apiOnly) {
      console.log("Running API tests only...\n");
      const results = await (0, unified_api_test_js_1.runAPITests)(debug);
      return results;
    } else if (uiOnly) {
      console.log("Running UI tests only...\n");
      const { runUITests } = await Promise.resolve().then(() =>
        require("./e2e-integration-test.js")
      );
      const results = await runUITests();
      return results;
    } else {
      console.log("Running full E2E integration test suite...\n");
      const results = await (0, e2e_integration_test_js_1.runE2EIntegrationTests)();
      return results;
    }
  } catch (error) {
    console.error("❌ Test execution failed:", error);
    throw error;
  }
}
// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    apiOnly: args.includes("--api-only"),
    uiOnly: args.includes("--ui-only"),
    debug: args.includes("--debug"),
    verbose: args.includes("--verbose") || args.includes("-v"),
  };
}
// Show help
function showHelp() {
  console.log(`
CIVIC TRACE OPS Test Runner

Usage: node test-runner.js [options]

Options:
  --api-only    Run only API tests
  --ui-only     Run only UI/integration tests
  --debug       Enable debug mode with detailed output
  --verbose, -v Enable verbose logging
  --help, -h    Show this help message

Examples:
  node test-runner.js                    # Run all tests
  node test-runner.js --api-only         # Run only API tests
  node test-runner.js --ui-only --debug  # Run UI tests with debug info
  node test-runner.js --verbose          # Run all tests with verbose output
`);
}
// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }
  const options = parseArgs();
  runTestSuite(options)
    .then(results => {
      if ("totalFailed" in results && results.totalFailed > 0) {
        process.exit(1);
      } else if ("failed" in results && results.failed > 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    })
    .catch(error => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

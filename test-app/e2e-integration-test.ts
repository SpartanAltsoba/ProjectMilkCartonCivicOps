import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { runAPITests } from "./unified-api-test.js";

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

interface TestSuite {
  name: string;
  totalTests: number;
  successful: number;
  failed: number;
  results: any[];
}

interface UITestResult {
  success: boolean;
  name: string;
  error?: string;
  details?: any;
}

// Mock Firebase configuration test
async function testFirebaseConfig(): Promise<UITestResult> {
  try {
    const firebaseConfigPath = join(rootDir, "firebase.json");
    const firebaseConfig = JSON.parse(await fs.readFile(firebaseConfigPath, "utf-8"));

    const requiredFields = ["hosting", "firestore", "functions"];
    const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing Firebase configuration fields: ${missingFields.join(", ")}`);
    }

    return {
      success: true,
      name: "Firebase Configuration",
      details: {
        hosting: firebaseConfig.hosting,
        firestore: firebaseConfig.firestore,
        functions: firebaseConfig.functions,
      },
    };
  } catch (error) {
    return {
      success: false,
      name: "Firebase Configuration",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Test Next.js configuration
async function testNextConfig(): Promise<UITestResult> {
  try {
    const nextConfigPath = join(rootDir, "next.config.js");
    await fs.access(nextConfigPath);

    // Basic validation that the file exists and is readable
    const configContent = await fs.readFile(nextConfigPath, "utf-8");

    if (!configContent.includes("nextConfig")) {
      throw new Error("Invalid Next.js configuration format");
    }

    return {
      success: true,
      name: "Next.js Configuration",
      details: {
        configExists: true,
        hasValidFormat: true,
      },
    };
  } catch (error) {
    return {
      success: false,
      name: "Next.js Configuration",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Test package.json dependencies
async function testDependencies(): Promise<UITestResult> {
  try {
    const packageJsonPath = join(rootDir, "package.json");
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));

    const criticalDependencies = ["react", "next", "firebase", "axios", "@prisma/client"];

    const missingDeps = criticalDependencies.filter(
      dep => !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    );

    if (missingDeps.length > 0) {
      throw new Error(`Missing critical dependencies: ${missingDeps.join(", ")}`);
    }

    return {
      success: true,
      name: "Package Dependencies",
      details: {
        totalDependencies: Object.keys(packageJson.dependencies || {}).length,
        totalDevDependencies: Object.keys(packageJson.devDependencies || {}).length,
        criticalDependencies: criticalDependencies.filter(
          dep => packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]
        ),
      },
    };
  } catch (error) {
    return {
      success: false,
      name: "Package Dependencies",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Test component files existence
async function testComponentFiles(): Promise<UITestResult> {
  try {
    const componentsDir = join(rootDir, "components");
    const componentFiles = await fs.readdir(componentsDir);

    const criticalComponents = [
      "Navbar.tsx",
      "Footer.tsx",
      "RiskScoreDashboard.tsx",
      "SearchBar.tsx",
      "SearchResults.tsx",
      "LoadingSpinner.tsx",
    ];

    const missingComponents = criticalComponents.filter(comp => !componentFiles.includes(comp));

    if (missingComponents.length > 0) {
      throw new Error(`Missing critical components: ${missingComponents.join(", ")}`);
    }

    return {
      success: true,
      name: "Component Files",
      details: {
        totalComponents: componentFiles.length,
        criticalComponents: criticalComponents.filter(comp => componentFiles.includes(comp)),
        allComponents: componentFiles,
      },
    };
  } catch (error) {
    return {
      success: false,
      name: "Component Files",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Test page files existence
async function testPageFiles(): Promise<UITestResult> {
  try {
    const pagesDir = join(rootDir, "pages");
    const pageFiles = await fs.readdir(pagesDir);

    const criticalPages = ["index.tsx", "dashboard.tsx", "search.tsx", "_app.tsx"];

    const missingPages = criticalPages.filter(page => !pageFiles.includes(page));

    if (missingPages.length > 0) {
      throw new Error(`Missing critical pages: ${missingPages.join(", ")}`);
    }

    return {
      success: true,
      name: "Page Files",
      details: {
        totalPages: pageFiles.length,
        criticalPages: criticalPages.filter(page => pageFiles.includes(page)),
        allPages: pageFiles,
      },
    };
  } catch (error) {
    return {
      success: false,
      name: "Page Files",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Test database schema
async function testDatabaseSchema(): Promise<UITestResult> {
  try {
    const schemaPath = join(rootDir, "prisma", "schema.prisma");
    const schemaContent = await fs.readFile(schemaPath, "utf-8");

    const requiredModels = [
      "model ScoringDimension",
      "model ScoringCriteria",
      "model ScoringSnapshot",
    ];

    const missingModels = requiredModels.filter(model => !schemaContent.includes(model));

    if (missingModels.length > 0) {
      throw new Error(`Missing database models: ${missingModels.join(", ")}`);
    }

    return {
      success: true,
      name: "Database Schema",
      details: {
        schemaExists: true,
        hasRequiredModels: true,
        requiredModels: requiredModels.filter(model => schemaContent.includes(model)),
      },
    };
  } catch (error) {
    return {
      success: false,
      name: "Database Schema",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function runUITests(): Promise<TestSuite> {
  console.log("🖥️  Running UI and Integration Tests...\n");

  const tests = [
    testFirebaseConfig,
    testNextConfig,
    testDependencies,
    testComponentFiles,
    testPageFiles,
    testDatabaseSchema,
  ];

  const results: UITestResult[] = [];

  for (const test of tests) {
    const result = await test();
    results.push(result);

    if (result.success) {
      console.log(`✅ ${result.name} - PASSED`);
    } else {
      console.log(`❌ ${result.name} - FAILED: ${result.error}`);
    }
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return {
    name: "UI and Integration Tests",
    totalTests: results.length,
    successful,
    failed,
    results,
  };
}

async function runE2EIntegrationTests() {
  console.log("🚀 Starting E2E Integration Test Suite for CIVIC TRACE OPS\n");
  console.log("=".repeat(60));

  const suites: TestSuite[] = [];

  try {
    // Run API Tests
    console.log("\n📡 Running API Tests...");
    const apiResults = await runAPITests();
    suites.push({
      name: "API Tests",
      ...apiResults,
    });

    // Run UI and Integration Tests
    console.log("\n🖥️  Running UI and Integration Tests...");
    const uiResults = await runUITests();
    suites.push(uiResults);
  } catch (error) {
    console.error("❌ Test suite execution failed:", error);
    process.exit(1);
  }

  // Final summary
  const totalTests = suites.reduce((sum, suite) => sum + suite.totalTests, 0);
  const totalSuccessful = suites.reduce((sum, suite) => sum + suite.successful, 0);
  const totalFailed = suites.reduce((sum, suite) => sum + suite.failed, 0);

  console.log("\n" + "=".repeat(60));
  console.log("🏁 E2E INTEGRATION TEST RESULTS");
  console.log("=".repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Successful: ${totalSuccessful}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Success Rate: ${((totalSuccessful / totalTests) * 100).toFixed(2)}%`);

  // Print suite breakdown
  console.log("\nSuite Breakdown:");
  suites.forEach(suite => {
    console.log(`- ${suite.name}: ${suite.successful}/${suite.totalTests} passed`);
  });

  if (totalFailed === 0) {
    console.log("\n🎉 ALL TESTS PASSED! Your application is ready for Firebase deployment.");
  } else {
    console.log("\n⚠️  Some tests failed. Please review and fix issues before deployment.");

    // Show failed tests
    console.log("\nFailed Tests:");
    suites.forEach(suite => {
      const failedTests = suite.results.filter((r: any) => !r.success);
      if (failedTests.length > 0) {
        console.log(`\n${suite.name}:`);
        failedTests.forEach((test: any) => {
          console.log(`  - ${test.name}: ${test.error || "Unknown error"}`);
        });
      }
    });
  }

  console.log("=".repeat(60));

  return {
    totalTests,
    totalSuccessful,
    totalFailed,
    suites,
  };
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runE2EIntegrationTests()
    .then(results => {
      process.exit(results.totalFailed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { runE2EIntegrationTests, runUITests };

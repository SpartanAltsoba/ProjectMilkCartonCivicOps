# CIVIC TRACE OPS - Comprehensive Test Report

Generated: 2025-06-04T18:40:35.990Z

## Summary

- **Total Test Suites**: 2
- **Total Tests**: 13
- **Successful**: 6
- **Failed**: 7
- **Success Rate**: 46.15%

## Test Suites

### API Tests

- Tests: 7
- Successful: 5
- Failed: 2
- Success Rate: 71.43%

#### Failed Tests:

- **Court Listener API**: Request failed with status code 400
- **Google Civic API**: Request failed with status code 404

### UI and Firebase Tests

- Tests: 6
- Successful: 1
- Failed: 5
- Success Rate: 16.67%

#### Failed Tests:

- **API Health Check**: API server is not running. Start the development server with npm run dev
- **Auth Endpoints**: Auth endpoint not properly configured
- **FOIA Form Fields API**: API server is not running
- **Risk Scores API**: API server is not running
- **Next.js Build**: Build failed: Command failed: cd .. && npm run build
  ⚠ Invalid next.config.js options detected:
  ⚠ Unrecognized key(s) in object: 'optimizeFonts' at "experimental"
  ⚠ Unrecognized key(s) in object: 'swcMinify'
  ⚠ See more info here: https://nextjs.org/docs/messages/invalid-next-config
  ⚠ Specified "rewrites" will not automatically work with "output: export". See more info here: https://nextjs.org/docs/messages/export-no-custom-routes
  ⚠ Specified "headers" will not automatically work with "output: export". See more info here: https://nextjs.org/docs/messages/export-no-custom-routes
  ⚠ Specified "rewrites" will not automatically work with "output: export". See more info here: https://nextjs.org/docs/messages/export-no-custom-routes
  ⚠ Specified "headers" will not automatically work with "output: export". See more info here: https://nextjs.org/docs/messages/export-no-custom-routes
  ⨯ ESLint: Failed to load plugin '@typescript-eslint' declared in '.eslintrc.js': Cannot find module '@typescript-eslint/eslint-plugin' Require stack: - /home/andrew-fayal/civic-trace-ops/**placeholder**.js Referenced from: /home/andrew-fayal/civic-trace-ops/.eslintrc.js
  Failed to compile.

./lib/api.ts:2:15
Type error: Module '"@prisma/client"' has no exported member 'RiskScore'.

[0m [90m 1 |[39m [36mimport[39m { prisma } [36mfrom[39m [32m'./prisma'[39m[33m;[39m[0m
[0m[31m[1m>[22m[39m[90m 2 |[39m [36mimport[39m type { [33mRiskScore[39m[33m,[39m [33mRegion[39m } [36mfrom[39m [32m'@prisma/client'[39m[33m;[39m[0m
[0m [90m |[39m [31m[1m^[22m[39m[0m
[0m [90m 3 |[39m[0m
[0m [90m 4 |[39m [90m// SWR fetcher function[39m[0m
[0m [90m 5 |[39m [36mexport[39m [36mconst[39m fetcher [33m=[39m (url[33m:[39m string) [33m=>[39m fetch(url)[33m.[39mthen((res) [33m=>[39m res[33m.[39mjson())[33m;[39m[0m
Next.js build worker exited with code: 1 and signal: null

## Recommendations

### Issues Found:

- **Court Listener API**: Request failed with status code 400
- **Google Civic API**: Request failed with status code 404
- **API Health Check**: API server is not running. Start the development server with npm run dev
- **Auth Endpoints**: Auth endpoint not properly configured
- **FOIA Form Fields API**: API server is not running
- **Risk Scores API**: API server is not running
- **Next.js Build**: Build failed: Command failed: cd .. && npm run build
  ⚠ Invalid next.config.js options detected:
  ⚠ Unrecognized key(s) in object: 'optimizeFonts' at "experimental"
  ⚠ Unrecognized key(s) in object: 'swcMinify'
  ⚠ See more info here: https://nextjs.org/docs/messages/invalid-next-config
  ⚠ Specified "rewrites" will not automatically work with "output: export". See more info here: https://nextjs.org/docs/messages/export-no-custom-routes
  ⚠ Specified "headers" will not automatically work with "output: export". See more info here: https://nextjs.org/docs/messages/export-no-custom-routes
  ⚠ Specified "rewrites" will not automatically work with "output: export". See more info here: https://nextjs.org/docs/messages/export-no-custom-routes
  ⚠ Specified "headers" will not automatically work with "output: export". See more info here: https://nextjs.org/docs/messages/export-no-custom-routes
  ⨯ ESLint: Failed to load plugin '@typescript-eslint' declared in '.eslintrc.js': Cannot find module '@typescript-eslint/eslint-plugin' Require stack: - /home/andrew-fayal/civic-trace-ops/**placeholder**.js Referenced from: /home/andrew-fayal/civic-trace-ops/.eslintrc.js
  Failed to compile.

./lib/api.ts:2:15
Type error: Module '"@prisma/client"' has no exported member 'RiskScore'.

[0m [90m 1 |[39m [36mimport[39m { prisma } [36mfrom[39m [32m'./prisma'[39m[33m;[39m[0m
[0m[31m[1m>[22m[39m[90m 2 |[39m [36mimport[39m type { [33mRiskScore[39m[33m,[39m [33mRegion[39m } [36mfrom[39m [32m'@prisma/client'[39m[33m;[39m[0m
[0m [90m |[39m [31m[1m^[22m[39m[0m
[0m [90m 3 |[39m[0m
[0m [90m 4 |[39m [90m// SWR fetcher function[39m[0m
[0m [90m 5 |[39m [36mexport[39m [36mconst[39m fetcher [33m=[39m (url[33m:[39m string) [33m=>[39m fetch(url)[33m.[39mthen((res) [33m=>[39m res[33m.[39mjson())[33m;[39m[0m
Next.js build worker exited with code: 1 and signal: null

### Next Steps:

1. Review failed API keys and update environment variables
2. Check Firebase configuration files
3. Verify all external service endpoints
4. Test authentication flows
5. Validate deployment configuration

## Firebase Deployment Readiness

❌ **NOT READY FOR DEPLOYMENT**

Please fix the failed tests before deploying to Firebase.

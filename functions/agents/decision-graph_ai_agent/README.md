# Decision Graph AI Agent

This AI agent generates comprehensive decision chain diagrams for child welfare scenarios by analyzing legal frameworks, identifying stakeholders, and visualizing the relationships between different entities involved in the process.

## Features

- Location normalization and validation
- Legal framework analysis using multiple authoritative sources
- Stakeholder identification across agencies, contractors, and representatives
- PlantUML diagram generation with customizable themes
- Source tracking and citation management
- Comprehensive error handling and validation

## Usage

```typescript
import { runDecisionGraphAgent, DecisionGraphInput } from './runDecisionGraphAgent';

const input: DecisionGraphInput = {
  location: "King County, WA",
  scenario: "Child Protective Services Investigation",
  diagramConfig: {
    theme: "sketchy",
    direction: "top to bottom",
    showSources: true
  }
};

try {
  const result = await runDecisionGraphAgent(input);
  console.log(result);
} catch (error) {
  console.error('Failed to generate decision graph:', error);
}
```

## Input Parameters

### DecisionGraphInput

- `location` (required): String in the format "County, State" (e.g., "King County, WA")
- `scenario` (required): Description of the child welfare scenario
- `diagramConfig` (optional): Configuration options for the generated diagram

### DiagramConfig

- `title`: Custom title for the diagram
- `theme`: Visual theme ("default" | "sketchy" | "monochrome")
- `direction`: Layout direction ("top to bottom" | "left to right")
- `showSources`: Whether to include source citations in the diagram

## Output

### DecisionGraphOutput

- `location`: Normalized location information
  - `state`: Two-letter state code
  - `county`: Normalized county name
  - `full`: Full formatted location string
- `legalFramework`: Analysis of applicable legal framework
  - `type`: Framework type (CHINS | CINA | FINS | State-specific | Unknown)
  - `sources`: Array of source URLs
  - `explanation`: Description of the framework
- `stakeholders`: Identified stakeholders
  - `agencies`: Array of government agencies
  - `contractors`: Array of service contractors
  - `representatives`: Array of relevant representatives
  - `sources`: Array of source URLs
- `diagram`: Generated PlantUML diagram string
- `sources`: Source citation metadata
  - `total`: Total number of sources
  - `byType`: Breakdown of sources by type
  - `averageRelevance`: Average source relevance score
  - `lastUpdated`: Timestamp of last update

## Data Sources

The agent uses the following authoritative sources:

- childwelfare.gov - Legal frameworks and policies
- law.cornell.edu - Legal definitions and statutes
- usaspending.gov - Contractor information
- guidestar.org - Non-profit organization data
- opensecrets.org - Representative information

## Error Handling

The agent implements comprehensive error handling for:

- Input validation errors
- Location parsing errors
- API request failures
- External service errors
- Processing errors

All errors include detailed messages and appropriate HTTP status codes.

## Environment Variables

Required environment variables:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/civic_trace_ops
OPENAI_API_KEY=MY_API_KEY
GOOGLE_SEARCH_API_KEY=MY_API_KEY 
GOOGLE_CSE_ID=MY_API_KEY
FEC_API_KEY=MY_API_KEY
EDGAR_API_KEY=MY_API_KEY
COURTLISTENER_TOKEN=MY_API_KEY
GOOGLE_CIVIC_API_KEY=MY_API_KEY
LOBBY_VIEW_API_KEY=MY_API_KEY
DATA_GOV_API_KEY=MY_API_KEY
JWT_SECRET=MY_API_KEY
```

## Development

### Project Structure

```
decision-graph_ai_agent/
[       4096]  .
├── [        180]  babel.config.js
├── [       3517]  civic_trace_data_model.json
├── [       4096]  docs
│   ├── [       4096]  api
│   │   ├── [       5687]  aesthetic_review.md
│   │   ├── [       1874]  create-agent-structure.sh
│   │   ├── [       2358]  deploy.sh
│   │   ├── [       4096]  development
│   │   │   ├── [      13249]  annotations.xml
│   │   │   ├── [       5096]  BREAKTHROUGH_ANALYSIS.md
│   │   │   ├── [       1352]  context.xml
│   │   │   ├── [       4791]  foia_templates.md
│   │   │   ├── [       1012]  REAL_API_STATUS.md
│   │   │   └── [       1695]  REAL_DATA_FINDINGS.md
│   │   ├── [       1364]  move-agent-scripts.sh
│   │   ├── [      15251]  project-tree.txt
│   │   └── [       2750]  system_architecture.md
│   └── [       4096]  deployment
│       ├── [       4895]  cost-optimization.md
│       ├── [       2920]  deployment-checklist.md
│       ├── [       6263]  deployment-readiness-report.md
│       ├── [       2000]  optimization-plan.md
│       └── [       4543]  optimization-summary.md
├── [        702]  firebase.json
├── [       1359]  firestore.indexes.json
├── [       1332]  firestore.rules
├── [       4096]  functions
│   ├── [       4096]  agents
│   │   ├── [       4096]  decision-graph_ai_agent
│   │   │   ├── [       4096]  api
│   │   │   │   └── [       5939]  synthesize.ts
│   │   │   ├── [       4096]  decisionTemplates
│   │   │   │   └── [       4096]  decision_chain_examples
│   │   │   │       ├── [       4096]  cps_decision_chains
│   │   │   │       │   ├── [       1696]  chain_1_mandated_reports.puml
│   │   │   │       │   ├── [       1451]  chain_2_fostercare.puml
│   │   │   │       │   ├── [       1444]  chain_3_runaways.puml
│   │   │   │       │   ├── [       1460]  chain_4_parent_lack_of_rights.puml
│   │   │   │       │   ├── [       1448]  chain_5_ngo_contracts.puml
│   │   │   │       │   ├── [       1396]  chain_6_mental_health.puml
│   │   │   │       │   ├── [       1441]  chain_7_federal_audits.puml
│   │   │   │       │   ├── [       1467]  chain_8_state_policy.puml
│   │   │   │       │   ├── [       1693]  chain_9_statutes_petitions.puml
│   │   │   │       │   ├── [       1218]  cps_investigation.puml
│   │   │   │       │   ├── [       1783]  ngo_roles.txt
│   │   │   │       │   └── [       2500]  the_cps_system.puml
│   │   │   │       ├── [       3647]  cps_system.md
│   │   │   │       └── [       4096]  decision_chain_images
│   │   │   ├── [       8296]  graphBuilder.ts
│   │   │   ├── [       4096]  lib
│   │   │   │   ├── [       4457]  apiClient.ts
│   │   │   │   └── [       1316]  logger.ts
│   │   │   ├── [       1526]  package.json
│   │   │   ├── [       4603]  README.md
│   │   │   ├── [       4151]  runDecisionGraphAgent.ts
│   │   │   ├── [       1025]  tsconfig.json
│   │   │   └── [       4096]  utils
│   │   │       ├── [       5589]  apiUtils.ts
│   │   │       ├── [       6203]  dataNormalization.ts
│   │   │       ├── [       5243]  errorHandling.ts
│   │   │       ├── [       4170]  legalFramework.ts
│   │   │       ├── [       1676]  logger.ts
│   │   │       ├── [       5510]  pumlGenerator.ts
│   │   │       ├── [       4666]  sourceCitations.ts
│   │   │       └── [       7845]  stakeholderIdentification.ts
│   │   ├── [       4096]  foia
│   │   │   ├── [       4096]  foiaTemplates
│   │   │   │   ├── [          0]  template_CA.txt
│   │   │   │   └── [          0]  template_TX.txt
│   │   │   ├── [          0]  foiaUtils.ts
│   │   │   └── [          0]  runFoiaAgent.ts
│   │   ├── [          0]  index.ts
│   │   ├── [       4096]  ngo-mapping
│   │   │   ├── [          0]  contractorDB.ts
│   │   │   ├── [          0]  grantPatterns.ts
│   │   │   └── [          0]  runNgoMappingAgent.ts
│   │   ├── [       8461]  README.md
│   │   ├── [       4096]  scoring
│   │   │   ├── [          0]  riskRules.ts
│   │   │   ├── [          0]  runScoringAgent.ts
│   │   │   └── [      12014]  scoringUtils.ts
│   │   ├── [       4096]  search
│   │   │   ├── [          0]  runLegalSearchAgent.ts
│   │   │   ├── [          0]  runPolicySearchAgent.ts
│   │   │   └── [          0]  runSearchAgent.ts
│   │   └── [       5539]  ui_logic_review_v2.md
│   ├── [        403]  index.ts
│   ├── [       4096]  lib
│   │   ├── [       3033]  aiAgent.ts
│   │   ├── [       4457]  apiClient.ts
│   │   ├── [          0]  env.ts
│   │   ├── [       3369]  googleSearch.ts
│   │   ├── [       3073]  index.js.map
│   │   ├── [       1316]  logger.ts
│   │   ├── [          0]  openai.ts
│   │   └── [          0]  validation.ts
│   ├── [       4096]  middleware
│   │   ├── [          0]  auth.ts
│   │   ├── [          0]  errorHandler.ts
│   │   └── [          0]  rateLimiter.ts
│   ├── [        399]  nextApp.ts
│   ├── [        755]  package.json
│   ├── [     101385]  package-lock.json
│   ├── [       4096]  tests
│   │   ├── [       4096]  agents
│   │   └── [       4096]  utils
│   │       └── [          0]  mockResponses.ts
│   └── [        333]  tsconfig.json
├── [        191]  jest-axe.d.ts
├── [        680]  jest.config.js
├── [       1660]  jest.setup.js
├── [       2719]  next.config.js
├── [        213]  next-env.d.ts
├── [       4211]  package.json
├── [     670620]  package-lock.json
├── [         83]  postcss.config.js
├── [       4096]  prisma
│   ├── [       4096]  migrations
│   │   ├── [       4096]  20241219_schema_alignment
│   │   │   └── [       3315]  migration.sql
│   │   ├── [       4096]  20250605221656_add_missing_fields
│   │   │   └── [       8413]  migration.sql
│   │   ├── [       4096]  20250607041402_add_auth_fields_to_user
│   │   │   └── [        272]  migration.sql
│   │   └── [        126]  migration_lock.toml
│   └── [       7339]  schema.prisma
├── [          0]  project-tree.txt
├── [       4096]  public
│   ├── [       4096]  documents
│   │   └── [       4096]  templates
│   ├── [       1183]  favicon.ico
│   ├── [       4096]  images
│   │   ├── [       4096]  background
│   │   ├── [       4096]  icons
│   │   └── [       4096]  logos
│   └── [       4587]  service-worker.js
├── [       4096]  src
│   ├── [       4096]  components
│   │   ├── [       4096]  common
│   │   │   ├── [       1491]  ErrorBoundary.tsx
│   │   │   ├── [       2095]  Footer.tsx
│   │   │   ├── [       2991]  LoadingSpinner.tsx
│   │   │   └── [       9948]  Navbar.tsx
│   │   ├── [       2111]  Footer.tsx
│   │   ├── [       4096]  forms
│   │   │   ├── [       3779]  FOIAForm.tsx
│   │   │   ├── [       2607]  SearchBar.tsx
│   │   │   └── [       3949]  StateCountySelector.tsx
│   │   ├── [        961]  Navbar.tsx
│   │   ├── [       4096]  tools
│   │   │   ├── [       2303]  ExportOptions.tsx
│   │   │   └── [       2002]  JurisdictionGuide.tsx
│   │   └── [       4096]  visualization
│   │       ├── [       2833]  DecisionChainVisualization.tsx
│   │       ├── [       5935]  RiskScoreDashboard.tsx
│   │       └── [       2880]  SearchResults.tsx
│   ├── [       4096]  hooks
│   │   └── [       6809]  useAuth.tsx
│   ├── [       2927]  index.ts
│   ├── [       4096]  lib
│   │   ├── [       4096]  ai
│   │   ├── [       4096]  api
│   │   │   ├── [       6514]  api.ts
│   │   │   ├── [       2384]  api-wrapper.ts
│   │   │   ├── [       2235]  baseApiClient.ts
│   │   │   ├── [       3624]  cache.ts
│   │   │   ├── [       3836]  courtListenerClientV2.ts
│   │   │   ├── [       1758]  dataGovClient.ts
│   │   │   ├── [       4688]  dataGovClientV2.ts
│   │   │   ├── [       4544]  data.ts
│   │   │   ├── [       4408]  edgarClient.ts
│   │   │   ├── [       1535]  enhancedBaseApiClient.ts
│   │   │   ├── [       2171]  fecClient.ts
│   │   │   ├── [       3879]  googleSearch.ts
│   │   │   ├── [       3648]  ncmecClient.ts
│   │   │   ├── [       5895]  optimizedBaseApiClient.ts
│   │   │   ├── [         90]  prisma.ts
│   │   │   ├── [       4366]  riskAlerts.ts
│   │   │   ├── [       6512]  unifiedApiClient.ts
│   │   │   └── [       3741]  validation.ts
│   │   ├── [       4096]  auth
│   │   │   ├── [       3550]  auth.ts
│   │   │   └── [       3633]  jwt.ts
│   │   ├── [       3263]  cache.ts
│   │   ├── [       4096]  config
│   │   │   ├── [       2201]  config.ts
│   │   │   ├── [       2137]  constants.ts
│   │   │   ├── [       2525]  firebase.ts
│   │   │   └── [       1197]  index.ts
│   │   ├── [       4096]  database
│   │   │   ├── [       1911]  database.ts
│   │   │   └── [       1989]  prisma.ts
│   │   ├── [       4096]  errors
│   │   │   └── [       2711]  AppError.ts
│   │   ├── [       3785]  errors.ts
│   │   ├── [        772]  firebase.ts
│   │   ├── [       3940]  logger.ts
│   │   ├── [       4182]  mailer.ts
│   │   ├── [       4096]  middleware
│   │   │   ├── [        711]  auth.ts
│   │   │   ├── [       1455]  errorMiddleware.ts
│   │   │   ├── [        890]  pageAuth.tsx
│   │   │   ├── [       5168]  performance.ts
│   │   │   ├── [       6574]  rateLimit.ts
│   │   │   ├── [       2097]  security.ts
│   │   │   ├── [       9977]  validateRequest.ts
│   │   │   └── [       2967]  withAuth.tsx
│   │   ├── [       1989]  prisma.ts
│   │   ├── [       4096]  scoring
│   │   ├── [       4096]  search
│   │   ├── [       6198]  serviceWorker.ts
│   │   ├── [       4096]  types
│   │   │   ├── [        939]  apiClient.ts
│   │   │   └── [       1283]  apiClientTypes.ts
│   │   └── [       2315]  validation.ts
│   ├── [       4096]  pages
│   │   ├── [       4096]  api
│   │   │   ├── [       4096]  auth
│   │   │   │   ├── [       2497]  login.ts
│   │   │   │   ├── [       1771]  logout.ts
│   │   │   │   ├── [       1034]  [...nextauth].ts
│   │   │   │   ├── [       2649]  refresh.ts
│   │   │   │   ├── [       2982]  register.ts
│   │   │   │   ├── [       3017]  signin.tsx
│   │   │   │   ├── [       2061]  verify-email.ts
│   │   │   │   └── [       1918]  verify.ts
│   │   │   ├── [       4096]  data
│   │   │   │   ├── [       4096]  alerts
│   │   │   │   │   └── [        638]  alerts.ts
│   │   │   │   ├── [       4096]  cps-agency
│   │   │   │   │   └── [       3816]  cps-agency.ts
│   │   │   │   ├── [       4096]  decision-chain
│   │   │   │   │   └── [       2516]  decision-chain.ts
│   │   │   │   ├── [       2935]  export-options.ts
│   │   │   │   ├── [       4096]  foia
│   │   │   │   │   ├── [       4009]  foia-faqs.ts
│   │   │   │   │   ├── [        953]  foia-form-fields.ts
│   │   │   │   │   └── [       2274]  submit.ts
│   │   │   │   ├── [       4096]  risk-scores
│   │   │   │   │   └── [       1972]  risk-scores.ts
│   │   │   │   └── [       1232]  states-counties.ts
│   │   │   ├── [        531]  export-options.ts
│   │   │   ├── [       4096]  foia
│   │   │   │   └── [       4096]  status
│   │   │   ├── [       4096]  jurisdiction
│   │   │   │   ├── [       4454]  details.ts
│   │   │   │   └── [       1194]  [id].ts
│   │   │   ├── [       4096]  logging
│   │   │   │   └── [       2738]  audit.ts
│   │   │   ├── [       4096]  risk
│   │   │   │   ├── [       3327]  alerts.ts
│   │   │   │   └── [       1203]  risk-alerts.ts
│   │   │   └── [       2169]  search.ts
│   │   ├── [        362]  _app.tsx
│   │   ├── [       1682]  cps-analysis.tsx
│   │   ├── [       4096]  dashboard
│   │   ├── [       3226]  dashboard.tsx
│   │   ├── [       1826]  decision-chain.tsx
│   │   ├── [       9776]  foia-generator.tsx
│   │   ├── [       3174]  index.tsx
│   │   ├── [       4096]  search
│   │   │   └── [       1609]  search.ts
│   │   ├── [       3207]  search.tsx
│   │   └── [       4096]  tools
│   ├── [       4096]  services
│   │   ├── [       4096]  cache
│   │   ├── [       4096]  email
│   │   └── [       4096]  firebase
│   │       └── [       1839]  firebase.ts
│   ├── [       4096]  styles
│   │   ├── [       4096]  components
│   │   ├── [      18183]  global_example_page_theme.css
│   │   ├── [       1593]  globals.css
│   │   └── [       4096]  themes
│   ├── [       4096]  types
│   │   ├── [       4096]  api
│   │   │   ├── [        328]  apiResponse.ts
│   │   │   ├── [        871]  auth.ts
│   │   │   └── [       1563]  search.ts
│   │   ├── [       4096]  components
│   │   │   └── [        382]  dashboard.ts
│   │   ├── [       4096]  database
│   │   │   ├── [       4096]  backups
│   │   │   └── [       4096]  sql
│   │   │       ├── [      10298]  schema.sql
│   │   │       └── [       3227]  schema_updates.sql
│   │   ├── [       4096]  external
│   │   ├── [       1473]  index.ts
│   │   └── [        316]  next-auth.d.ts
│   └── [       4096]  utils
│       ├── [       4096]  api
│       │   ├── [        489]  asyncHandler.ts
│       │   └── [        698]  validateMethod.ts
│       ├── [       4096]  common
│       ├── [       4096]  data
│       ├── [       1068]  sanitizeInput.ts
│       └── [       4096]  security
│           └── [       1265]  sanitizeInput.ts
├── [       1345]  storage.rules
├── [        657]  tailwind.config.js
├── [       4096]  test-app
│   ├── [       4096]  e2e
│   ├── [       9660]  e2e-integration-test.js
│   ├── [       9810]  e2e-integration-test.ts
│   ├── [       4096]  fixtures
│   ├── [       4096]  integration
│   ├── [        812]  package.json
│   ├── [      60188]  package-lock.json
│   ├── [       4096]  real-functionality
│   │   └── [        384]  mockLogger.ts
│   ├── [       1152]  server.ts
│   ├── [       2830]  shared-test-utils.ts
│   ├── [       2972]  test-runner.js
│   ├── [       2928]  test-runner.ts
│   ├── [       6774]  unified-api-test.js
│   ├── [       7142]  unified-api-test.ts
│   └── [       4096]  unit
│       ├── [       4096]  api
│       │   └── [       4096]  clients
│       ├── [       4096]  components
│       │   ├── [       1661]  Navbar.test.tsx
│       │   └── [       2831]  ui.navigation.test.tsx
│       ├── [       4096]  services
│       └── [       4096]  utils
├── [       4096]  test-results
│   ├── [       5531]  comprehensive-test-report.md
│   └── [       4096]  reports
├── [        858]  tsconfig.json
└── [     304385]  tsconfig.tsbuildinfo

104 directories, 226 files

```

### Adding New Features

1. Create new utility modules in the `utils/` directory
2. Update types in the respective files
3. Add error handling for new failure modes
4. Update the main `runDecisionGraphAgent.ts` to integrate new features
5. Document changes in this README

### Testing

```bash
npm test
```

This will run the test suite including:

- Unit tests for utility functions
- Integration tests for API clients
- End-to-end tests for the complete workflow

## License

MIT

#!/bin/bash

set -e

echo "🔧 Creating agent architecture inside functions/ ..."

mkdir -p functions/agents/search
mkdir -p functions/agents/foia/foiaTemplates
mkdir -p functions/agents/decision-graph/decisionTemplates
mkdir -p functions/agents/scoring
mkdir -p functions/agents/ngo-mapping

mkdir -p functions/lib
mkdir -p functions/middleware
mkdir -p functions/tests/agents
mkdir -p functions/tests/utils

touch functions/agents/search/runSearchAgent.ts
touch functions/agents/search/runLegalSearchAgent.ts
touch functions/agents/search/runPolicySearchAgent.ts

touch functions/agents/foia/runFoiaAgent.ts
touch functions/agents/foia/foiaUtils.ts
touch functions/agents/foia/foiaTemplates/template_CA.txt
touch functions/agents/foia/foiaTemplates/template_TX.txt

touch functions/agents/decision-graph/runDecisionGraphAgent.ts
touch functions/agents/decision-graph/graphBuilder.ts
touch functions/agents/decision-graph/decisionTemplates/chain_base.puml
touch functions/agents/decision-graph/decisionTemplates/chain_with_agencies.puml

touch functions/agents/scoring/runScoringAgent.ts
touch functions/agents/scoring/riskRules.ts
touch functions/agents/scoring/scoringUtils.ts

touch functions/agents/ngo-mapping/runNgoMappingAgent.ts
touch functions/agents/ngo-mapping/grantPatterns.ts
touch functions/agents/ngo-mapping/contractorDB.ts

touch functions/agents/index.ts
touch functions/index.ts

touch functions/lib/logger.ts
touch functions/lib/env.ts
touch functions/lib/googleSearch.ts
touch functions/lib/openai.ts
touch functions/lib/validation.ts

touch functions/middleware/errorHandler.ts
touch functions/middleware/auth.ts
touch functions/middleware/rateLimiter.ts

touch functions/tests/agents/searchAgent.test.ts
touch functions/tests/agents/foiaAgent.test.ts
touch functions/tests/utils/mockResponses.ts

echo "✅ All directories and agent files created."

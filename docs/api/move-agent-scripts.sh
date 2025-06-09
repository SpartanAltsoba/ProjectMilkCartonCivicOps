#!/bin/bash

set -e

echo "🔄 Moving agent-supporting scripts into functions/lib..."

# Ensure destination folders exist
mkdir -p functions/lib
mkdir -p functions/agents/scoring

# Move aiAgent.ts
if [ -f src/lib/ai/aiAgent.ts ]; then
  cp src/lib/ai/aiAgent.ts functions/lib/aiAgent.ts
  echo "✅ Moved: aiAgent.ts → functions/lib/aiAgent.ts"
else
  echo "⚠️  WARNING: src/lib/ai/aiAgent.ts not found"
fi

# Move googleSearch.ts
if [ -f src/lib/search/googleSearch.ts ]; then
  cp src/lib/search/googleSearch.ts functions/lib/googleSearch.ts
  echo "✅ Moved: googleSearch.ts → functions/lib/googleSearch.ts"
else
  echo "⚠️  WARNING: src/lib/search/googleSearch.ts not found"
fi

# Move scoringEngine.ts
if [ -f src/lib/scoring/scoringEngine.ts ]; then
  cp src/lib/scoring/scoringEngine.ts functions/agents/scoring/scoringUtils.ts
  echo "✅ Moved: scoringEngine.ts → functions/agents/scoring/scoringUtils.ts"
else
  echo "⚠️  WARNING: src/lib/scoring/scoringEngine.ts not found"
fi

# Optional: mark old files as deprecated
echo "/* DEPRECATED: Moved to functions/lib/ */" >> src/lib/ai/aiAgent.ts
echo "/* DEPRECATED: Moved to functions/lib/ */" >> src/lib/search/googleSearch.ts
echo "/* DEPRECATED: Moved to functions/agents/scoring/ */" >> src/lib/scoring/scoringEngine.ts

echo "🎯 All reusable agent scripts moved successfully."

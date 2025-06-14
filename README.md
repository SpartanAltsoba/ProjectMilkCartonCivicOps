# Project Milk Carton Civic Ops

A comprehensive civic accountability system for tracking child welfare system vendors, contracts, and potential violations across jurisdictions.

## Overview

This system implements a multi-stage pipeline that processes case management system data to detect potential conflicts of interest, financial irregularities, and compliance violations in government contracting.

### Pipeline Stages

1. **Recon Stage** - Entity extraction and ID harmonization
2. **Correlation Stage** - Graph building and relationship detection
3. **Analysis Stage** - Violation detection using hybrid rules + ML scoring
4. **Advisory Stage** - Course of Action (COA) generation

## Architecture

The system is built using TypeScript and Neo4j, implementing the architecture specified in the project JSON files:

- **ReconWorker**: Processes case management system data and extracts vendor/system entities
- **CorrelationWorker**: Builds knowledge graph and detects circular relationships
- **AnalystWorker**: Applies statutory rules and ML scoring to flag violations
- **AdvisoryWorker**: Generates actionable COAs with stakeholder mapping

## Prerequisites

- Node.js 18+
- Neo4j 4.4+ running locally or accessible via network
- TypeScript

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

Set the following environment variables:

```bash
export NEO4J_URI="bolt://localhost:7687"
export NEO4J_USER="neo4j"
export NEO4J_PASSWORD="your_password"
```

## Usage

### Run the Complete Pipeline

```bash
# Development mode
npm run dev

# Production mode
npm run start
```

### Run Tests

```bash
# All tests
npm test

# Functional tests only
npm run test:functional
```

## Data Sources

The system processes real case management system data from:
- `api/data/case_management_systems.json` - State-by-state CMS vendor information

## Key Features

### Entity Processing
- Vendor identification and EIN mapping
- System normalization across jurisdictions
- Synthetic ID generation for unknown entities

### Graph Analysis
- Neo4j-based relationship storage
- Cycle detection in vendor-agency relationships
- Jurisdiction-based entity clustering

### Violation Detection
- Financial anomaly detection using z-scores
- Conflict of interest identification via shared officers
- Multi-jurisdiction compliance checking

### COA Generation
- Template-based action item creation
- Stakeholder mapping by jurisdiction
- Priority assignment based on violation severity

## Example Output

```
🥛 Project Milk Carton Civic Ops - Starting Pipeline Execution
================================================================================
🔧 Initializing Pipeline Coordinator...
✅ Pipeline Coordinator initialized successfully

📊 Loading Case Management System Data...
✅ Loaded 52 case management systems

🚀 Executing Full Pipeline...
Stages: Recon → Correlation → Analysis → Advisory

📈 Pipeline Execution Results:
================================================================================
Scenario Hash: a1b2c3d4e5f6...
Overall Status: COMPLETED
Total Processing Time: 15432ms

🎯 Stage Results:

1. Recon Stage: COMPLETED
   - Entities Processed: 104
   - Coverage: 98.1%

2. Correlation Stage: COMPLETED
   - Conflicts Resolved: 3
   - Loops Detected: 2

3. Analysis Stage: COMPLETED
   - Violations Flagged: 7
   - ML Confidence: 78.5%

4. Advisory Stage: COMPLETED
   - COAs Generated: 7
   - Template Coverage: 100.0%
```

## Testing

The system includes comprehensive functional tests that use real case management data:

- **ReconWorker Tests**: Verify entity extraction and Neo4j storage
- **CorrelationWorker Tests**: Test graph building and cycle detection
- **AnalystWorker Tests**: Validate violation detection algorithms
- **AdvisoryWorker Tests**: Confirm COA generation and stakeholder mapping
- **Pipeline Tests**: End-to-end pipeline execution

## Architecture Compliance

This implementation follows the specifications in:
- `1_TheSystem.json` - Overall system architecture
- `2_recon_worker.json` - Recon stage implementation
- `5_CorrelationWorker.json` - Graph correlation logic
- `7_AnalystWorker.json` - Hybrid scoring system
- `8_AdvisoryWorker.json` - COA generation templates

## Contributing

This system implements the exact specifications from the project architecture files. Any modifications should maintain compliance with the defined interfaces and processing stages.

## License

This project is part of Project Milk Carton Civic Ops for government accountability and transparency.

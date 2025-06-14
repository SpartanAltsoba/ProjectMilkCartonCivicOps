import { GraphSet } from './correlation_worker';

interface FeatureVector {
  entity_id: string;
  financial_zscore: number;
  common_officer_count: number;
  lobbying_dollars: number;
  contract_count: number;
  donation_frequency: number;
}

interface RiskVector {
  conflict_of_interest: number;
  financial_anomaly: number;
  regulatory_violation: number;
  transparency_gap: number;
  influence_concentration: number;
}

interface ScoredEntity {
  entity_id: string;
  feature_vector: FeatureVector;
  risk_vector: RiskVector;
  total_score: number;
  violation_flags: string[];
  confidence: number;
}

interface ScoredSet {
  scenario_hash: string;
  scored_entities: ScoredEntity[];
  metadata: {
    created_at: string;
    ml_confidence_mean: number;
    rules_only_mode: boolean;
    flag_precision: number;
    avg_score: number;
  };
}

export class AnalystWorker {
  private mlConfidenceThreshold = 0.65;
  private violationThreshold = 0.8;

  async analyzeGraph(graphSet: GraphSet): Promise<ScoredSet> {
    console.log('Starting analysis for scenario:', graphSet.scenario_hash);

    try {
      // Stage 5.1: Feature Extraction
      const featureVectors = await this.extractFeatures(graphSet);
      
      // Stage 5.2: Hybrid Scoring
      const scoredEntities = await this.hybridScoring(featureVectors);
      
      // Stage 5.3: Violation Flagging
      const flaggedEntities = await this.flagViolations(scoredEntities);
      
      const scoredSet: ScoredSet = {
        scenario_hash: graphSet.scenario_hash,
        scored_entities: flaggedEntities,
        metadata: {
          created_at: new Date().toISOString(),
          ml_confidence_mean: this.calculateMeanConfidence(flaggedEntities),
          rules_only_mode: false, // Will be set during scoring
          flag_precision: this.calculateFlagPrecision(flaggedEntities),
          avg_score: this.calculateAverageScore(flaggedEntities)
        }
      };

      console.log('AnalystCompleted:', {
        scenario_hash: graphSet.scenario_hash,
        entities_analyzed: flaggedEntities.length,
        violations_found: flaggedEntities.filter(e => e.violation_flags.length > 0).length
      });

      return scoredSet;

    } catch (error) {
      console.error('FeatureGap or analysis failure:', error);
      throw error;
    }
  }

  private async extractFeatures(graphSet: GraphSet): Promise<FeatureVector[]> {
    const features: FeatureVector[] = [];

    for (const node of graphSet.nodes) {
      try {
        // Extract financial metrics
        const financialZscore = this.calculateFinancialZscore(node, graphSet);
        
        // Count common officers
        const commonOfficerCount = this.countCommonOfficers(node, graphSet);
        
        // Calculate lobbying activity
        const lobbyingDollars = this.calculateLobbyingDollars(node, graphSet);
        
        // Count contracts
        const contractCount = this.countContracts(node, graphSet);
        
        // Calculate donation frequency
        const donationFrequency = this.calculateDonationFrequency(node, graphSet);

        const featureVector: FeatureVector = {
          entity_id: node.id,
          financial_zscore: financialZscore,
          common_officer_count: commonOfficerCount,
          lobbying_dollars: lobbyingDollars,
          contract_count: contractCount,
          donation_frequency: donationFrequency
        };

        features.push(featureVector);

      } catch (error) {
        console.error('Feature extraction failed for node:', node.id, error);
        
        // Zero-fill missing features and flag FeatureGap
        const zeroFilledVector: FeatureVector = {
          entity_id: node.id,
          financial_zscore: 0,
          common_officer_count: 0,
          lobbying_dollars: 0,
          contract_count: 0,
          donation_frequency: 0
        };
        
        features.push(zeroFilledVector);
        console.log('FeatureGap flagged for entity:', node.id);
      }
    }

    console.log('feature_extraction_success:', features.length);
    return features;
  }

  private async hybridScoring(features: FeatureVector[]): Promise<ScoredEntity[]> {
    const scoredEntities: ScoredEntity[] = [];

    for (const feature of features) {
      try {
        // Apply statutory rules (deterministic logic)
        const rulesRiskVector = this.applyStatutoryRules(feature);
        
        // Run ML anomaly scoring
        const mlRiskVector = await this.runMLScoring(feature);
        const mlConfidence = this.calculateMLConfidence(mlRiskVector);
        
        let finalRiskVector: RiskVector;
        let rulesOnlyMode = false;

        // Check ML confidence threshold
        if (mlConfidence < this.mlConfidenceThreshold) {
          console.log('ML_confidence_too_low for entity:', feature.entity_id, 'confidence:', mlConfidence);
          console.log('rules-only_mode activated');
          finalRiskVector = rulesRiskVector;
          rulesOnlyMode = true;
        } else {
          // Combine rules and ML scores
          finalRiskVector = this.combineRiskVectors(rulesRiskVector, mlRiskVector);
        }

        // Calculate total score
        const totalScore = this.calculateTotalScore(finalRiskVector);

        const scoredEntity: ScoredEntity = {
          entity_id: feature.entity_id,
          feature_vector: feature,
          risk_vector: finalRiskVector,
          total_score: totalScore,
          violation_flags: [], // Will be populated in flagging stage
          confidence: mlConfidence
        };

        scoredEntities.push(scoredEntity);

      } catch (error) {
        console.error('Scoring failed for entity:', feature.entity_id, error);
        // Continue with other entities
      }
    }

    console.log('hybrid_scoring_success:', scoredEntities.length);
    return scoredEntities;
  }

  private async flagViolations(scoredEntities: ScoredEntity[]): Promise<ScoredEntity[]> {
    const flaggedEntities = scoredEntities.map(entity => {
      const flags: string[] = [];

      // Check total score threshold
      if (entity.total_score >= this.violationThreshold) {
        flags.push('ViolationFlag');
        
        // Add specific violation types based on risk vector
        if (entity.risk_vector.conflict_of_interest > 0.7) {
          flags.push('Conflict_of_interest');
        }
        if (entity.risk_vector.financial_anomaly > 0.7) {
          flags.push('Financial_anomaly');
        }
        if (entity.risk_vector.regulatory_violation > 0.7) {
          flags.push('Regulatory_violation');
        }
        if (entity.risk_vector.transparency_gap > 0.7) {
          flags.push('Transparency_gap');
        }
        if (entity.risk_vector.influence_concentration > 0.7) {
          flags.push('Influence_concentration');
        }

        console.log('ViolationFlag emitted for entity:', entity.entity_id, 'score:', entity.total_score);
      } else {
        console.log('no_violation_detected for entity:', entity.entity_id, 'score:', entity.total_score);
      }

      return {
        ...entity,
        violation_flags: flags
      };
    });

    return flaggedEntities;
  }

  // Deterministic rule-based scoring
  private applyStatutoryRules(feature: FeatureVector): RiskVector {
    const riskVector: RiskVector = {
      conflict_of_interest: 0,
      financial_anomaly: 0,
      regulatory_violation: 0,
      transparency_gap: 0,
      influence_concentration: 0
    };

    // Rule 1: High contract count + high donations = conflict of interest
    if (feature.contract_count > 5 && feature.donation_frequency > 10) {
      riskVector.conflict_of_interest = 0.8;
    }

    // Rule 2: Financial z-score outlier = financial anomaly
    if (Math.abs(feature.financial_zscore) > 2.5) {
      riskVector.financial_anomaly = 0.9;
    }

    // Rule 3: High lobbying + contracts = regulatory concern
    if (feature.lobbying_dollars > 100000 && feature.contract_count > 3) {
      riskVector.regulatory_violation = 0.7;
    }

    // Rule 4: Common officers across entities = influence concentration
    if (feature.common_officer_count > 3) {
      riskVector.influence_concentration = 0.8;
    }

    return riskVector;
  }

  // ML-based anomaly scoring
  private async runMLScoring(feature: FeatureVector): Promise<RiskVector> {
    // TODO: Implement actual ML model (XGBoost, etc.)
    // For now, return simplified heuristic-based scores
    
    const riskVector: RiskVector = {
      conflict_of_interest: Math.random() * 0.5, // Placeholder
      financial_anomaly: Math.random() * 0.5,
      regulatory_violation: Math.random() * 0.5,
      transparency_gap: Math.random() * 0.5,
      influence_concentration: Math.random() * 0.5
    };

    return riskVector;
  }

  private calculateMLConfidence(riskVector: RiskVector): number {
    // Simple confidence calculation based on risk vector consistency
    const scores = Object.values(riskVector);
    const variance = this.calculateVariance(scores);
    return Math.max(0, 1 - variance); // Higher variance = lower confidence
  }

  private combineRiskVectors(rules: RiskVector, ml: RiskVector): RiskVector {
    // Weighted combination: 70% rules, 30% ML
    return {
      conflict_of_interest: rules.conflict_of_interest * 0.7 + ml.conflict_of_interest * 0.3,
      financial_anomaly: rules.financial_anomaly * 0.7 + ml.financial_anomaly * 0.3,
      regulatory_violation: rules.regulatory_violation * 0.7 + ml.regulatory_violation * 0.3,
      transparency_gap: rules.transparency_gap * 0.7 + ml.transparency_gap * 0.3,
      influence_concentration: rules.influence_concentration * 0.7 + ml.influence_concentration * 0.3
    };
  }

  private calculateTotalScore(riskVector: RiskVector): number {
    const scores = Object.values(riskVector);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  // Feature extraction helper methods
  private calculateFinancialZscore(node: any, graphSet: GraphSet): number {
    // TODO: Implement actual z-score calculation
    return Math.random() * 4 - 2; // Placeholder: -2 to 2
  }

  private countCommonOfficers(node: any, graphSet: GraphSet): number {
    // TODO: Implement officer counting logic
    return Math.floor(Math.random() * 5); // Placeholder
  }

  private calculateLobbyingDollars(node: any, graphSet: GraphSet): number {
    // TODO: Sum lobbying amounts from edges
    return Math.random() * 500000; // Placeholder
  }

  private countContracts(node: any, graphSet: GraphSet): number {
    return graphSet.edges.filter(edge => 
      edge.from_id === node.id && edge.relationship === 'CONTRACTS'
    ).length;
  }

  private calculateDonationFrequency(node: any, graphSet: GraphSet): number {
    return graphSet.edges.filter(edge => 
      edge.from_id === node.id && edge.relationship === 'DONOR'
    ).length;
  }

  // Metadata calculation methods
  private calculateMeanConfidence(entities: ScoredEntity[]): number {
    if (entities.length === 0) return 0;
    const sum = entities.reduce((acc, entity) => acc + entity.confidence, 0);
    return sum / entities.length;
  }

  private calculateFlagPrecision(entities: ScoredEntity[]): number {
    const flaggedEntities = entities.filter(e => e.violation_flags.length > 0);
    return flaggedEntities.length / entities.length;
  }

  private calculateAverageScore(entities: ScoredEntity[]): number {
    if (entities.length === 0) return 0;
    const sum = entities.reduce((acc, entity) => acc + entity.total_score, 0);
    return sum / entities.length;
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }
}

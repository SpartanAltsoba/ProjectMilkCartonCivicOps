-- New tables for multi-dimensional scoring system

-- Scoring Dimensions
CREATE TABLE scoring_dimensions (
    dimension_id      SERIAL PRIMARY KEY,
    dimension_name    VARCHAR(100) NOT NULL UNIQUE,
    description       TEXT,
    weight           NUMERIC(3,2) NOT NULL DEFAULT 1.0,
    enabled          BOOLEAN NOT NULL DEFAULT TRUE
);

-- Scoring Criteria
CREATE TABLE scoring_criteria (
    criteria_id       SERIAL PRIMARY KEY,
    dimension_id      INT NOT NULL REFERENCES scoring_dimensions(dimension_id),
    criteria_name     VARCHAR(200) NOT NULL,
    description       TEXT,
    data_source      VARCHAR(100) NOT NULL,
    weight           NUMERIC(3,2) NOT NULL DEFAULT 1.0,
    threshold_type   VARCHAR(50) NOT NULL,
    threshold_value  JSONB,
    enabled          BOOLEAN NOT NULL DEFAULT TRUE
);

-- Enhanced Scoring Snapshots
ALTER TABLE scoring_snapshots 
ADD COLUMN dimension_id INT REFERENCES scoring_dimensions(dimension_id),
ADD COLUMN criteria_id INT REFERENCES scoring_criteria(criteria_id),
ADD COLUMN raw_value JSONB,
ADD COLUMN confidence_score NUMERIC(4,2),
ADD COLUMN data_sources JSONB;

-- API Data Cache
CREATE TABLE api_data_cache (
    cache_id         SERIAL PRIMARY KEY,
    api_name         VARCHAR(100) NOT NULL,
    entity_type      VARCHAR(50) NOT NULL,
    entity_id        INT NOT NULL,
    data_key        VARCHAR(255) NOT NULL,
    data_value      JSONB,
    fetched_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMP,
    status          VARCHAR(50) NOT NULL DEFAULT 'active',
    UNIQUE(api_name, entity_type, entity_id, data_key)
);

-- Update API Integrations
ALTER TABLE api_integrations
ADD COLUMN api_version VARCHAR(50),
ADD COLUMN config_params JSONB,
ADD COLUMN rate_limit_rules JSONB,
ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- Create indexes
CREATE INDEX idx_scoring_snapshots_dimension ON scoring_snapshots(dimension_id);
CREATE INDEX idx_scoring_snapshots_criteria ON scoring_snapshots(criteria_id);
CREATE INDEX idx_api_cache_lookup ON api_data_cache(api_name, entity_type, entity_id);
CREATE INDEX idx_api_cache_expiry ON api_data_cache(expires_at) WHERE status = 'active';

-- Insert base scoring dimensions
INSERT INTO scoring_dimensions (dimension_name, description, weight) VALUES
('child_welfare_compliance', 'Compliance with child welfare regulations and standards', 1.0),
('financial_integrity', 'Financial management and resource allocation', 0.8),
('service_effectiveness', 'Effectiveness of provided services and outcomes', 0.9),
('transparency_accountability', 'Transparency in operations and public accountability', 0.7),
('community_engagement', 'Level of community involvement and feedback', 0.6);

-- Insert sample scoring criteria
INSERT INTO scoring_criteria 
(dimension_id, criteria_name, description, data_source, threshold_type, threshold_value) 
SELECT 
    d.dimension_id,
    'Case Resolution Rate' as criteria_name,
    'Percentage of cases resolved within mandated timeframes' as description,
    'case_outcomes' as data_source,
    'range' as threshold_type,
    '{"min": 0, "max": 100, "target": 80}' as threshold_value
FROM scoring_dimensions d
WHERE d.dimension_name = 'child_welfare_compliance'
LIMIT 1;

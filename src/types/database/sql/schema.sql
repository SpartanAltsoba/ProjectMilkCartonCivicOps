-- Applying schema from provided schema_example.txt

-- ENUM Definitions
CREATE TYPE child_dependency_classification AS ENUM (
    'CHINS',
    'CINA',
    'FINS',
    'PINS',
    'DEPENDENCY'
);

CREATE TYPE cps_system_type AS ENUM (
    'STATE_LED',
    'COUNTY_LED',
    'HYBRID'
);

CREATE TYPE outcome_type AS ENUM (
    'REUNIFICATION',
    'ADOPTION',
    'AGED_OUT',
    'GUARDIANSHIP',
    'OTHER'
);

CREATE TYPE actor_role AS ENUM (
    'MANDATED_REPORTER',
    'INTAKE',
    'INVESTIGATOR',
    'PROSECUTOR',
    'JUDGE'
);

CREATE TYPE official_role AS ENUM (
    'LEGISLATOR', 
    'JUDGE',
    'GOVERNOR',
    'APPOINTEE',
    'OTHER'
);

-- Location & Agency Hierarchy
CREATE TABLE states (
    state_id           SERIAL PRIMARY KEY,
    state_name         VARCHAR(100) NOT NULL,
    state_code         VARCHAR(2)   NOT NULL UNIQUE
);

CREATE TABLE counties (
    county_id          SERIAL PRIMARY KEY,
    county_name        VARCHAR(150) NOT NULL,
    state_id           INT NOT NULL REFERENCES states(state_id)
);

CREATE TABLE cps_agencies (
    agency_id          SERIAL PRIMARY KEY,
    agency_name        VARCHAR(200) NOT NULL,
    system_type        cps_system_type NOT NULL,
    state_id           INT REFERENCES states(state_id),
    county_id          INT REFERENCES counties(county_id),
    parent_agency_id   INT,
    CONSTRAINT fk_parent_agency 
      FOREIGN KEY (parent_agency_id) REFERENCES cps_agencies(agency_id)
);

-- Legal & Statutory References
CREATE TABLE statutes (
    statute_id         SERIAL PRIMARY KEY,
    statute_name       VARCHAR(255) NOT NULL,
    citation           VARCHAR(255) NOT NULL,
    description        TEXT,
    is_federal         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE case_law (
    case_law_id        SERIAL PRIMARY KEY,
    case_name          VARCHAR(255) NOT NULL,
    citation           VARCHAR(255),
    summary            TEXT,
    date_decided       DATE
);

CREATE TABLE agency_statutes (
    agency_id          INT NOT NULL REFERENCES cps_agencies(agency_id),
    statute_id         INT NOT NULL REFERENCES statutes(statute_id),
    PRIMARY KEY (agency_id, statute_id)
);

-- CPS Cases & Proceedings
CREATE TABLE cps_cases (
    case_id            SERIAL PRIMARY KEY,
    case_number        VARCHAR(100) NOT NULL UNIQUE,
    agency_id          INT NOT NULL REFERENCES cps_agencies(agency_id),
    classification     child_dependency_classification NOT NULL,
    date_opened        DATE NOT NULL,
    date_closed        DATE,
    child_id           VARCHAR(50),
    caretaker_id       VARCHAR(50),
    case_description   TEXT
);

CREATE TABLE case_statutes (
    case_id            INT NOT NULL REFERENCES cps_cases(case_id),
    statute_id         INT NOT NULL REFERENCES statutes(statute_id),
    PRIMARY KEY (case_id, statute_id)
);

CREATE TABLE court_events (
    event_id           SERIAL PRIMARY KEY,
    case_id            INT NOT NULL REFERENCES cps_cases(case_id),
    event_date         DATE NOT NULL,
    event_type         VARCHAR(100),
    warrant_required   BOOLEAN,
    hearing_outcome    VARCHAR(255),
    next_hearing_date  DATE
);

-- CPS Outcomes
CREATE TABLE case_outcomes (
    outcome_id         SERIAL PRIMARY KEY,
    case_id            INT NOT NULL REFERENCES cps_cases(case_id),
    outcome_type       outcome_type NOT NULL,
    date_of_outcome    DATE NOT NULL,
    time_in_care_days  INT,
    child_race_ethnicity  VARCHAR(100),
    child_age_at_outcome  INT,
    notes             TEXT
);

CREATE TABLE outcome_statistics (
    stat_id            SERIAL PRIMARY KEY,
    year               INT NOT NULL,
    county_id          INT REFERENCES counties(county_id),
    agency_id          INT REFERENCES cps_agencies(agency_id),
    outcome_type       outcome_type NOT NULL,
    count_outcomes     INT NOT NULL
);

-- Funding & Financials
CREATE TABLE funding_sources (
    funding_source_id  SERIAL PRIMARY KEY,
    source_name        VARCHAR(255) NOT NULL,
    is_federal         BOOLEAN NOT NULL DEFAULT FALSE,
    is_state           BOOLEAN NOT NULL DEFAULT FALSE,
    is_private         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE agency_funding (
    agency_funding_id  SERIAL PRIMARY KEY,
    agency_id          INT NOT NULL REFERENCES cps_agencies(agency_id),
    funding_source_id  INT NOT NULL REFERENCES funding_sources(funding_source_id),
    fiscal_year        INT NOT NULL,
    amount_usd         NUMERIC(15,2) NOT NULL,
    program_specific   VARCHAR(255)
);

CREATE TABLE contractor_payments (
    contractor_payment_id  SERIAL PRIMARY KEY,
    agency_id              INT NOT NULL REFERENCES cps_agencies(agency_id),
    contractor_name        VARCHAR(255) NOT NULL,
    contractor_ein         VARCHAR(50),
    contract_amount_usd    NUMERIC(15,2) NOT NULL,
    contract_start_date    DATE NOT NULL,
    contract_end_date      DATE,
    contract_purpose       TEXT
);

-- Services & Availability
CREATE TABLE services (
    service_id         SERIAL PRIMARY KEY,
    service_name       VARCHAR(200) NOT NULL,
    description        TEXT
);

CREATE TABLE agency_services (
    agency_service_id  SERIAL PRIMARY KEY,
    agency_id          INT NOT NULL REFERENCES cps_agencies(agency_id),
    service_id         INT NOT NULL REFERENCES services(service_id),
    is_available       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE service_enrollments (
    service_enrollment_id SERIAL PRIMARY KEY,
    case_id               INT NOT NULL REFERENCES cps_cases(case_id),
    service_id            INT NOT NULL REFERENCES services(service_id),
    enrollment_date       DATE NOT NULL,
    completion_date       DATE,
    successful_completion BOOLEAN,
    notes                 TEXT
);

-- NGO & Private Involvement
CREATE TABLE ngo_organizations (
    ngo_id             SERIAL PRIMARY KEY,
    legal_name         VARCHAR(255) NOT NULL,
    ein                VARCHAR(50) UNIQUE,
    headquarters_state INT REFERENCES states(state_id),
    website_url        VARCHAR(255),
    mission_statement  TEXT
);

CREATE TABLE ngo_990_filings (
    filing_id          SERIAL PRIMARY KEY,
    ngo_id             INT NOT NULL REFERENCES ngo_organizations(ngo_id),
    tax_year           INT NOT NULL,
    form_990_url       VARCHAR(500),
    total_revenue_usd  NUMERIC(15,2),
    total_expenses_usd NUMERIC(15,2),
    exec_compensation  NUMERIC(15,2),
    date_filed         DATE
);

CREATE TABLE ngo_agency_participation (
    ngo_agency_id      SERIAL PRIMARY KEY,
    ngo_id             INT NOT NULL REFERENCES ngo_organizations(ngo_id),
    agency_id          INT NOT NULL REFERENCES cps_agencies(agency_id),
    involvement_type   VARCHAR(255),
    contract_amount_usd NUMERIC(15,2),
    start_date         DATE,
    end_date           DATE
);

CREATE TABLE board_members (
    board_member_id    SERIAL PRIMARY KEY,
    ngo_id             INT NOT NULL REFERENCES ngo_organizations(ngo_id),
    individual_name    VARCHAR(255) NOT NULL,
    role_title         VARCHAR(255),
    start_date         DATE,
    end_date           DATE
);

CREATE TABLE conflicts_of_interest (
    conflict_id        SERIAL PRIMARY KEY,
    board_member_id    INT NOT NULL REFERENCES board_members(board_member_id),
    other_ngo_id       INT REFERENCES ngo_organizations(ngo_id),
    public_official_id INT,
    details            TEXT
);

-- Representative Accountability
CREATE TABLE public_officials (
    official_id        SERIAL PRIMARY KEY,
    full_name          VARCHAR(255) NOT NULL,
    role               official_role NOT NULL,
    state_id           INT REFERENCES states(state_id),
    county_id          INT REFERENCES counties(county_id),
    district_code      VARCHAR(50),
    party_affiliation  VARCHAR(50),
    start_term_date    DATE,
    end_term_date      DATE
);

CREATE TABLE legislative_votes (
    vote_id            SERIAL PRIMARY KEY,
    official_id        INT NOT NULL REFERENCES public_officials(official_id),
    bill_name          VARCHAR(255) NOT NULL,
    bill_citation      VARCHAR(255),
    vote_position      VARCHAR(50) NOT NULL,
    vote_date          DATE NOT NULL
);

CREATE TABLE judge_case_metrics (
    judge_metric_id    SERIAL PRIMARY KEY,
    official_id        INT NOT NULL REFERENCES public_officials(official_id),
    total_cases        INT NOT NULL DEFAULT 0,
    tpr_count          INT NOT NULL DEFAULT 0,
    reunification_count INT NOT NULL DEFAULT 0,
    complaint_count    INT NOT NULL DEFAULT 0
);

CREATE TABLE public_statements (
    statement_id       SERIAL PRIMARY KEY,
    official_id        INT NOT NULL REFERENCES public_officials(official_id),
    statement_date     DATE,
    statement_source   VARCHAR(500),
    statement_text     TEXT,
    foia_flag          BOOLEAN DEFAULT FALSE
);

-- Decision Chain & Process Mapping
CREATE TABLE decision_chain_steps (
    decision_chain_step_id SERIAL PRIMARY KEY,
    case_id                INT NOT NULL REFERENCES cps_cases(case_id),
    step_order             INT NOT NULL,
    actor_role             actor_role NOT NULL,
    actor_id               INT,
    step_description       TEXT,
    step_date              DATE
);

-- External API Integrations (Metadata)
CREATE TABLE api_integrations (
    api_integration_id   SERIAL PRIMARY KEY,
    api_name             VARCHAR(100) NOT NULL,
    api_description      TEXT,
    last_accessed        TIMESTAMP,
    auth_credentials_ref VARCHAR(255)
);

CREATE TABLE external_api_records (
    external_record_id   SERIAL PRIMARY KEY,
    api_integration_id   INT NOT NULL REFERENCES api_integrations(api_integration_id),
    related_entity       VARCHAR(50),
    related_entity_id    INT,
    data_payload         JSONB,
    date_fetched         TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Suggested Table: scoring_snapshots
CREATE TABLE scoring_snapshots (
    snapshot_id       SERIAL PRIMARY KEY,
    entity_type       VARCHAR(50),
    entity_id         INT,
    score_dimension   VARCHAR(100),
    score_value       NUMERIC(6,2),
    score_date        TIMESTAMP DEFAULT NOW(),
    schema_version    VARCHAR(10)
);

-- Indexes & Constraints
CREATE UNIQUE INDEX idx_case_number ON cps_cases(case_number);
CREATE INDEX idx_outcome_county_year ON outcome_statistics(county_id, year);
CREATE INDEX idx_public_official_role ON public_officials(role);

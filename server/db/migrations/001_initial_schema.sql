-- Migration 001: Initial Schema for Invisible Queue
-- Created: Phase 2 Database Setup

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    type            VARCHAR(50) NOT NULL,  -- 'hospital', 'government_office', 'ration_shop', 'lab', 'bank'
    contact_email   VARCHAR(255),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Locations
CREATE TABLE IF NOT EXISTS locations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    address         TEXT,
    city            VARCHAR(100),
    state           VARCHAR(100),
    pincode         VARCHAR(10),
    latitude        DECIMAL(10, 8),
    longitude       DECIMAL(11, 8),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Services
CREATE TABLE IF NOT EXISTS services (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id             UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    name                    VARCHAR(255) NOT NULL,       -- e.g. 'General OPD Registration'
    service_type            VARCHAR(50) NOT NULL,        -- 'opd', 'counter', 'dispensary'
    avg_service_time_min    INTEGER DEFAULT 8,
    capacity_per_hour       INTEGER DEFAULT 45,
    is_active               BOOLEAN DEFAULT true,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Operating Hours
CREATE TABLE IF NOT EXISTS operating_hours (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id      UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    day_of_week     SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    open_time       TIME NOT NULL,
    close_time      TIME NOT NULL,
    is_closed       BOOLEAN DEFAULT false,
    UNIQUE(service_id, day_of_week)
);

-- 5. Users (Staff / Organization accounts)
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid    VARCHAR(128) UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255),
    display_name    VARCHAR(255),
    role            VARCHAR(20) NOT NULL DEFAULT 'org_viewer',  -- 'org_admin', 'org_viewer', 'super_admin'
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Crowd Reports (Anonymous citizen telemetry)
CREATE TABLE IF NOT EXISTS crowd_reports (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id          UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    crowd_level         VARCHAR(20) NOT NULL,   -- 'low', 'moderate', 'high', 'very_high'
    estimated_wait_min  INTEGER,
    reporter_hash       VARCHAR(64),
    is_flagged          BOOLEAN DEFAULT false,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    expires_at          TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crowd_reports_service_active
    ON crowd_reports(service_id, expires_at DESC)
    WHERE is_flagged = false;

-- 7. Predictions Log
CREATE TABLE IF NOT EXISTS predictions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id          UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    crowd_level         VARCHAR(20) NOT NULL,
    estimated_wait_min  INTEGER NOT NULL,
    wait_range_low_min  INTEGER NOT NULL,
    wait_range_high_min INTEGER NOT NULL,
    confidence_score    SMALLINT NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
    confidence_label    VARCHAR(10) NOT NULL,
    data_sources        JSONB NOT NULL,
    model_version       VARCHAR(20) NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictions_service_time
    ON predictions(service_id, created_at DESC);

-- 8. Historical Metrics
CREATE TABLE IF NOT EXISTS historical_metrics (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id      UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    day_of_week     SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    hour_of_day     SMALLINT NOT NULL CHECK (hour_of_day BETWEEN 0 AND 23),
    avg_wait_min    DECIMAL(6, 2) NOT NULL,
    avg_crowd_level DECIMAL(3, 2) NOT NULL,
    sample_count    INTEGER NOT NULL DEFAULT 30,
    data_source     VARCHAR(20) NOT NULL DEFAULT 'seed',
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(service_id, day_of_week, hour_of_day)
);

CREATE INDEX IF NOT EXISTS idx_historical_lookup
    ON historical_metrics(service_id, day_of_week, hour_of_day);

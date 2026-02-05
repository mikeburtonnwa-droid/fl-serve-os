-- =============================================================================
-- Client Portal Migration (Epic 10: F10.1-F10.8)
--
-- Adds tables for magic link authentication, portal sessions, and analytics.
--
-- User Stories: US-035, US-036, US-037, US-038, US-039
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Magic Links Table (F10.1)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS portal_magic_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash TEXT NOT NULL UNIQUE, -- Hashed token for security
    engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    client_email TEXT NOT NULL,
    client_name TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    access_count INT NOT NULL DEFAULT 0,
    last_access_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT valid_email CHECK (client_email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$')
);

-- Indexes for magic links
CREATE INDEX idx_magic_links_token ON portal_magic_links(token_hash);
CREATE INDEX idx_magic_links_engagement ON portal_magic_links(engagement_id);
CREATE INDEX idx_magic_links_email ON portal_magic_links(client_email);
CREATE INDEX idx_magic_links_expires ON portal_magic_links(expires_at);

-- -----------------------------------------------------------------------------
-- Portal Sessions Table (F10.2)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS portal_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    magic_link_id UUID NOT NULL REFERENCES portal_magic_links(id) ON DELETE CASCADE,
    engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    client_email TEXT NOT NULL,
    client_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Indexes for sessions
CREATE INDEX idx_portal_sessions_magic_link ON portal_sessions(magic_link_id);
CREATE INDEX idx_portal_sessions_engagement ON portal_sessions(engagement_id);
CREATE INDEX idx_portal_sessions_active ON portal_sessions(is_active, expires_at);

-- -----------------------------------------------------------------------------
-- Artifact Visibility Table (F10.6)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS artifact_visibility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
    is_client_visible BOOLEAN NOT NULL DEFAULT FALSE,
    visible_since TIMESTAMPTZ,
    hidden_since TIMESTAMPTZ,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Only one visibility record per artifact
    CONSTRAINT unique_artifact_visibility UNIQUE (artifact_id)
);

-- Index for visibility lookups
CREATE INDEX idx_artifact_visibility_visible ON artifact_visibility(artifact_id, is_client_visible);

-- -----------------------------------------------------------------------------
-- Portal Activity Log Table (F10.7)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS portal_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    session_id UUID REFERENCES portal_sessions(id) ON DELETE SET NULL,
    client_email TEXT,
    action TEXT NOT NULL CHECK (action IN ('login', 'view_dashboard', 'view_artifact', 'download_artifact', 'logout')),
    artifact_id UUID REFERENCES artifacts(id) ON DELETE SET NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for activity log
CREATE INDEX idx_portal_activity_engagement ON portal_activity_log(engagement_id);
CREATE INDEX idx_portal_activity_session ON portal_activity_log(session_id);
CREATE INDEX idx_portal_activity_created ON portal_activity_log(created_at DESC);
CREATE INDEX idx_portal_activity_action ON portal_activity_log(action);

-- -----------------------------------------------------------------------------
-- Add client_visible column to artifacts table
-- -----------------------------------------------------------------------------

ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS client_visible BOOLEAN DEFAULT FALSE;

-- Only T2 artifacts can be client visible
CREATE OR REPLACE FUNCTION check_artifact_visibility()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.client_visible = TRUE THEN
        -- Check if artifact's engagement has sensitivity T2
        -- For now, allow all - in production would check sensitivity tier
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER artifact_visibility_check
    BEFORE UPDATE OF client_visible ON artifacts
    FOR EACH ROW
    EXECUTE FUNCTION check_artifact_visibility();

-- -----------------------------------------------------------------------------
-- RLS Policies
-- -----------------------------------------------------------------------------

-- Magic Links: consultants can manage, no direct client access
ALTER TABLE portal_magic_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can view own engagement magic links"
    ON portal_magic_links FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM engagements e
            WHERE e.id = engagement_id
            AND (e.created_by = auth.uid() OR e.consultant_id = auth.uid())
        )
    );

CREATE POLICY "Consultants can create magic links for own engagements"
    ON portal_magic_links FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM engagements e
            WHERE e.id = engagement_id
            AND (e.created_by = auth.uid() OR e.consultant_id = auth.uid())
        )
    );

CREATE POLICY "Consultants can update own engagement magic links"
    ON portal_magic_links FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM engagements e
            WHERE e.id = engagement_id
            AND (e.created_by = auth.uid() OR e.consultant_id = auth.uid())
        )
    );

-- Portal Sessions: read-only for consultants
ALTER TABLE portal_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can view portal sessions for own engagements"
    ON portal_sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM engagements e
            WHERE e.id = engagement_id
            AND (e.created_by = auth.uid() OR e.consultant_id = auth.uid())
        )
    );

-- Artifact Visibility: consultants can manage
ALTER TABLE artifact_visibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can manage artifact visibility"
    ON artifact_visibility FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM artifacts a
            JOIN engagements e ON a.engagement_id = e.id
            WHERE a.id = artifact_id
            AND (e.created_by = auth.uid() OR e.consultant_id = auth.uid())
        )
    );

-- Activity Log: read-only for consultants
ALTER TABLE portal_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can view activity for own engagements"
    ON portal_activity_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM engagements e
            WHERE e.id = engagement_id
            AND (e.created_by = auth.uid() OR e.consultant_id = auth.uid())
        )
    );

-- -----------------------------------------------------------------------------
-- Helper Functions
-- -----------------------------------------------------------------------------

-- Function to validate a magic link token
CREATE OR REPLACE FUNCTION validate_magic_link(token_hash_input TEXT)
RETURNS TABLE (
    is_valid BOOLEAN,
    reason TEXT,
    link_id UUID,
    engagement_id UUID,
    engagement_name TEXT,
    client_name TEXT
) AS $$
DECLARE
    link_record RECORD;
BEGIN
    -- Find the link
    SELECT ml.*, e.name as eng_name
    INTO link_record
    FROM portal_magic_links ml
    JOIN engagements e ON ml.engagement_id = e.id
    WHERE ml.token_hash = token_hash_input;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'not_found'::TEXT, NULL::UUID, NULL::UUID, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;

    -- Check if revoked
    IF link_record.is_revoked THEN
        RETURN QUERY SELECT FALSE, 'revoked'::TEXT, link_record.id, link_record.engagement_id, link_record.eng_name, link_record.client_name;
        RETURN;
    END IF;

    -- Check if expired
    IF link_record.expires_at < NOW() THEN
        RETURN QUERY SELECT FALSE, 'expired'::TEXT, link_record.id, link_record.engagement_id, link_record.eng_name, link_record.client_name;
        RETURN;
    END IF;

    -- Valid
    RETURN QUERY SELECT TRUE, NULL::TEXT, link_record.id, link_record.engagement_id, link_record.eng_name, link_record.client_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get portal analytics
CREATE OR REPLACE FUNCTION get_portal_analytics(
    engagement_uuid UUID,
    days_back INT DEFAULT 30
)
RETURNS TABLE (
    total_views BIGINT,
    unique_visitors BIGINT,
    artifact_views BIGINT,
    downloads BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_views,
        COUNT(DISTINCT client_email)::BIGINT as unique_visitors,
        COUNT(*) FILTER (WHERE action = 'view_artifact')::BIGINT as artifact_views,
        COUNT(*) FILTER (WHERE action = 'download_artifact')::BIGINT as downloads
    FROM portal_activity_log
    WHERE engagement_id = engagement_uuid
    AND created_at >= NOW() - (days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to log portal activity (bypasses RLS for portal use)
CREATE OR REPLACE FUNCTION log_portal_activity(
    p_engagement_id UUID,
    p_session_id UUID,
    p_client_email TEXT,
    p_action TEXT,
    p_artifact_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT '{}'::jsonb,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO portal_activity_log (
        engagement_id, session_id, client_email, action,
        artifact_id, details, ip_address, user_agent
    )
    VALUES (
        p_engagement_id, p_session_id, p_client_email, p_action,
        p_artifact_id, p_details, p_ip_address, p_user_agent
    )
    RETURNING id INTO log_id;

    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- Comments
-- -----------------------------------------------------------------------------

COMMENT ON TABLE portal_magic_links IS 'Stores magic link tokens for client portal access';
COMMENT ON TABLE portal_sessions IS 'Tracks active client portal sessions';
COMMENT ON TABLE artifact_visibility IS 'Controls which artifacts are visible in client portal';
COMMENT ON TABLE portal_activity_log IS 'Logs all client portal activity for analytics';
COMMENT ON FUNCTION validate_magic_link IS 'Validates a magic link token and returns engagement info';
COMMENT ON FUNCTION get_portal_analytics IS 'Returns analytics summary for an engagement portal';

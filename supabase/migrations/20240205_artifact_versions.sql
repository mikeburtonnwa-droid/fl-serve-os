-- =============================================================================
-- Epic 5: Artifact Version Control (F5.1)
-- Migration: Create artifact_versions table for version history
-- =============================================================================

-- Create artifact_versions table to store version history
CREATE TABLE IF NOT EXISTS artifact_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content JSONB NOT NULL,
    name VARCHAR(255) NOT NULL,
    change_summary TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure unique version numbers per artifact
    UNIQUE(artifact_id, version_number)
);

-- Create index for efficient version lookups
CREATE INDEX IF NOT EXISTS idx_artifact_versions_artifact_id
    ON artifact_versions(artifact_id);

CREATE INDEX IF NOT EXISTS idx_artifact_versions_created_at
    ON artifact_versions(artifact_id, created_at DESC);

-- Add edit_lock columns to artifacts table for concurrent edit detection (F5.5)
ALTER TABLE artifacts
    ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ;

-- Create index for lock lookups
CREATE INDEX IF NOT EXISTS idx_artifacts_locked_by
    ON artifacts(locked_by) WHERE locked_by IS NOT NULL;

-- Enable RLS on artifact_versions
ALTER TABLE artifact_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view versions of artifacts they can access
CREATE POLICY "Users can view artifact versions"
    ON artifact_versions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM artifacts a
            JOIN engagements e ON a.engagement_id = e.id
            WHERE a.id = artifact_versions.artifact_id
            -- Add your organization/team access logic here
        )
    );

-- RLS Policy: Users can create versions when saving artifacts
CREATE POLICY "Users can create artifact versions"
    ON artifact_versions
    FOR INSERT
    WITH CHECK (
        auth.uid() = created_by
        AND EXISTS (
            SELECT 1 FROM artifacts a
            JOIN engagements e ON a.engagement_id = e.id
            WHERE a.id = artifact_versions.artifact_id
        )
    );

-- Function to automatically create version on artifact update
CREATE OR REPLACE FUNCTION create_artifact_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create version if content actually changed
    IF OLD.content IS DISTINCT FROM NEW.content OR OLD.name IS DISTINCT FROM NEW.name THEN
        INSERT INTO artifact_versions (
            artifact_id,
            version_number,
            content,
            name,
            created_by,
            change_summary
        ) VALUES (
            NEW.id,
            NEW.version,
            OLD.content,  -- Store the OLD content as the previous version
            OLD.name,
            NEW.last_edited_by,
            'Auto-saved version before edit'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic versioning
DROP TRIGGER IF EXISTS artifact_version_trigger ON artifacts;
CREATE TRIGGER artifact_version_trigger
    BEFORE UPDATE ON artifacts
    FOR EACH ROW
    WHEN (OLD.content IS DISTINCT FROM NEW.content OR OLD.name IS DISTINCT FROM NEW.name)
    EXECUTE FUNCTION create_artifact_version();

-- Function to acquire edit lock (F5.5)
CREATE OR REPLACE FUNCTION acquire_artifact_lock(
    p_artifact_id UUID,
    p_user_id UUID,
    p_lock_timeout_minutes INTEGER DEFAULT 30
)
RETURNS TABLE (
    success BOOLEAN,
    locked_by UUID,
    locked_at TIMESTAMPTZ,
    lock_owner_email TEXT
) AS $$
DECLARE
    v_current_lock_by UUID;
    v_current_lock_at TIMESTAMPTZ;
    v_lock_expired BOOLEAN;
BEGIN
    -- Check current lock status
    SELECT a.locked_by, a.locked_at
    INTO v_current_lock_by, v_current_lock_at
    FROM artifacts a
    WHERE a.id = p_artifact_id;

    -- Determine if lock is expired
    v_lock_expired := v_current_lock_at IS NULL
        OR v_current_lock_at < NOW() - (p_lock_timeout_minutes || ' minutes')::INTERVAL;

    -- If no lock or lock expired, acquire it
    IF v_current_lock_by IS NULL OR v_lock_expired OR v_current_lock_by = p_user_id THEN
        UPDATE artifacts
        SET locked_by = p_user_id,
            locked_at = NOW()
        WHERE id = p_artifact_id;

        RETURN QUERY SELECT
            TRUE,
            p_user_id,
            NOW(),
            NULL::TEXT;
    ELSE
        -- Return info about current lock holder
        RETURN QUERY SELECT
            FALSE,
            v_current_lock_by,
            v_current_lock_at,
            (SELECT email FROM auth.users WHERE id = v_current_lock_by);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to release edit lock
CREATE OR REPLACE FUNCTION release_artifact_lock(
    p_artifact_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE artifacts
    SET locked_by = NULL,
        locked_at = NULL
    WHERE id = p_artifact_id
    AND (locked_by = p_user_id OR locked_by IS NULL);

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for concurrent edits (F5.5)
CREATE OR REPLACE FUNCTION check_concurrent_edit(
    p_artifact_id UUID,
    p_expected_version INTEGER,
    p_last_known_updated_at TIMESTAMPTZ
)
RETURNS TABLE (
    has_conflict BOOLEAN,
    current_version INTEGER,
    last_editor_id UUID,
    last_editor_email TEXT,
    last_edited_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (a.version > p_expected_version OR a.updated_at > p_last_known_updated_at) AS has_conflict,
        a.version,
        a.last_edited_by,
        u.email,
        a.last_edited_at
    FROM artifacts a
    LEFT JOIN auth.users u ON a.last_edited_by = u.id
    WHERE a.id = p_artifact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION acquire_artifact_lock TO authenticated;
GRANT EXECUTE ON FUNCTION release_artifact_lock TO authenticated;
GRANT EXECUTE ON FUNCTION check_concurrent_edit TO authenticated;

-- =============================================================================
-- Engagement Cloning Migration (Epic 9: F9.1-F9.4)
--
-- Adds tables for tracking clone lineage and configuration.
--
-- User Stories: US-033, US-034
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Clone Lineage Table (F9.4)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS engagement_clones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    target_engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    cloned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cloned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Clone configuration (stored as JSON for flexibility)
    configuration JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Clone summary
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Notes
    notes TEXT,

    -- Constraints
    CONSTRAINT unique_clone_pair UNIQUE (source_engagement_id, target_engagement_id),
    CONSTRAINT no_self_clone CHECK (source_engagement_id != target_engagement_id)
);

-- Index for finding clones of an engagement
CREATE INDEX idx_engagement_clones_source ON engagement_clones(source_engagement_id);
CREATE INDEX idx_engagement_clones_target ON engagement_clones(target_engagement_id);
CREATE INDEX idx_engagement_clones_cloned_by ON engagement_clones(cloned_by);
CREATE INDEX idx_engagement_clones_cloned_at ON engagement_clones(cloned_at DESC);

-- -----------------------------------------------------------------------------
-- Artifact Clone Tracking
-- -----------------------------------------------------------------------------

-- Add column to artifacts table to track clone source
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS cloned_from_id UUID REFERENCES artifacts(id) ON DELETE SET NULL;

-- Index for finding cloned artifacts
CREATE INDEX IF NOT EXISTS idx_artifacts_cloned_from ON artifacts(cloned_from_id);

-- -----------------------------------------------------------------------------
-- Engagement Metadata for Cloning
-- -----------------------------------------------------------------------------

-- Add column to track if engagement was created via clone
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS clone_metadata JSONB DEFAULT NULL;

-- -----------------------------------------------------------------------------
-- RLS Policies for engagement_clones
-- -----------------------------------------------------------------------------

ALTER TABLE engagement_clones ENABLE ROW LEVEL SECURITY;

-- Users can view clone records for engagements they have access to
CREATE POLICY "Users can view relevant clone records"
    ON engagement_clones FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM engagements e
            WHERE (e.id = source_engagement_id OR e.id = target_engagement_id)
            AND (e.created_by = auth.uid() OR e.primary_consultant = auth.uid())
        )
    );

-- Users can create clone records for engagements they own
CREATE POLICY "Users can create clone records for owned engagements"
    ON engagement_clones FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM engagements e
            WHERE e.id = source_engagement_id
            AND (e.created_by = auth.uid() OR e.primary_consultant = auth.uid())
        )
    );

-- Users can update their own clone records
CREATE POLICY "Users can update own clone records"
    ON engagement_clones FOR UPDATE
    USING (cloned_by = auth.uid());

-- Users can delete their own clone records
CREATE POLICY "Users can delete own clone records"
    ON engagement_clones FOR DELETE
    USING (cloned_by = auth.uid());

-- -----------------------------------------------------------------------------
-- Helper Functions
-- -----------------------------------------------------------------------------

-- Function to get clone lineage tree for an engagement
CREATE OR REPLACE FUNCTION get_clone_lineage(engagement_uuid UUID)
RETURNS TABLE (
    engagement_id UUID,
    engagement_name TEXT,
    client_name TEXT,
    relationship TEXT,
    cloned_at TIMESTAMPTZ,
    depth INT
) AS $$
WITH RECURSIVE lineage AS (
    -- Base case: the engagement itself
    SELECT
        e.id AS engagement_id,
        e.name AS engagement_name,
        c.name AS client_name,
        'self'::TEXT AS relationship,
        NULL::TIMESTAMPTZ AS cloned_at,
        0 AS depth
    FROM engagements e
    LEFT JOIN clients c ON e.client_id = c.id
    WHERE e.id = engagement_uuid

    UNION ALL

    -- Recursive: parent engagements (cloned from)
    SELECT
        e.id,
        e.name,
        c.name,
        'parent'::TEXT,
        ec.cloned_at,
        l.depth - 1
    FROM lineage l
    JOIN engagement_clones ec ON ec.target_engagement_id = l.engagement_id
    JOIN engagements e ON e.id = ec.source_engagement_id
    LEFT JOIN clients c ON e.client_id = c.id
    WHERE l.relationship IN ('self', 'parent')
    AND l.depth > -5  -- Limit depth

    UNION ALL

    -- Recursive: child engagements (cloned to)
    SELECT
        e.id,
        e.name,
        c.name,
        'child'::TEXT,
        ec.cloned_at,
        l.depth + 1
    FROM lineage l
    JOIN engagement_clones ec ON ec.source_engagement_id = l.engagement_id
    JOIN engagements e ON e.id = ec.target_engagement_id
    LEFT JOIN clients c ON e.client_id = c.id
    WHERE l.relationship IN ('self', 'child')
    AND l.depth < 5  -- Limit depth
)
SELECT DISTINCT * FROM lineage
ORDER BY depth;
$$ LANGUAGE sql STABLE;

-- Function to check if an engagement was cloned
CREATE OR REPLACE FUNCTION is_cloned_engagement(engagement_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM engagement_clones
        WHERE target_engagement_id = engagement_uuid
    );
$$ LANGUAGE sql STABLE;

-- Function to get clone count for an engagement
CREATE OR REPLACE FUNCTION get_clone_count(engagement_uuid UUID)
RETURNS INT AS $$
    SELECT COUNT(*)::INT FROM engagement_clones
    WHERE source_engagement_id = engagement_uuid;
$$ LANGUAGE sql STABLE;

-- -----------------------------------------------------------------------------
-- Trigger to update engagement metadata on clone
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_clone_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the target engagement's clone_metadata
    UPDATE engagements
    SET clone_metadata = jsonb_build_object(
        'cloned_from', NEW.source_engagement_id,
        'cloned_at', NEW.cloned_at,
        'cloned_by', NEW.cloned_by
    )
    WHERE id = NEW.target_engagement_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER engagement_clone_metadata_trigger
    AFTER INSERT ON engagement_clones
    FOR EACH ROW
    EXECUTE FUNCTION update_clone_metadata();

-- -----------------------------------------------------------------------------
-- Comments
-- -----------------------------------------------------------------------------

COMMENT ON TABLE engagement_clones IS 'Tracks clone relationships between engagements for lineage visualization';
COMMENT ON COLUMN engagement_clones.configuration IS 'JSON configuration used for the clone operation';
COMMENT ON COLUMN engagement_clones.summary IS 'Summary of what was cloned/cleared';
COMMENT ON FUNCTION get_clone_lineage IS 'Returns the full clone lineage tree for an engagement';

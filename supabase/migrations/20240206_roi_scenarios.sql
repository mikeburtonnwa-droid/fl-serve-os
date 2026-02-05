-- =============================================================================
-- Epic 6: ROI Intelligence (F6.3)
-- Migration: Create ROI scenarios table for saving and comparing scenarios
-- =============================================================================

-- Create roi_scenarios table to store saved scenarios
CREATE TABLE IF NOT EXISTS roi_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Input parameters
    inputs JSONB NOT NULL,

    -- Calculated results (cached for quick comparison)
    results JSONB NOT NULL,

    -- Flags
    is_recommended BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Limit 5 scenarios per engagement
    CONSTRAINT unique_scenario_name UNIQUE(engagement_id, name)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_roi_scenarios_engagement_id
    ON roi_scenarios(engagement_id);

CREATE INDEX IF NOT EXISTS idx_roi_scenarios_recommended
    ON roi_scenarios(engagement_id, is_recommended) WHERE is_recommended = TRUE;

-- Enable RLS on roi_scenarios
ALTER TABLE roi_scenarios ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view scenarios for engagements they have access to
CREATE POLICY "Users can view ROI scenarios"
    ON roi_scenarios
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM engagements e
            WHERE e.id = roi_scenarios.engagement_id
            -- Add your organization/team access logic here
        )
    );

-- RLS Policy: Users can create scenarios for engagements they have access to
CREATE POLICY "Users can create ROI scenarios"
    ON roi_scenarios
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM engagements e
            WHERE e.id = roi_scenarios.engagement_id
        )
    );

-- RLS Policy: Users can update scenarios they created
CREATE POLICY "Users can update ROI scenarios"
    ON roi_scenarios
    FOR UPDATE
    USING (
        auth.uid() = created_by
        OR EXISTS (
            SELECT 1 FROM engagements e
            WHERE e.id = roi_scenarios.engagement_id
        )
    );

-- RLS Policy: Users can delete scenarios they created
CREATE POLICY "Users can delete ROI scenarios"
    ON roi_scenarios
    FOR DELETE
    USING (
        auth.uid() = created_by
        OR EXISTS (
            SELECT 1 FROM engagements e
            WHERE e.id = roi_scenarios.engagement_id
        )
    );

-- Function to enforce max 5 scenarios per engagement
CREATE OR REPLACE FUNCTION check_scenario_limit()
RETURNS TRIGGER AS $$
DECLARE
    scenario_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO scenario_count
    FROM roi_scenarios
    WHERE engagement_id = NEW.engagement_id;

    IF scenario_count >= 5 THEN
        RAISE EXCEPTION 'Maximum of 5 scenarios allowed per engagement';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for scenario limit
DROP TRIGGER IF EXISTS enforce_scenario_limit ON roi_scenarios;
CREATE TRIGGER enforce_scenario_limit
    BEFORE INSERT ON roi_scenarios
    FOR EACH ROW
    EXECUTE FUNCTION check_scenario_limit();

-- Function to ensure only one recommended scenario per engagement
CREATE OR REPLACE FUNCTION ensure_single_recommended()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_recommended = TRUE THEN
        -- Clear other recommended flags for this engagement
        UPDATE roi_scenarios
        SET is_recommended = FALSE
        WHERE engagement_id = NEW.engagement_id
        AND id != NEW.id
        AND is_recommended = TRUE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for single recommended scenario
DROP TRIGGER IF EXISTS single_recommended_trigger ON roi_scenarios;
CREATE TRIGGER single_recommended_trigger
    AFTER INSERT OR UPDATE ON roi_scenarios
    FOR EACH ROW
    WHEN (NEW.is_recommended = TRUE)
    EXECUTE FUNCTION ensure_single_recommended();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_roi_scenario_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS roi_scenario_timestamp_trigger ON roi_scenarios;
CREATE TRIGGER roi_scenario_timestamp_trigger
    BEFORE UPDATE ON roi_scenarios
    FOR EACH ROW
    EXECUTE FUNCTION update_roi_scenario_timestamp();

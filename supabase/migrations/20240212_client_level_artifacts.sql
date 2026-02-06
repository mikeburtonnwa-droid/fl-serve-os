-- =============================================================================
-- Migration: Client-Level Artifacts Architecture
--
-- This migration restructures the data model so that:
-- - Client-level artifacts (Discovery Brief, Current State Map) belong to CLIENT
-- - Engagement-level artifacts (Future State, Implementation Plan, ROI) belong to ENGAGEMENT
-- - Station runs can operate at either client or engagement level
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Add client_id to artifacts table (for client-level artifacts)
-- -----------------------------------------------------------------------------
ALTER TABLE public.artifacts
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;

-- Make engagement_id nullable (artifact can belong to client OR engagement)
ALTER TABLE public.artifacts
ALTER COLUMN engagement_id DROP NOT NULL;

-- Add scope column to clearly indicate artifact ownership
ALTER TABLE public.artifacts
ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'engagement'
CHECK (scope IN ('client', 'engagement'));

-- Add constraint: must have either client_id OR engagement_id (not both, not neither)
ALTER TABLE public.artifacts
ADD CONSTRAINT artifact_ownership_check
CHECK (
  (client_id IS NOT NULL AND engagement_id IS NULL AND scope = 'client') OR
  (engagement_id IS NOT NULL AND client_id IS NULL AND scope = 'engagement')
);

-- Create index for client artifacts
CREATE INDEX IF NOT EXISTS idx_artifacts_client_id ON public.artifacts(client_id);

-- -----------------------------------------------------------------------------
-- 2. Add client_id to station_runs for client-level operations (S-01)
-- -----------------------------------------------------------------------------
ALTER TABLE public.station_runs
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;

-- Make engagement_id nullable for station_runs
ALTER TABLE public.station_runs
ALTER COLUMN engagement_id DROP NOT NULL;

-- Add scope column to station_runs
ALTER TABLE public.station_runs
ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'engagement'
CHECK (scope IN ('client', 'engagement'));

-- Add constraint for station run ownership
ALTER TABLE public.station_runs
ADD CONSTRAINT station_run_ownership_check
CHECK (
  (client_id IS NOT NULL AND engagement_id IS NULL AND scope = 'client') OR
  (engagement_id IS NOT NULL AND scope = 'engagement')
);

-- Note: engagement-level station runs can still reference client_id for context
-- The constraint allows engagement_id with optional client_id for engagement scope

-- Create index for client station runs
CREATE INDEX IF NOT EXISTS idx_station_runs_client_id ON public.station_runs(client_id);

-- -----------------------------------------------------------------------------
-- 3. Add intake assessment fields to clients table
-- -----------------------------------------------------------------------------
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS intake_score INTEGER CHECK (intake_score >= 0 AND intake_score <= 21);

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS intake_responses JSONB DEFAULT '{}';

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS intake_completed_at TIMESTAMPTZ;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS recommended_pathway TEXT CHECK (recommended_pathway IN ('knowledge_spine', 'roi_audit', 'workflow_sprint'));

-- -----------------------------------------------------------------------------
-- 4. Update RLS policies for new structure
-- -----------------------------------------------------------------------------

-- Artifacts: Allow access based on client_id or engagement_id
DROP POLICY IF EXISTS "Authenticated users can view artifacts" ON public.artifacts;
CREATE POLICY "Authenticated users can view artifacts" ON public.artifacts
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage artifacts" ON public.artifacts;
CREATE POLICY "Authenticated users can manage artifacts" ON public.artifacts
  FOR ALL USING (auth.role() = 'authenticated');

-- Station runs: Allow access based on client_id or engagement_id
DROP POLICY IF EXISTS "Authenticated users can view station_runs" ON public.station_runs;
CREATE POLICY "Authenticated users can view station_runs" ON public.station_runs
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage station_runs" ON public.station_runs;
CREATE POLICY "Authenticated users can manage station_runs" ON public.station_runs
  FOR ALL USING (auth.role() = 'authenticated');

-- -----------------------------------------------------------------------------
-- 5. Helper function to get client artifacts for an engagement
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_engagement_context(engagement_uuid UUID)
RETURNS TABLE (
  artifact_id UUID,
  template_id TEXT,
  name TEXT,
  content JSONB,
  scope TEXT,
  source TEXT -- 'client' or 'engagement'
) AS $$
BEGIN
  RETURN QUERY
  -- Get client-level artifacts
  SELECT
    a.id,
    a.template_id,
    a.name,
    a.content,
    a.scope,
    'client'::TEXT as source
  FROM artifacts a
  JOIN engagements e ON e.client_id = a.client_id
  WHERE e.id = engagement_uuid
    AND a.scope = 'client'
    AND a.status != 'archived'

  UNION ALL

  -- Get engagement-level artifacts
  SELECT
    a.id,
    a.template_id,
    a.name,
    a.content,
    a.scope,
    'engagement'::TEXT as source
  FROM artifacts a
  WHERE a.engagement_id = engagement_uuid
    AND a.scope = 'engagement'
    AND a.status != 'archived'

  ORDER BY template_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- -----------------------------------------------------------------------------
-- 6. Comments for documentation
-- -----------------------------------------------------------------------------
COMMENT ON COLUMN public.artifacts.client_id IS 'For client-level artifacts (TPL-01, TPL-02)';
COMMENT ON COLUMN public.artifacts.scope IS 'Whether artifact belongs to client or engagement';
COMMENT ON COLUMN public.station_runs.client_id IS 'For client-level station runs (S-01)';
COMMENT ON COLUMN public.station_runs.scope IS 'Whether station run is client-level or engagement-level';
COMMENT ON COLUMN public.clients.intake_score IS 'AI readiness assessment score (0-21)';
COMMENT ON COLUMN public.clients.intake_responses IS 'Detailed intake assessment responses';
COMMENT ON COLUMN public.clients.recommended_pathway IS 'AI-recommended engagement pathway based on intake';

COMMENT ON FUNCTION get_engagement_context IS 'Returns all artifacts (client + engagement level) for a given engagement';

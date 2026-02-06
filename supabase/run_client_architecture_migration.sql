-- =============================================================================
-- SERVE OS: Client-Level Architecture Migration
--
-- Run this COMPLETE script in Supabase SQL Editor
-- It combines both schema and data migrations in the correct order
-- =============================================================================

-- =============================================================================
-- PART 1: SCHEMA CHANGES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1.1 Add client_id to artifacts table (for client-level artifacts)
-- -----------------------------------------------------------------------------
ALTER TABLE public.artifacts
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;

-- Make engagement_id nullable (artifact can belong to client OR engagement)
ALTER TABLE public.artifacts
ALTER COLUMN engagement_id DROP NOT NULL;

-- Add scope column to clearly indicate artifact ownership
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'artifacts' AND column_name = 'scope') THEN
    ALTER TABLE public.artifacts ADD COLUMN scope TEXT DEFAULT 'engagement';
  END IF;
END $$;

-- Add source_station column if not exists
ALTER TABLE public.artifacts
ADD COLUMN IF NOT EXISTS source_station TEXT;

-- Create index for client artifacts
CREATE INDEX IF NOT EXISTS idx_artifacts_client_id ON public.artifacts(client_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_scope ON public.artifacts(scope);

-- -----------------------------------------------------------------------------
-- 1.2 Add client_id to station_runs for client-level operations (S-01)
-- -----------------------------------------------------------------------------
ALTER TABLE public.station_runs
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;

-- Make engagement_id nullable for station_runs
ALTER TABLE public.station_runs
ALTER COLUMN engagement_id DROP NOT NULL;

-- Add scope column to station_runs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'station_runs' AND column_name = 'scope') THEN
    ALTER TABLE public.station_runs ADD COLUMN scope TEXT DEFAULT 'engagement';
  END IF;
END $$;

-- Add created_by column if not exists
ALTER TABLE public.station_runs
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id);

-- Create index for client station runs
CREATE INDEX IF NOT EXISTS idx_station_runs_client_id ON public.station_runs(client_id);
CREATE INDEX IF NOT EXISTS idx_station_runs_scope ON public.station_runs(scope);

-- -----------------------------------------------------------------------------
-- 1.3 Add intake assessment fields to clients table
-- -----------------------------------------------------------------------------
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS intake_score INTEGER CHECK (intake_score >= 0 AND intake_score <= 21);

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS intake_responses JSONB DEFAULT '{}';

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS intake_completed_at TIMESTAMPTZ;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS recommended_pathway TEXT;

-- -----------------------------------------------------------------------------
-- 1.4 Add 'superseded' status to station_runs if not exists
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE station_runs DROP CONSTRAINT IF EXISTS station_runs_status_check;
  ALTER TABLE station_runs ADD CONSTRAINT station_runs_status_check
    CHECK (status IN ('queued', 'running', 'awaiting_approval', 'approved', 'rejected', 'complete', 'failed', 'superseded'));
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- =============================================================================
-- PART 2: DATA MIGRATION
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 2.1 Migrate intake score from engagements to clients
-- -----------------------------------------------------------------------------
WITH latest_intake AS (
  SELECT DISTINCT ON (client_id)
    client_id,
    intake_score
  FROM engagements
  WHERE intake_score IS NOT NULL
  ORDER BY client_id, created_at DESC
)
UPDATE clients c
SET
  intake_score = li.intake_score,
  intake_completed_at = NOW()
FROM latest_intake li
WHERE c.id = li.client_id
  AND c.intake_score IS NULL;

-- -----------------------------------------------------------------------------
-- 2.2 Migrate TPL-01 (Discovery Brief) to client level
-- -----------------------------------------------------------------------------
UPDATE artifacts a
SET
  client_id = e.client_id,
  scope = 'client',
  engagement_id = NULL
FROM engagements e
WHERE a.engagement_id = e.id
  AND a.template_id = 'TPL-01'
  AND a.client_id IS NULL;

-- -----------------------------------------------------------------------------
-- 2.3 Migrate TPL-02 (Current State Map) to client level
-- -----------------------------------------------------------------------------
UPDATE artifacts a
SET
  client_id = e.client_id,
  scope = 'client',
  engagement_id = NULL
FROM engagements e
WHERE a.engagement_id = e.id
  AND a.template_id = 'TPL-02'
  AND a.client_id IS NULL;

-- -----------------------------------------------------------------------------
-- 2.4 Set scope for engagement-level artifacts
-- -----------------------------------------------------------------------------
UPDATE artifacts
SET scope = 'engagement'
WHERE template_id IN ('TPL-03', 'TPL-05', 'TPL-09', 'TPL-10', 'TPL-12')
  AND engagement_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 2.5 Migrate S-01 runs to client level
-- -----------------------------------------------------------------------------
UPDATE station_runs sr
SET
  client_id = e.client_id,
  scope = 'client'
FROM engagements e
WHERE sr.engagement_id = e.id
  AND sr.station_id = 'S-01'
  AND sr.client_id IS NULL;

-- -----------------------------------------------------------------------------
-- 2.6 Set scope for S-02, S-03 runs
-- -----------------------------------------------------------------------------
UPDATE station_runs sr
SET
  scope = 'engagement',
  client_id = e.client_id
FROM engagements e
WHERE sr.engagement_id = e.id
  AND sr.station_id IN ('S-02', 'S-03');

-- -----------------------------------------------------------------------------
-- 2.7 Mark duplicate S-01 runs as superseded (keep only latest per client)
-- -----------------------------------------------------------------------------
WITH runs_to_keep AS (
  SELECT DISTINCT ON (client_id, station_id)
    id
  FROM station_runs
  WHERE station_id = 'S-01'
    AND status IN ('complete', 'approved')
  ORDER BY client_id, station_id, created_at DESC
)
UPDATE station_runs
SET status = 'superseded'
WHERE station_id = 'S-01'
  AND status IN ('complete', 'approved')
  AND id NOT IN (SELECT id FROM runs_to_keep);

-- -----------------------------------------------------------------------------
-- 2.8 Archive duplicate client artifacts (keep latest)
-- -----------------------------------------------------------------------------
WITH ranked_artifacts AS (
  SELECT
    id,
    client_id,
    template_id,
    ROW_NUMBER() OVER (
      PARTITION BY client_id, template_id
      ORDER BY
        CASE WHEN status = 'approved' THEN 0 ELSE 1 END,
        updated_at DESC
    ) as rn
  FROM artifacts
  WHERE client_id IS NOT NULL
    AND template_id IN ('TPL-01', 'TPL-02')
)
UPDATE artifacts a
SET status = 'archived'
FROM ranked_artifacts ra
WHERE a.id = ra.id
  AND ra.rn > 1;

-- -----------------------------------------------------------------------------
-- 2.9 Set recommended pathway based on intake score
-- -----------------------------------------------------------------------------
UPDATE clients
SET recommended_pathway =
  CASE
    WHEN intake_score >= 15 THEN 'workflow_sprint'
    WHEN intake_score >= 10 THEN 'roi_audit'
    ELSE 'knowledge_spine'
  END
WHERE intake_score IS NOT NULL
  AND recommended_pathway IS NULL;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT 'Migration complete!' as status;

-- Show summary
SELECT
  'Clients with intake data' as metric,
  COUNT(*) as count
FROM clients WHERE intake_score IS NOT NULL
UNION ALL
SELECT
  'Client-level artifacts' as metric,
  COUNT(*) as count
FROM artifacts WHERE scope = 'client'
UNION ALL
SELECT
  'Engagement-level artifacts' as metric,
  COUNT(*) as count
FROM artifacts WHERE scope = 'engagement'
UNION ALL
SELECT
  'Client-level station runs' as metric,
  COUNT(*) as count
FROM station_runs WHERE scope = 'client' AND status != 'superseded'
UNION ALL
SELECT
  'Superseded (duplicate) runs' as metric,
  COUNT(*) as count
FROM station_runs WHERE status = 'superseded';

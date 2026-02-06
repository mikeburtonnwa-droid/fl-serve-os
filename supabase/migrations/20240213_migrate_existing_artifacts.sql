-- =============================================================================
-- Migration: Migrate Existing Artifacts to Client-Level Architecture
--
-- This migration:
-- 1. Moves TPL-01 (Discovery Brief) and TPL-02 (Current State Map) to client level
-- 2. Migrates intake assessment data from engagements to clients
-- 3. Updates station runs to reflect proper scope
-- 4. Cleans up duplicate station runs from earlier UX bug
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Migrate intake assessment data from engagements to clients
-- For each client, use the most recent engagement's intake data
-- Note: engagements table only has intake_score, not intake_responses
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
-- STEP 2: Migrate TPL-01 (Discovery Brief) artifacts to client level
-- These describe the client's business, not a specific engagement
-- -----------------------------------------------------------------------------

-- First, add client_id to TPL-01 artifacts based on their engagement's client
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
-- STEP 3: Migrate TPL-02 (Current State Map) artifacts to client level
-- These document the client's processes, not engagement-specific
-- -----------------------------------------------------------------------------

-- Add client_id to TPL-02 artifacts
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
-- STEP 4: Ensure all engagement-level artifacts have correct scope
-- TPL-03, TPL-05, TPL-09, TPL-10, TPL-12 remain at engagement level
-- -----------------------------------------------------------------------------
UPDATE artifacts
SET scope = 'engagement'
WHERE template_id IN ('TPL-03', 'TPL-05', 'TPL-09', 'TPL-10', 'TPL-12')
  AND scope IS NULL OR scope != 'engagement';

-- -----------------------------------------------------------------------------
-- STEP 5: Migrate S-01 station runs to client level
-- Discovery Station operates on client data, not engagement-specific
-- -----------------------------------------------------------------------------

-- Add client_id to S-01 runs and mark as client-scope
UPDATE station_runs sr
SET
  client_id = e.client_id,
  scope = 'client'
FROM engagements e
WHERE sr.engagement_id = e.id
  AND sr.station_id = 'S-01'
  AND sr.client_id IS NULL;

-- -----------------------------------------------------------------------------
-- STEP 6: Mark S-02 and S-03 runs as engagement-scope
-- These operate on engagement-specific deliverables
-- -----------------------------------------------------------------------------
UPDATE station_runs sr
SET
  scope = 'engagement',
  client_id = e.client_id  -- Also populate client_id for reference
FROM engagements e
WHERE sr.engagement_id = e.id
  AND sr.station_id IN ('S-02', 'S-03')
  AND (sr.scope IS NULL OR sr.scope != 'engagement');

-- -----------------------------------------------------------------------------
-- STEP 7: Clean up duplicate S-01 runs per client (keep only the latest)
-- This addresses the duplicate run issue from the earlier UX bug
-- -----------------------------------------------------------------------------

-- Create temp table of runs to keep (latest successful run per client)
CREATE TEMP TABLE runs_to_keep AS
SELECT DISTINCT ON (client_id, station_id)
  id
FROM station_runs
WHERE station_id = 'S-01'
  AND status IN ('complete', 'approved')
ORDER BY client_id, station_id, created_at DESC;

-- Mark old duplicate runs as 'superseded' instead of deleting
-- (preserves history but makes it clear they're not active)
UPDATE station_runs
SET status = 'superseded'
WHERE station_id = 'S-01'
  AND status IN ('complete', 'approved')
  AND id NOT IN (SELECT id FROM runs_to_keep);

-- Add 'superseded' to the status check constraint if not exists
-- (This allows us to mark old runs without deleting them)
DO $$
BEGIN
  ALTER TABLE station_runs DROP CONSTRAINT IF EXISTS station_runs_status_check;
  ALTER TABLE station_runs ADD CONSTRAINT station_runs_status_check
    CHECK (status IN ('queued', 'running', 'awaiting_approval', 'approved', 'rejected', 'complete', 'failed', 'superseded'));
EXCEPTION
  WHEN others THEN NULL;
END $$;

DROP TABLE IF EXISTS runs_to_keep;

-- -----------------------------------------------------------------------------
-- STEP 8: Handle duplicate client-level artifacts
-- If multiple TPL-01 or TPL-02 exist for a client, keep the latest approved
-- or the latest overall if none are approved
-- -----------------------------------------------------------------------------

-- Mark duplicate client artifacts as archived (keep latest)
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
-- STEP 9: Create recommended pathway for clients based on their intake
-- -----------------------------------------------------------------------------
UPDATE clients
SET recommended_pathway =
  CASE
    WHEN intake_score >= 15 THEN 'workflow_sprint'  -- High readiness: full implementation
    WHEN intake_score >= 10 THEN 'roi_audit'        -- Medium: prove value first
    ELSE 'knowledge_spine'                           -- Low: start with documentation
  END
WHERE intake_score IS NOT NULL
  AND recommended_pathway IS NULL;

-- -----------------------------------------------------------------------------
-- VERIFICATION QUERIES (run these to confirm migration success)
-- -----------------------------------------------------------------------------

-- Check client-level artifacts
-- SELECT c.name, a.template_id, a.name as artifact_name, a.scope
-- FROM artifacts a
-- JOIN clients c ON a.client_id = c.id
-- WHERE a.scope = 'client'
-- ORDER BY c.name, a.template_id;

-- Check engagement-level artifacts
-- SELECT e.name as engagement, a.template_id, a.name as artifact_name, a.scope
-- FROM artifacts a
-- JOIN engagements e ON a.engagement_id = e.id
-- WHERE a.scope = 'engagement'
-- ORDER BY e.name, a.template_id;

-- Check station runs by scope
-- SELECT sr.station_id, sr.scope, COUNT(*)
-- FROM station_runs sr
-- WHERE sr.status NOT IN ('superseded', 'failed')
-- GROUP BY sr.station_id, sr.scope;

-- Check clients with intake data
-- SELECT name, intake_score, recommended_pathway
-- FROM clients
-- WHERE intake_score IS NOT NULL;

SELECT 'Migration complete. Client-level artifact architecture is now active.' as status;

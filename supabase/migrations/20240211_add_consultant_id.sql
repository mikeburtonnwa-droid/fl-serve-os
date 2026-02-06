-- =============================================================================
-- Migration: Add consultant_id column to engagements table
--
-- This migration adds the consultant_id column that was missing from the base
-- schema but referenced by Epic 7, 9, and 10 migrations.
-- =============================================================================

-- Add consultant_id column to engagements if it doesn't exist
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS consultant_id UUID REFERENCES users(id);

-- Create index for consultant lookups
CREATE INDEX IF NOT EXISTS idx_engagements_consultant_id ON engagements(consultant_id);

-- Optionally backfill consultant_id from created_by for existing engagements
-- Uncomment if you want existing engagements to have the creator as consultant
-- UPDATE engagements SET consultant_id = created_by WHERE consultant_id IS NULL;

COMMENT ON COLUMN engagements.consultant_id IS 'The primary consultant assigned to this engagement';

-- Phase 3 Migration: Add created_by column to station_runs table

-- Add created_by column to station_runs if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'station_runs' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE station_runs ADD COLUMN created_by UUID REFERENCES users(id);
  END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_station_runs_engagement_id ON station_runs(engagement_id);
CREATE INDEX IF NOT EXISTS idx_station_runs_status ON station_runs(status);
CREATE INDEX IF NOT EXISTS idx_artifacts_engagement_id ON artifacts(engagement_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_status ON artifacts(status);

-- Update RLS policies for station_runs to allow insert
DROP POLICY IF EXISTS "Users can create station runs" ON station_runs;
CREATE POLICY "Users can create station runs" ON station_runs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their station runs" ON station_runs;
CREATE POLICY "Users can update their station runs" ON station_runs
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Update RLS policies for artifacts
DROP POLICY IF EXISTS "Users can create artifacts" ON artifacts;
CREATE POLICY "Users can create artifacts" ON artifacts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update artifacts" ON artifacts;
CREATE POLICY "Users can update artifacts" ON artifacts
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Ensure approvals table has proper policies
DROP POLICY IF EXISTS "Users can create approvals" ON approvals;
CREATE POLICY "Users can create approvals" ON approvals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

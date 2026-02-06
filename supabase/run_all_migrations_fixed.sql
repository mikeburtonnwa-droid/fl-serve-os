-- =============================================================================
-- SERVE OS - Complete Migrations Script (FIXED)
-- Run this in Supabase SQL Editor to apply all migrations
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Migration 1: Add consultant_id column (20240211)
-- -----------------------------------------------------------------------------

ALTER TABLE engagements ADD COLUMN IF NOT EXISTS consultant_id UUID REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_engagements_consultant_id ON engagements(consultant_id);
COMMENT ON COLUMN engagements.consultant_id IS 'The primary consultant assigned to this engagement';

-- -----------------------------------------------------------------------------
-- Migration 2: Phase 3 - Station runs updates
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'station_runs' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE station_runs ADD COLUMN created_by UUID REFERENCES users(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_station_runs_engagement_id ON station_runs(engagement_id);
CREATE INDEX IF NOT EXISTS idx_station_runs_status ON station_runs(status);
CREATE INDEX IF NOT EXISTS idx_artifacts_engagement_id ON artifacts(engagement_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_status ON artifacts(status);

DROP POLICY IF EXISTS "Users can create station runs" ON station_runs;
CREATE POLICY "Users can create station runs" ON station_runs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their station runs" ON station_runs;
CREATE POLICY "Users can update their station runs" ON station_runs
  FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can create artifacts" ON artifacts;
CREATE POLICY "Users can create artifacts" ON artifacts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update artifacts" ON artifacts;
CREATE POLICY "Users can update artifacts" ON artifacts
  FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can create approvals" ON approvals;
CREATE POLICY "Users can create approvals" ON approvals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- -----------------------------------------------------------------------------
-- Migration 3: Artifact Versions (Epic 5: F5.1-F5.5)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS artifact_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content JSONB NOT NULL,
    name VARCHAR(255) NOT NULL,
    change_summary TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(artifact_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_artifact_versions_artifact_id ON artifact_versions(artifact_id);
CREATE INDEX IF NOT EXISTS idx_artifact_versions_created_at ON artifact_versions(artifact_id, created_at DESC);

ALTER TABLE artifacts
    ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_artifacts_locked_by ON artifacts(locked_by) WHERE locked_by IS NOT NULL;

ALTER TABLE artifact_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view artifact versions" ON artifact_versions;
CREATE POLICY "Users can view artifact versions"
    ON artifact_versions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM artifacts a
            JOIN engagements e ON a.engagement_id = e.id
            WHERE a.id = artifact_versions.artifact_id
        )
    );

DROP POLICY IF EXISTS "Users can create artifact versions" ON artifact_versions;
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

CREATE OR REPLACE FUNCTION create_artifact_version()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.content IS DISTINCT FROM NEW.content OR OLD.name IS DISTINCT FROM NEW.name THEN
        INSERT INTO artifact_versions (
            artifact_id, version_number, content, name, created_by, change_summary
        ) VALUES (
            NEW.id, NEW.version, OLD.content, OLD.name, NEW.last_edited_by, 'Auto-saved version before edit'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS artifact_version_trigger ON artifacts;
CREATE TRIGGER artifact_version_trigger
    BEFORE UPDATE ON artifacts
    FOR EACH ROW
    WHEN (OLD.content IS DISTINCT FROM NEW.content OR OLD.name IS DISTINCT FROM NEW.name)
    EXECUTE FUNCTION create_artifact_version();

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
    SELECT a.locked_by, a.locked_at INTO v_current_lock_by, v_current_lock_at
    FROM artifacts a WHERE a.id = p_artifact_id;

    v_lock_expired := v_current_lock_at IS NULL
        OR v_current_lock_at < NOW() - (p_lock_timeout_minutes || ' minutes')::INTERVAL;

    IF v_current_lock_by IS NULL OR v_lock_expired OR v_current_lock_by = p_user_id THEN
        UPDATE artifacts SET locked_by = p_user_id, locked_at = NOW() WHERE id = p_artifact_id;
        RETURN QUERY SELECT TRUE, p_user_id, NOW(), NULL::TEXT;
    ELSE
        RETURN QUERY SELECT FALSE, v_current_lock_by, v_current_lock_at,
            (SELECT email FROM auth.users WHERE id = v_current_lock_by);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION release_artifact_lock(p_artifact_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE artifacts SET locked_by = NULL, locked_at = NULL
    WHERE id = p_artifact_id AND (locked_by = p_user_id OR locked_by IS NULL);
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
        a.version, a.last_edited_by, u.email, a.last_edited_at
    FROM artifacts a
    LEFT JOIN auth.users u ON a.last_edited_by = u.id
    WHERE a.id = p_artifact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION acquire_artifact_lock TO authenticated;
GRANT EXECUTE ON FUNCTION release_artifact_lock TO authenticated;
GRANT EXECUTE ON FUNCTION check_concurrent_edit TO authenticated;

-- -----------------------------------------------------------------------------
-- Migration 4: ROI Scenarios (Epic 6: F6.3)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS roi_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    inputs JSONB NOT NULL,
    results JSONB NOT NULL,
    is_recommended BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_scenario_name UNIQUE(engagement_id, name)
);

CREATE INDEX IF NOT EXISTS idx_roi_scenarios_engagement_id ON roi_scenarios(engagement_id);
CREATE INDEX IF NOT EXISTS idx_roi_scenarios_recommended ON roi_scenarios(engagement_id, is_recommended) WHERE is_recommended = TRUE;

ALTER TABLE roi_scenarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view ROI scenarios" ON roi_scenarios;
CREATE POLICY "Users can view ROI scenarios" ON roi_scenarios
    FOR SELECT USING (EXISTS (SELECT 1 FROM engagements e WHERE e.id = roi_scenarios.engagement_id));

DROP POLICY IF EXISTS "Users can create ROI scenarios" ON roi_scenarios;
CREATE POLICY "Users can create ROI scenarios" ON roi_scenarios
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM engagements e WHERE e.id = roi_scenarios.engagement_id));

DROP POLICY IF EXISTS "Users can update ROI scenarios" ON roi_scenarios;
CREATE POLICY "Users can update ROI scenarios" ON roi_scenarios
    FOR UPDATE USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM engagements e WHERE e.id = roi_scenarios.engagement_id));

DROP POLICY IF EXISTS "Users can delete ROI scenarios" ON roi_scenarios;
CREATE POLICY "Users can delete ROI scenarios" ON roi_scenarios
    FOR DELETE USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM engagements e WHERE e.id = roi_scenarios.engagement_id));

CREATE OR REPLACE FUNCTION check_scenario_limit()
RETURNS TRIGGER AS $$
DECLARE scenario_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO scenario_count FROM roi_scenarios WHERE engagement_id = NEW.engagement_id;
    IF scenario_count >= 5 THEN
        RAISE EXCEPTION 'Maximum of 5 scenarios allowed per engagement';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_scenario_limit ON roi_scenarios;
CREATE TRIGGER enforce_scenario_limit
    BEFORE INSERT ON roi_scenarios FOR EACH ROW EXECUTE FUNCTION check_scenario_limit();

CREATE OR REPLACE FUNCTION ensure_single_recommended()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_recommended = TRUE THEN
        UPDATE roi_scenarios SET is_recommended = FALSE
        WHERE engagement_id = NEW.engagement_id AND id != NEW.id AND is_recommended = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS single_recommended_trigger ON roi_scenarios;
CREATE TRIGGER single_recommended_trigger
    AFTER INSERT OR UPDATE ON roi_scenarios FOR EACH ROW
    WHEN (NEW.is_recommended = TRUE) EXECUTE FUNCTION ensure_single_recommended();

CREATE OR REPLACE FUNCTION update_roi_scenario_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS roi_scenario_timestamp_trigger ON roi_scenarios;
CREATE TRIGGER roi_scenario_timestamp_trigger
    BEFORE UPDATE ON roi_scenarios FOR EACH ROW EXECUTE FUNCTION update_roi_scenario_timestamp();

-- -----------------------------------------------------------------------------
-- Migration 5: Intake Assessments (Epic 7: F7.1-F7.4)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS intake_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '[]',
  scores JSONB,
  recommended_pathway TEXT CHECK (recommended_pathway IN ('accelerated', 'standard', 'extended')),
  pathway_override TEXT CHECK (pathway_override IN ('accelerated', 'standard', 'extended')),
  override_justification TEXT,
  override_by UUID REFERENCES auth.users(id),
  override_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'reviewed')),
  completed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(engagement_id)
);

CREATE TABLE IF NOT EXISTS intake_question_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  weight INTEGER NOT NULL DEFAULT 3 CHECK (weight >= 1 AND weight <= 5),
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS intake_category_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL UNIQUE,
  weight DECIMAL(3,2) NOT NULL DEFAULT 1.0 CHECK (weight >= 0.1 AND weight <= 2.0),
  display_name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO intake_category_weights (category, weight, display_name, description, display_order)
VALUES
  ('data_readiness', 1.2, 'Data Readiness', 'Quality and accessibility of existing data', 1),
  ('process_maturity', 1.0, 'Process Maturity', 'Current process documentation and standardization', 2),
  ('technical_infrastructure', 1.1, 'Technical Infrastructure', 'Systems and integration capabilities', 3),
  ('organizational_readiness', 1.0, 'Organizational Readiness', 'Team capacity and change management', 4),
  ('stakeholder_alignment', 0.9, 'Stakeholder Alignment', 'Leadership support and communication', 5)
ON CONFLICT (category) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_intake_assessments_engagement ON intake_assessments(engagement_id);
CREATE INDEX IF NOT EXISTS idx_intake_assessments_status ON intake_assessments(status);
CREATE INDEX IF NOT EXISTS idx_intake_question_weights_category ON intake_question_weights(category);

ALTER TABLE intake_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_question_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_category_weights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view assessments for their engagements" ON intake_assessments;
CREATE POLICY "Users can view assessments for their engagements"
  ON intake_assessments FOR SELECT
  USING (
    engagement_id IN (
      SELECT id FROM engagements
      WHERE consultant_id = auth.uid() OR client_id IN (
        SELECT id FROM clients WHERE created_by = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Consultants can manage assessments for their engagements" ON intake_assessments;
CREATE POLICY "Consultants can manage assessments for their engagements"
  ON intake_assessments FOR ALL
  USING (engagement_id IN (SELECT id FROM engagements WHERE consultant_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can view question weights" ON intake_question_weights;
CREATE POLICY "Anyone can view question weights"
  ON intake_question_weights FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only admins can modify question weights" ON intake_question_weights;
CREATE POLICY "Only admins can modify question weights"
  ON intake_question_weights FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Anyone can view category weights" ON intake_category_weights;
CREATE POLICY "Anyone can view category weights"
  ON intake_category_weights FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only admins can modify category weights" ON intake_category_weights;
CREATE POLICY "Only admins can modify category weights"
  ON intake_category_weights FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE OR REPLACE FUNCTION update_intake_assessment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS intake_assessment_timestamp_trigger ON intake_assessments;
CREATE TRIGGER intake_assessment_timestamp_trigger
  BEFORE UPDATE ON intake_assessments FOR EACH ROW EXECUTE FUNCTION update_intake_assessment_timestamp();

CREATE OR REPLACE FUNCTION update_weight_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS question_weight_timestamp_trigger ON intake_question_weights;
CREATE TRIGGER question_weight_timestamp_trigger
  BEFORE UPDATE ON intake_question_weights FOR EACH ROW EXECUTE FUNCTION update_weight_timestamp();

DROP TRIGGER IF EXISTS category_weight_timestamp_trigger ON intake_category_weights;
CREATE TRIGGER category_weight_timestamp_trigger
  BEFORE UPDATE ON intake_category_weights FOR EACH ROW EXECUTE FUNCTION update_weight_timestamp();

CREATE OR REPLACE FUNCTION get_assessment_summary(p_engagement_id UUID)
RETURNS TABLE (
  assessment_id UUID,
  status TEXT,
  overall_score INTEGER,
  recommended_pathway TEXT,
  effective_pathway TEXT,
  completion_percentage INTEGER,
  risk_level TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT ia.id, ia.status, (ia.scores->>'overallScore')::INTEGER,
    ia.recommended_pathway, COALESCE(ia.pathway_override, ia.recommended_pathway),
    (ia.scores->>'completionPercentage')::INTEGER, ia.scores->'riskProfile'->>'level'
  FROM intake_assessments ia WHERE ia.engagement_id = p_engagement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- Migration 6: Templates (Epic 8: F8.1-F8.4)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('assessment', 'proposal', 'report', 'presentation', 'plan', 'checklist', 'other')),
  content TEXT NOT NULL,
  content_format TEXT NOT NULL DEFAULT 'markdown' CHECK (content_format IN ('markdown', 'html', 'json')),
  source TEXT NOT NULL DEFAULT 'user' CHECK (source IN ('system', 'user', 'community')),
  created_by UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  is_anonymized BOOLEAN NOT NULL DEFAULT false,
  original_artifact_id UUID REFERENCES artifacts(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  industry TEXT,
  use_case TEXT,
  usage_count INTEGER NOT NULL DEFAULT 0,
  rating DECIMAL(2,1),
  rating_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS template_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
  artifact_id UUID REFERENCES artifacts(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS template_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(template_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_source ON templates(source);
CREATE INDEX IF NOT EXISTS idx_templates_status ON templates(status);
CREATE INDEX IF NOT EXISTS idx_templates_tags ON templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_templates_search ON templates USING GIN(to_tsvector('english', name || ' ' || description));
CREATE INDEX IF NOT EXISTS idx_template_usages_template ON template_usages(template_id);
CREATE INDEX IF NOT EXISTS idx_template_usages_user ON template_usages(user_id);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published templates" ON templates;
CREATE POLICY "Anyone can view published templates" ON templates
  FOR SELECT USING (status = 'published' OR created_by = auth.uid());

DROP POLICY IF EXISTS "Users can create templates" ON templates;
CREATE POLICY "Users can create templates" ON templates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own templates" ON templates;
CREATE POLICY "Users can update their own templates" ON templates
  FOR UPDATE USING (created_by = auth.uid() OR source = 'system');

DROP POLICY IF EXISTS "Users can delete their own templates" ON templates;
CREATE POLICY "Users can delete their own templates" ON templates
  FOR DELETE USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can view their own usage" ON template_usages;
CREATE POLICY "Users can view their own usage" ON template_usages
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create usage records" ON template_usages;
CREATE POLICY "Users can create usage records" ON template_usages
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view ratings" ON template_ratings;
CREATE POLICY "Anyone can view ratings" ON template_ratings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can rate templates" ON template_ratings;
CREATE POLICY "Users can rate templates" ON template_ratings
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their ratings" ON template_ratings;
CREATE POLICY "Users can update their ratings" ON template_ratings
  FOR UPDATE USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION update_template_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE templates SET usage_count = usage_count + 1 WHERE id = NEW.template_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS template_usage_count_trigger ON template_usages;
CREATE TRIGGER template_usage_count_trigger
  AFTER INSERT ON template_usages FOR EACH ROW EXECUTE FUNCTION update_template_usage_count();

CREATE OR REPLACE FUNCTION update_template_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE templates SET
    rating = (SELECT AVG(rating) FROM template_ratings WHERE template_id = NEW.template_id),
    rating_count = (SELECT COUNT(*) FROM template_ratings WHERE template_id = NEW.template_id)
  WHERE id = NEW.template_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS template_rating_trigger ON template_ratings;
CREATE TRIGGER template_rating_trigger
  AFTER INSERT OR UPDATE ON template_ratings FOR EACH ROW EXECUTE FUNCTION update_template_rating();

CREATE OR REPLACE FUNCTION update_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS template_timestamp_trigger ON templates;
CREATE TRIGGER template_timestamp_trigger
  BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_template_timestamp();

INSERT INTO templates (name, description, category, content, content_format, source, is_anonymized, tags, industry, use_case, status)
VALUES
  ('AI Readiness Assessment', 'Comprehensive assessment template for evaluating an organizations readiness for AI implementation.', 'assessment', '# AI Readiness Assessment', 'markdown', 'system', true, ARRAY['assessment', 'ai-readiness', 'foundation'], 'general', 'Initial client assessment', 'published'),
  ('Process Automation Opportunity Assessment', 'Template for identifying and prioritizing automation opportunities within an organization.', 'assessment', '# Process Automation Opportunity Assessment', 'markdown', 'system', true, ARRAY['assessment', 'automation', 'process'], 'general', 'Process improvement', 'published'),
  ('AI Implementation Proposal', 'Standard proposal template for AI/automation implementation engagements.', 'proposal', '# AI Implementation Proposal', 'markdown', 'system', true, ARRAY['proposal', 'ai', 'implementation'], 'general', 'Client proposals', 'published'),
  ('Monthly Engagement Status Report', 'Standard template for monthly client engagement status updates.', 'report', '# Monthly Status Report', 'markdown', 'system', true, ARRAY['report', 'status', 'monthly'], 'general', 'Client reporting', 'published'),
  ('Implementation Project Plan', 'Detailed project plan template for AI/automation implementations.', 'plan', '# Implementation Project Plan', 'markdown', 'system', true, ARRAY['plan', 'project', 'implementation'], 'general', 'Project planning', 'published'),
  ('Go-Live Readiness Checklist', 'Pre-deployment checklist to ensure all requirements are met before go-live.', 'checklist', '# Go-Live Readiness Checklist', 'markdown', 'system', true, ARRAY['checklist', 'go-live', 'deployment'], 'general', 'Deployment preparation', 'published')
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION search_templates(
  search_query TEXT DEFAULT NULL,
  filter_category TEXT DEFAULT NULL,
  filter_source TEXT DEFAULT NULL,
  filter_tags TEXT[] DEFAULT NULL,
  page_num INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID, name TEXT, description TEXT, category TEXT, content_preview TEXT,
  source TEXT, tags TEXT[], industry TEXT, use_case TEXT, usage_count INTEGER,
  rating DECIMAL, rating_count INTEGER, status TEXT, created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.name, t.description, t.category, LEFT(t.content, 500),
    t.source, t.tags, t.industry, t.use_case, t.usage_count, t.rating, t.rating_count, t.status, t.created_at
  FROM templates t
  WHERE t.status = 'published'
    AND (search_query IS NULL OR to_tsvector('english', t.name || ' ' || t.description) @@ plainto_tsquery('english', search_query))
    AND (filter_category IS NULL OR t.category = filter_category)
    AND (filter_source IS NULL OR t.source = filter_source)
    AND (filter_tags IS NULL OR t.tags && filter_tags)
  ORDER BY t.usage_count DESC, t.rating DESC NULLS LAST, t.created_at DESC
  LIMIT page_size OFFSET (page_num - 1) * page_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- Migration 7: Engagement Cloning (Epic 9: F9.1-F9.4)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS engagement_clones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    target_engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    cloned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cloned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes TEXT,
    CONSTRAINT unique_clone_pair UNIQUE (source_engagement_id, target_engagement_id),
    CONSTRAINT no_self_clone CHECK (source_engagement_id != target_engagement_id)
);

CREATE INDEX IF NOT EXISTS idx_engagement_clones_source ON engagement_clones(source_engagement_id);
CREATE INDEX IF NOT EXISTS idx_engagement_clones_target ON engagement_clones(target_engagement_id);
CREATE INDEX IF NOT EXISTS idx_engagement_clones_cloned_by ON engagement_clones(cloned_by);
CREATE INDEX IF NOT EXISTS idx_engagement_clones_cloned_at ON engagement_clones(cloned_at DESC);

ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS cloned_from_id UUID REFERENCES artifacts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_artifacts_cloned_from ON artifacts(cloned_from_id);

ALTER TABLE engagements ADD COLUMN IF NOT EXISTS clone_metadata JSONB DEFAULT NULL;

ALTER TABLE engagement_clones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view relevant clone records" ON engagement_clones;
CREATE POLICY "Users can view relevant clone records"
    ON engagement_clones FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM engagements e
        WHERE (e.id = source_engagement_id OR e.id = target_engagement_id)
        AND (e.created_by = auth.uid() OR e.consultant_id = auth.uid())
    ));

DROP POLICY IF EXISTS "Users can create clone records for owned engagements" ON engagement_clones;
CREATE POLICY "Users can create clone records for owned engagements"
    ON engagement_clones FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM engagements e
        WHERE e.id = source_engagement_id
        AND (e.created_by = auth.uid() OR e.consultant_id = auth.uid())
    ));

DROP POLICY IF EXISTS "Users can update own clone records" ON engagement_clones;
CREATE POLICY "Users can update own clone records"
    ON engagement_clones FOR UPDATE USING (cloned_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete own clone records" ON engagement_clones;
CREATE POLICY "Users can delete own clone records"
    ON engagement_clones FOR DELETE USING (cloned_by = auth.uid());

CREATE OR REPLACE FUNCTION get_clone_lineage(engagement_uuid UUID)
RETURNS TABLE (
    engagement_id UUID, engagement_name TEXT, client_name TEXT,
    relationship TEXT, cloned_at TIMESTAMPTZ, depth INT
) AS $$
WITH RECURSIVE
parents AS (
    SELECT e.id, e.name, c.name AS client_name, 'self'::TEXT AS relationship, NULL::TIMESTAMPTZ AS cloned_at, 0 AS depth
    FROM engagements e LEFT JOIN clients c ON e.client_id = c.id
    WHERE e.id = engagement_uuid
    UNION ALL
    SELECT e.id, e.name, c.name, 'parent'::TEXT, ec.cloned_at, p.depth - 1
    FROM parents p
    JOIN engagement_clones ec ON ec.target_engagement_id = p.id
    JOIN engagements e ON e.id = ec.source_engagement_id
    LEFT JOIN clients c ON e.client_id = c.id
    WHERE p.depth > -5
),
children AS (
    SELECT e.id, e.name, c.name AS client_name, 'self'::TEXT AS relationship, NULL::TIMESTAMPTZ AS cloned_at, 0 AS depth
    FROM engagements e LEFT JOIN clients c ON e.client_id = c.id
    WHERE e.id = engagement_uuid
    UNION ALL
    SELECT e.id, e.name, c.name, 'child'::TEXT, ec.cloned_at, ch.depth + 1
    FROM children ch
    JOIN engagement_clones ec ON ec.source_engagement_id = ch.id
    JOIN engagements e ON e.id = ec.target_engagement_id
    LEFT JOIN clients c ON e.client_id = c.id
    WHERE ch.depth < 5
)
SELECT * FROM parents
UNION
SELECT * FROM children WHERE relationship != 'self'
ORDER BY depth;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION is_cloned_engagement(engagement_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM engagement_clones WHERE target_engagement_id = engagement_uuid);
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_clone_count(engagement_uuid UUID)
RETURNS INT AS $$
    SELECT COUNT(*)::INT FROM engagement_clones WHERE source_engagement_id = engagement_uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION update_clone_metadata()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE engagements SET clone_metadata = jsonb_build_object(
        'cloned_from', NEW.source_engagement_id,
        'cloned_at', NEW.cloned_at,
        'cloned_by', NEW.cloned_by
    ) WHERE id = NEW.target_engagement_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS engagement_clone_metadata_trigger ON engagement_clones;
CREATE TRIGGER engagement_clone_metadata_trigger
    AFTER INSERT ON engagement_clones FOR EACH ROW EXECUTE FUNCTION update_clone_metadata();

-- -----------------------------------------------------------------------------
-- Migration 8: Client Portal (Epic 10: F10.1-F10.8)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS portal_magic_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash TEXT NOT NULL UNIQUE,
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
    CONSTRAINT valid_email CHECK (client_email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$')
);

CREATE INDEX IF NOT EXISTS idx_magic_links_token ON portal_magic_links(token_hash);
CREATE INDEX IF NOT EXISTS idx_magic_links_engagement ON portal_magic_links(engagement_id);
CREATE INDEX IF NOT EXISTS idx_magic_links_email ON portal_magic_links(client_email);
CREATE INDEX IF NOT EXISTS idx_magic_links_expires ON portal_magic_links(expires_at);

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

CREATE INDEX IF NOT EXISTS idx_portal_sessions_magic_link ON portal_sessions(magic_link_id);
CREATE INDEX IF NOT EXISTS idx_portal_sessions_engagement ON portal_sessions(engagement_id);
CREATE INDEX IF NOT EXISTS idx_portal_sessions_active ON portal_sessions(is_active, expires_at);

CREATE TABLE IF NOT EXISTS artifact_visibility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
    is_client_visible BOOLEAN NOT NULL DEFAULT FALSE,
    visible_since TIMESTAMPTZ,
    hidden_since TIMESTAMPTZ,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_artifact_visibility UNIQUE (artifact_id)
);

CREATE INDEX IF NOT EXISTS idx_artifact_visibility_visible ON artifact_visibility(artifact_id, is_client_visible);

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

CREATE INDEX IF NOT EXISTS idx_portal_activity_engagement ON portal_activity_log(engagement_id);
CREATE INDEX IF NOT EXISTS idx_portal_activity_session ON portal_activity_log(session_id);
CREATE INDEX IF NOT EXISTS idx_portal_activity_created ON portal_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portal_activity_action ON portal_activity_log(action);

ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS client_visible BOOLEAN DEFAULT FALSE;

CREATE OR REPLACE FUNCTION check_artifact_visibility()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.client_visible = TRUE THEN RETURN NEW; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS artifact_visibility_check ON artifacts;
CREATE TRIGGER artifact_visibility_check
    BEFORE UPDATE OF client_visible ON artifacts FOR EACH ROW EXECUTE FUNCTION check_artifact_visibility();

ALTER TABLE portal_magic_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Consultants can view own engagement magic links" ON portal_magic_links;
CREATE POLICY "Consultants can view own engagement magic links"
    ON portal_magic_links FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM engagements e WHERE e.id = engagement_id
        AND (e.created_by = auth.uid() OR e.consultant_id = auth.uid())
    ));

DROP POLICY IF EXISTS "Consultants can create magic links for own engagements" ON portal_magic_links;
CREATE POLICY "Consultants can create magic links for own engagements"
    ON portal_magic_links FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM engagements e WHERE e.id = engagement_id
        AND (e.created_by = auth.uid() OR e.consultant_id = auth.uid())
    ));

DROP POLICY IF EXISTS "Consultants can update own engagement magic links" ON portal_magic_links;
CREATE POLICY "Consultants can update own engagement magic links"
    ON portal_magic_links FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM engagements e WHERE e.id = engagement_id
        AND (e.created_by = auth.uid() OR e.consultant_id = auth.uid())
    ));

ALTER TABLE portal_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Consultants can view portal sessions for own engagements" ON portal_sessions;
CREATE POLICY "Consultants can view portal sessions for own engagements"
    ON portal_sessions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM engagements e WHERE e.id = engagement_id
        AND (e.created_by = auth.uid() OR e.consultant_id = auth.uid())
    ));

ALTER TABLE artifact_visibility ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Consultants can manage artifact visibility" ON artifact_visibility;
CREATE POLICY "Consultants can manage artifact visibility"
    ON artifact_visibility FOR ALL
    USING (EXISTS (
        SELECT 1 FROM artifacts a JOIN engagements e ON a.engagement_id = e.id
        WHERE a.id = artifact_id AND (e.created_by = auth.uid() OR e.consultant_id = auth.uid())
    ));

ALTER TABLE portal_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Consultants can view activity for own engagements" ON portal_activity_log;
CREATE POLICY "Consultants can view activity for own engagements"
    ON portal_activity_log FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM engagements e WHERE e.id = engagement_id
        AND (e.created_by = auth.uid() OR e.consultant_id = auth.uid())
    ));

CREATE OR REPLACE FUNCTION validate_magic_link(token_hash_input TEXT)
RETURNS TABLE (
    is_valid BOOLEAN, reason TEXT, link_id UUID,
    engagement_id UUID, engagement_name TEXT, client_name TEXT
) AS $$
DECLARE link_record RECORD;
BEGIN
    SELECT ml.*, e.name as eng_name INTO link_record
    FROM portal_magic_links ml JOIN engagements e ON ml.engagement_id = e.id
    WHERE ml.token_hash = token_hash_input;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'not_found'::TEXT, NULL::UUID, NULL::UUID, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;

    IF link_record.is_revoked THEN
        RETURN QUERY SELECT FALSE, 'revoked'::TEXT, link_record.id, link_record.engagement_id, link_record.eng_name, link_record.client_name;
        RETURN;
    END IF;

    IF link_record.expires_at < NOW() THEN
        RETURN QUERY SELECT FALSE, 'expired'::TEXT, link_record.id, link_record.engagement_id, link_record.eng_name, link_record.client_name;
        RETURN;
    END IF;

    RETURN QUERY SELECT TRUE, NULL::TEXT, link_record.id, link_record.engagement_id, link_record.eng_name, link_record.client_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_portal_analytics(engagement_uuid UUID, days_back INT DEFAULT 30)
RETURNS TABLE (total_views BIGINT, unique_visitors BIGINT, artifact_views BIGINT, downloads BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT COUNT(*)::BIGINT, COUNT(DISTINCT client_email)::BIGINT,
        COUNT(*) FILTER (WHERE action = 'view_artifact')::BIGINT,
        COUNT(*) FILTER (WHERE action = 'download_artifact')::BIGINT
    FROM portal_activity_log
    WHERE engagement_id = engagement_uuid AND created_at >= NOW() - (days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION log_portal_activity(
    p_engagement_id UUID, p_session_id UUID, p_client_email TEXT, p_action TEXT,
    p_artifact_id UUID DEFAULT NULL, p_details JSONB DEFAULT '{}'::jsonb,
    p_ip_address INET DEFAULT NULL, p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE log_id UUID;
BEGIN
    INSERT INTO portal_activity_log (
        engagement_id, session_id, client_email, action, artifact_id, details, ip_address, user_agent
    ) VALUES (
        p_engagement_id, p_session_id, p_client_email, p_action, p_artifact_id, p_details, p_ip_address, p_user_agent
    ) RETURNING id INTO log_id;
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

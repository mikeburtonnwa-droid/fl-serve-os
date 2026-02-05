-- Templates Migration
-- Template Library (F8.1-F8.4)

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('assessment', 'proposal', 'report', 'presentation', 'plan', 'checklist', 'other')),
  content TEXT NOT NULL,
  content_format TEXT NOT NULL DEFAULT 'markdown' CHECK (content_format IN ('markdown', 'html', 'json')),

  -- Metadata
  source TEXT NOT NULL DEFAULT 'user' CHECK (source IN ('system', 'user', 'community')),
  created_by UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  is_anonymized BOOLEAN NOT NULL DEFAULT false,
  original_artifact_id UUID REFERENCES artifacts(id) ON DELETE SET NULL,

  -- Tags and search
  tags TEXT[] DEFAULT '{}',
  industry TEXT,
  use_case TEXT,

  -- Stats
  usage_count INTEGER NOT NULL DEFAULT 0,
  rating DECIMAL(2,1),
  rating_count INTEGER DEFAULT 0,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create template_usages table
CREATE TABLE IF NOT EXISTS template_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
  artifact_id UUID REFERENCES artifacts(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create template_ratings table
CREATE TABLE IF NOT EXISTS template_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(template_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_source ON templates(source);
CREATE INDEX IF NOT EXISTS idx_templates_status ON templates(status);
CREATE INDEX IF NOT EXISTS idx_templates_tags ON templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_templates_search ON templates USING GIN(to_tsvector('english', name || ' ' || description));
CREATE INDEX IF NOT EXISTS idx_template_usages_template ON template_usages(template_id);
CREATE INDEX IF NOT EXISTS idx_template_usages_user ON template_usages(user_id);

-- Enable RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for templates
CREATE POLICY "Anyone can view published templates"
  ON templates FOR SELECT
  USING (status = 'published' OR created_by = auth.uid());

CREATE POLICY "Users can create templates"
  ON templates FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own templates"
  ON templates FOR UPDATE
  USING (created_by = auth.uid() OR source = 'system');

CREATE POLICY "Users can delete their own templates"
  ON templates FOR DELETE
  USING (created_by = auth.uid());

-- RLS Policies for template_usages
CREATE POLICY "Users can view their own usage"
  ON template_usages FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create usage records"
  ON template_usages FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for template_ratings
CREATE POLICY "Anyone can view ratings"
  ON template_ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can rate templates"
  ON template_ratings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their ratings"
  ON template_ratings FOR UPDATE
  USING (user_id = auth.uid());

-- Trigger to update usage count
CREATE OR REPLACE FUNCTION update_template_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE templates
  SET usage_count = usage_count + 1
  WHERE id = NEW.template_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER template_usage_count_trigger
  AFTER INSERT ON template_usages
  FOR EACH ROW
  EXECUTE FUNCTION update_template_usage_count();

-- Trigger to update average rating
CREATE OR REPLACE FUNCTION update_template_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE templates
  SET
    rating = (SELECT AVG(rating) FROM template_ratings WHERE template_id = NEW.template_id),
    rating_count = (SELECT COUNT(*) FROM template_ratings WHERE template_id = NEW.template_id)
  WHERE id = NEW.template_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER template_rating_trigger
  AFTER INSERT OR UPDATE ON template_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_template_rating();

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER template_timestamp_trigger
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_template_timestamp();

-- Insert system templates
INSERT INTO templates (name, description, category, content, content_format, source, is_anonymized, tags, industry, use_case, status)
VALUES
  (
    'AI Readiness Assessment',
    'Comprehensive assessment template for evaluating an organization''s readiness for AI implementation.',
    'assessment',
    '# AI Readiness Assessment\n\n## Executive Summary\n\n[Organization Name] is currently positioned at a **[Score]%** AI readiness level...',
    'markdown',
    'system',
    true,
    ARRAY['assessment', 'ai-readiness', 'foundation'],
    'general',
    'Initial client assessment',
    'published'
  ),
  (
    'Process Automation Opportunity Assessment',
    'Template for identifying and prioritizing automation opportunities within an organization.',
    'assessment',
    '# Process Automation Opportunity Assessment\n\n## Overview\n\nThis assessment identifies automation opportunities...',
    'markdown',
    'system',
    true,
    ARRAY['assessment', 'automation', 'process'],
    'general',
    'Process improvement',
    'published'
  ),
  (
    'AI Implementation Proposal',
    'Standard proposal template for AI/automation implementation engagements.',
    'proposal',
    '# AI Implementation Proposal\n\n**Prepared for:** [Client Name]\n**Prepared by:** [Consultant Name]...',
    'markdown',
    'system',
    true,
    ARRAY['proposal', 'ai', 'implementation'],
    'general',
    'Client proposals',
    'published'
  ),
  (
    'Monthly Engagement Status Report',
    'Standard template for monthly client engagement status updates.',
    'report',
    '# Monthly Status Report\n\n**Engagement:** [Engagement Name]\n**Client:** [Client Name]...',
    'markdown',
    'system',
    true,
    ARRAY['report', 'status', 'monthly'],
    'general',
    'Client reporting',
    'published'
  ),
  (
    'Implementation Project Plan',
    'Detailed project plan template for AI/automation implementations.',
    'plan',
    '# Implementation Project Plan\n\n**Project:** [Project Name]\n**Client:** [Client Name]...',
    'markdown',
    'system',
    true,
    ARRAY['plan', 'project', 'implementation'],
    'general',
    'Project planning',
    'published'
  ),
  (
    'Go-Live Readiness Checklist',
    'Pre-deployment checklist to ensure all requirements are met before go-live.',
    'checklist',
    '# Go-Live Readiness Checklist\n\n**Project:** [Project Name]\n**Target Go-Live Date:** [Date]...',
    'markdown',
    'system',
    true,
    ARRAY['checklist', 'go-live', 'deployment'],
    'general',
    'Deployment preparation',
    'published'
  )
ON CONFLICT DO NOTHING;

-- Function to search templates
CREATE OR REPLACE FUNCTION search_templates(
  search_query TEXT DEFAULT NULL,
  filter_category TEXT DEFAULT NULL,
  filter_source TEXT DEFAULT NULL,
  filter_tags TEXT[] DEFAULT NULL,
  page_num INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  category TEXT,
  content_preview TEXT,
  source TEXT,
  tags TEXT[],
  industry TEXT,
  use_case TEXT,
  usage_count INTEGER,
  rating DECIMAL,
  rating_count INTEGER,
  status TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.description,
    t.category,
    LEFT(t.content, 500) AS content_preview,
    t.source,
    t.tags,
    t.industry,
    t.use_case,
    t.usage_count,
    t.rating,
    t.rating_count,
    t.status,
    t.created_at
  FROM templates t
  WHERE t.status = 'published'
    AND (search_query IS NULL OR to_tsvector('english', t.name || ' ' || t.description) @@ plainto_tsquery('english', search_query))
    AND (filter_category IS NULL OR t.category = filter_category)
    AND (filter_source IS NULL OR t.source = filter_source)
    AND (filter_tags IS NULL OR t.tags && filter_tags)
  ORDER BY t.usage_count DESC, t.rating DESC NULLS LAST, t.created_at DESC
  LIMIT page_size
  OFFSET (page_num - 1) * page_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

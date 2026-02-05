-- Intake Assessments Migration
-- Enhanced intake assessment with weighted scoring (F7.1-F7.4)

-- Create intake_assessments table
CREATE TABLE IF NOT EXISTS intake_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,

  -- Assessment data (JSONB for flexibility)
  answers JSONB NOT NULL DEFAULT '[]',
  scores JSONB,

  -- Pathway recommendation
  recommended_pathway TEXT CHECK (recommended_pathway IN ('accelerated', 'standard', 'extended')),
  pathway_override TEXT CHECK (pathway_override IN ('accelerated', 'standard', 'extended')),
  override_justification TEXT,
  override_by UUID REFERENCES auth.users(id),
  override_at TIMESTAMPTZ,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'reviewed')),
  completed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One assessment per engagement
  UNIQUE(engagement_id)
);

-- Create intake_question_weights table for admin configuration (F7.4)
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

-- Create intake_category_weights table for admin configuration (F7.4)
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

-- Insert default category weights
INSERT INTO intake_category_weights (category, weight, display_name, description, display_order)
VALUES
  ('data_readiness', 1.2, 'Data Readiness', 'Quality and accessibility of existing data', 1),
  ('process_maturity', 1.0, 'Process Maturity', 'Current process documentation and standardization', 2),
  ('technical_infrastructure', 1.1, 'Technical Infrastructure', 'Systems and integration capabilities', 3),
  ('organizational_readiness', 1.0, 'Organizational Readiness', 'Team capacity and change management', 4),
  ('stakeholder_alignment', 0.9, 'Stakeholder Alignment', 'Leadership support and communication', 5)
ON CONFLICT (category) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_intake_assessments_engagement ON intake_assessments(engagement_id);
CREATE INDEX IF NOT EXISTS idx_intake_assessments_status ON intake_assessments(status);
CREATE INDEX IF NOT EXISTS idx_intake_question_weights_category ON intake_question_weights(category);

-- Enable RLS
ALTER TABLE intake_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_question_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_category_weights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for intake_assessments
CREATE POLICY "Users can view assessments for their engagements"
  ON intake_assessments FOR SELECT
  USING (
    engagement_id IN (
      SELECT id FROM engagements
      WHERE consultant_id = auth.uid() OR client_id IN (
        SELECT id FROM clients WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Consultants can manage assessments for their engagements"
  ON intake_assessments FOR ALL
  USING (
    engagement_id IN (
      SELECT id FROM engagements WHERE consultant_id = auth.uid()
    )
  );

-- RLS Policies for question weights (admin only, but readable by all authenticated)
CREATE POLICY "Anyone can view question weights"
  ON intake_question_weights FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can modify question weights"
  ON intake_question_weights FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for category weights
CREATE POLICY "Anyone can view category weights"
  ON intake_category_weights FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can modify category weights"
  ON intake_category_weights FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Update trigger for timestamps
CREATE OR REPLACE FUNCTION update_intake_assessment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  -- Auto-set completed_at when status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER intake_assessment_timestamp_trigger
  BEFORE UPDATE ON intake_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_intake_assessment_timestamp();

-- Trigger to update weight tables timestamps
CREATE OR REPLACE FUNCTION update_weight_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER question_weight_timestamp_trigger
  BEFORE UPDATE ON intake_question_weights
  FOR EACH ROW
  EXECUTE FUNCTION update_weight_timestamp();

CREATE TRIGGER category_weight_timestamp_trigger
  BEFORE UPDATE ON intake_category_weights
  FOR EACH ROW
  EXECUTE FUNCTION update_weight_timestamp();

-- Function to get assessment with calculated scores
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
  SELECT
    ia.id AS assessment_id,
    ia.status,
    (ia.scores->>'overallScore')::INTEGER AS overall_score,
    ia.recommended_pathway,
    COALESCE(ia.pathway_override, ia.recommended_pathway) AS effective_pathway,
    (ia.scores->>'completionPercentage')::INTEGER AS completion_percentage,
    ia.scores->'riskProfile'->>'level' AS risk_level
  FROM intake_assessments ia
  WHERE ia.engagement_id = p_engagement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

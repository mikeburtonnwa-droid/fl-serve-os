-- SERVE OS Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- USERS TABLE (extends Supabase auth.users)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'consultant' CHECK (role IN ('admin', 'consultant', 'viewer')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- CLIENTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  industry TEXT,
  size TEXT,
  status TEXT NOT NULL DEFAULT 'prospect' CHECK (status IN ('active', 'inactive', 'prospect')),
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

-- ===========================================
-- ENGAGEMENTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.engagements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  consultant_id UUID REFERENCES public.users(id),
  name TEXT NOT NULL,
  pathway TEXT NOT NULL CHECK (pathway IN ('knowledge_spine', 'roi_audit', 'workflow_sprint')),
  status TEXT NOT NULL DEFAULT 'intake' CHECK (status IN ('intake', 'discovery', 'active', 'review', 'complete', 'on_hold')),
  intake_score INTEGER CHECK (intake_score >= 0 AND intake_score <= 21),
  start_date DATE,
  target_end_date DATE,
  actual_end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

-- ===========================================
-- ARTIFACTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  name TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  sensitivity_tier TEXT NOT NULL DEFAULT 'T1' CHECK (sensitivity_tier IN ('T1', 'T2', 'T3')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'archived')),
  version INTEGER NOT NULL DEFAULT 1,
  google_drive_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

-- ===========================================
-- STATION RUNS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.station_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
  station_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'awaiting_approval', 'approved', 'rejected', 'complete', 'failed')),
  input_data JSONB NOT NULL DEFAULT '{}',
  output_data JSONB,
  model_used TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
  tokens_in INTEGER NOT NULL DEFAULT 0,
  tokens_out INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- APPROVALS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_run_id UUID REFERENCES public.station_runs(id) ON DELETE CASCADE,
  artifact_id UUID REFERENCES public.artifacts(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'revision_requested')),
  reviewer_id UUID NOT NULL REFERENCES public.users(id),
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT approval_target CHECK (station_run_id IS NOT NULL OR artifact_id IS NOT NULL)
);

-- ===========================================
-- DECISIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
  decision_type TEXT NOT NULL,
  description TEXT NOT NULL,
  rationale TEXT NOT NULL,
  alternatives_considered JSONB,
  made_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- RISKS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.risks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'mitigated', 'accepted', 'closed')),
  mitigation_plan TEXT,
  owner_id UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- AUDIT LOG TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'approve', 'reject', 'station_run', 'export', 'login', 'logout')),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- NOTIFICATIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- INDEXES
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON public.clients(created_by);

CREATE INDEX IF NOT EXISTS idx_engagements_client_id ON public.engagements(client_id);
CREATE INDEX IF NOT EXISTS idx_engagements_consultant_id ON public.engagements(consultant_id);
CREATE INDEX IF NOT EXISTS idx_engagements_status ON public.engagements(status);
CREATE INDEX IF NOT EXISTS idx_engagements_pathway ON public.engagements(pathway);

CREATE INDEX IF NOT EXISTS idx_artifacts_engagement_id ON public.artifacts(engagement_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_status ON public.artifacts(status);
CREATE INDEX IF NOT EXISTS idx_artifacts_template_id ON public.artifacts(template_id);

CREATE INDEX IF NOT EXISTS idx_station_runs_engagement_id ON public.station_runs(engagement_id);
CREATE INDEX IF NOT EXISTS idx_station_runs_status ON public.station_runs(status);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.station_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can read all users (for team visibility)
CREATE POLICY "Users can view all users" ON public.users
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- All authenticated users can view clients
CREATE POLICY "Authenticated users can view clients" ON public.clients
  FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can create clients
CREATE POLICY "Authenticated users can create clients" ON public.clients
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- All authenticated users can update clients
CREATE POLICY "Authenticated users can update clients" ON public.clients
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Apply same pattern to other tables
CREATE POLICY "Authenticated users can view engagements" ON public.engagements
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage engagements" ON public.engagements
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view artifacts" ON public.artifacts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage artifacts" ON public.artifacts
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view station_runs" ON public.station_runs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage station_runs" ON public.station_runs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view approvals" ON public.approvals
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage approvals" ON public.approvals
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view decisions" ON public.decisions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage decisions" ON public.decisions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view risks" ON public.risks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage risks" ON public.risks
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view audit_log" ON public.audit_log
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert audit_log" ON public.audit_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ===========================================
-- FUNCTIONS & TRIGGERS
-- ===========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_engagements_updated_at
  BEFORE UPDATE ON public.engagements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artifacts_updated_at
  BEFORE UPDATE ON public.artifacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risks_updated_at
  BEFORE UPDATE ON public.risks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'consultant'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- SEED DATA (Optional)
-- ===========================================

-- Uncomment to add initial data for testing
-- INSERT INTO public.clients (name, industry, status) VALUES
--   ('Acme Corp', 'Manufacturing', 'prospect'),
--   ('TechStart Inc', 'Technology', 'active');

// Database types for SERVE OS
// These types mirror the Supabase schema

export type UserRole = 'admin' | 'consultant' | 'viewer'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  created_at: string
  updated_at: string
}

export type ClientStatus = 'active' | 'inactive' | 'prospect'

export interface Client {
  id: string
  name: string
  industry?: string
  size?: string
  status: ClientStatus
  primary_contact_name?: string
  primary_contact_email?: string
  notes?: string
  created_at: string
  updated_at: string
  created_by: string
}

export type EngagementStatus = 'intake' | 'discovery' | 'active' | 'review' | 'complete' | 'on_hold'
export type ServicePathway = 'knowledge_spine' | 'roi_audit' | 'workflow_sprint'

export interface Engagement {
  id: string
  client_id: string
  name: string
  pathway: ServicePathway
  status: EngagementStatus
  intake_score?: number
  start_date?: string
  target_end_date?: string
  actual_end_date?: string
  notes?: string
  created_at: string
  updated_at: string
  created_by: string
}

export type SensitivityTier = 'T1' | 'T2' | 'T3'
export type ArtifactStatus = 'draft' | 'pending_review' | 'approved' | 'archived'

export interface Artifact {
  id: string
  engagement_id: string
  template_id: string
  name: string
  content: Record<string, unknown>
  sensitivity_tier: SensitivityTier
  status: ArtifactStatus
  version: number
  google_drive_url?: string
  created_at: string
  updated_at: string
  created_by: string
}

export type StationRunStatus = 'queued' | 'running' | 'awaiting_approval' | 'approved' | 'rejected' | 'complete' | 'failed'

export interface StationRun {
  id: string
  engagement_id: string
  station_id: string
  status: StationRunStatus
  input_data: Record<string, unknown>
  output_data?: Record<string, unknown>
  model_used: string
  tokens_in: number
  tokens_out: number
  duration_ms: number
  error_message?: string
  requires_approval: boolean
  approved_by?: string
  approved_at?: string
  created_at: string
}

export interface Approval {
  id: string
  station_run_id: string
  artifact_id?: string
  decision: 'approved' | 'rejected' | 'revision_requested'
  reviewer_id: string
  comments?: string
  created_at: string
}

export interface Decision {
  id: string
  engagement_id: string
  decision_type: string
  description: string
  rationale: string
  alternatives_considered?: string[]
  made_by: string
  created_at: string
}

export interface Risk {
  id: string
  engagement_id: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'mitigated' | 'accepted' | 'closed'
  mitigation_plan?: string
  owner_id: string
  created_at: string
  updated_at: string
}

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'station_run'
  | 'export'
  | 'login'
  | 'logout'

export interface AuditLog {
  id: string
  user_id: string
  action: AuditAction
  entity_type: string
  entity_id: string
  details: Record<string, unknown>
  ip_address?: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  read: boolean
  link?: string
  created_at: string
}

// Template definitions for SERVE OS Lite
export interface Template {
  id: string
  code: string
  name: string
  description: string
  category: 'intake' | 'discovery' | 'delivery' | 'governance'
  sensitivity_tier: SensitivityTier
  fields: TemplateField[]
}

export interface TemplateField {
  id: string
  name: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'rich_text'
  required: boolean
  options?: string[]
  placeholder?: string
  helpText?: string
}

// Station definitions
export interface Station {
  id: string
  code: string
  name: string
  description: string
  prompt_template: string
  requires_approval: boolean
  sensitivity_tier: SensitivityTier
  input_schema: Record<string, unknown>
  output_schema: Record<string, unknown>
}

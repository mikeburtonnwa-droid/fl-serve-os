/**
 * Template Library Types (F8.1-F8.4)
 *
 * Type definitions for the template/example library system.
 */

// =============================================================================
// Template Types
// =============================================================================

export type TemplateCategory =
  | 'assessment'
  | 'proposal'
  | 'report'
  | 'presentation'
  | 'plan'
  | 'checklist'
  | 'other'

export type TemplateStatus = 'draft' | 'published' | 'archived'

export type TemplateSource = 'system' | 'user' | 'community'

export interface Template {
  id: string
  name: string
  description: string
  category: TemplateCategory
  content: string
  contentFormat: 'markdown' | 'html' | 'json'

  // Metadata
  source: TemplateSource
  createdBy?: string
  createdByName?: string
  isAnonymized: boolean
  originalArtifactId?: string // If created from real artifact

  // Tags and search
  tags: string[]
  industry?: string
  useCase?: string

  // Stats
  usageCount: number
  rating?: number
  ratingCount?: number

  // Status
  status: TemplateStatus

  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface TemplatePreview extends Omit<Template, 'content'> {
  contentPreview: string // First 500 chars
}

// =============================================================================
// Anonymization Types (F8.4)
// =============================================================================

export interface AnonymizationRule {
  id: string
  pattern: string // Regex pattern
  type: 'name' | 'email' | 'phone' | 'company' | 'address' | 'custom'
  replacement: string
  isEnabled: boolean
}

export interface AnonymizationResult {
  originalContent: string
  anonymizedContent: string
  replacements: AnonymizationReplacement[]
  confidenceScore: number
}

export interface AnonymizationReplacement {
  original: string
  replacement: string
  type: AnonymizationRule['type']
  startIndex: number
  endIndex: number
}

// =============================================================================
// Template Usage (F8.3)
// =============================================================================

export interface TemplateUsage {
  id: string
  templateId: string
  userId: string
  engagementId?: string
  artifactId?: string // Created artifact from template
  usedAt: string
}

export interface UseTemplateOptions {
  engagementId: string
  customizations?: Record<string, string>
  artifactName?: string
}

// =============================================================================
// Template Filters
// =============================================================================

export interface TemplateFilters {
  category?: TemplateCategory
  source?: TemplateSource
  tags?: string[]
  industry?: string
  search?: string
  status?: TemplateStatus
}

export interface TemplateSortOption {
  field: 'name' | 'usageCount' | 'rating' | 'createdAt' | 'updatedAt'
  direction: 'asc' | 'desc'
}

// =============================================================================
// API Responses
// =============================================================================

export interface TemplateListResponse {
  templates: TemplatePreview[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface TemplateDetailResponse {
  template: Template
  relatedTemplates: TemplatePreview[]
}

// =============================================================================
// Default Templates
// =============================================================================

export const DEFAULT_CATEGORIES: { id: TemplateCategory; label: string; icon: string }[] = [
  { id: 'assessment', label: 'Assessments', icon: 'clipboard-check' },
  { id: 'proposal', label: 'Proposals', icon: 'file-text' },
  { id: 'report', label: 'Reports', icon: 'bar-chart' },
  { id: 'presentation', label: 'Presentations', icon: 'presentation' },
  { id: 'plan', label: 'Plans', icon: 'calendar' },
  { id: 'checklist', label: 'Checklists', icon: 'list-checks' },
  { id: 'other', label: 'Other', icon: 'file' },
]

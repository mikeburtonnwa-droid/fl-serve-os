/**
 * Engagement Cloning Type Definitions (F9.1-F9.4)
 *
 * Types for the engagement cloning system including
 * selective artifact cloning, field auto-clear, and lineage tracking.
 *
 * User Stories: US-033, US-034
 */

// =============================================================================
// Clone Configuration Types
// =============================================================================

/**
 * Fields that contain client-specific information and should be cleared on clone
 */
export type ClientSensitiveField =
  | 'company_overview'
  | 'key_stakeholders'
  | 'budget_range'
  | 'contact_info'
  | 'custom_requirements'
  | 'notes'

/**
 * Fields that contain process/methodology information and should be preserved
 */
export type PreservableField =
  | 'process_description'
  | 'success_criteria'
  | 'timeline_expectations'
  | 'automation_potential'
  | 'ai_components'

/**
 * Configuration for what to include in the clone
 */
export interface CloneConfiguration {
  // Target client for the new engagement
  targetClientId: string

  // New engagement name
  newEngagementName: string

  // Whether to clear client-specific fields
  clearClientFields: boolean

  // Specific fields to clear (if clearClientFields is true)
  fieldsToField?: ClientSensitiveField[]

  // Which artifacts to include in the clone
  selectedArtifactIds: string[]

  // Whether to include artifact versions
  includeVersionHistory: boolean

  // Whether to copy comments/notes
  includeComments: boolean

  // Whether to maintain pathway configuration
  preservePathway: boolean

  // Optional notes about the clone
  cloneNotes?: string
}

// =============================================================================
// Clone Result Types
// =============================================================================

/**
 * Summary of what was cloned
 */
export interface CloneSummary {
  // Counts
  artifactsCloned: number
  artifactsSkipped: number
  fieldsCleared: number
  fieldsPreserved: number

  // Lists of cleared/preserved fields for user review
  clearedFields: string[]
  preservedFields: string[]

  // Warnings (e.g., failed to clone certain artifacts)
  warnings: string[]
}

/**
 * Result of a clone operation
 */
export interface CloneResult {
  success: boolean
  newEngagementId: string
  newEngagementName: string
  sourceEngagementId: string
  clonedAt: string
  summary: CloneSummary
  lineageId: string
}

// =============================================================================
// Lineage Tracking Types
// =============================================================================

/**
 * Clone lineage record for tracking engagement relationships
 */
export interface CloneLineage {
  id: string
  sourceEngagementId: string
  targetEngagementId: string
  clonedBy: string
  clonedByName?: string
  clonedAt: string
  configuration: CloneConfiguration
  summary: CloneSummary
}

/**
 * Engagement with lineage information
 */
export interface EngagementWithLineage {
  id: string
  name: string
  clientName: string
  clonedFrom?: {
    engagementId: string
    engagementName: string
    clientName: string
    clonedAt: string
  }
  clonedTo?: Array<{
    engagementId: string
    engagementName: string
    clientName: string
    clonedAt: string
  }>
}

// =============================================================================
// Wizard State Types
// =============================================================================

/**
 * Wizard step identifiers
 */
export type CloneWizardStep =
  | 'select-client'
  | 'configure-clone'
  | 'select-artifacts'
  | 'review-confirm'

/**
 * Artifact selection for the wizard
 */
export interface CloneableArtifact {
  id: string
  name: string
  type: string
  status: string
  createdAt: string
  selected: boolean
  hasClientData: boolean
  clientDataFields?: string[]
}

/**
 * Wizard state
 */
export interface CloneWizardState {
  currentStep: CloneWizardStep
  sourceEngagement: {
    id: string
    name: string
    clientId: string
    clientName: string
    pathway: string
  }
  configuration: Partial<CloneConfiguration>
  artifacts: CloneableArtifact[]
  validation: {
    isValid: boolean
    errors: string[]
  }
}

// =============================================================================
// Field Definitions
// =============================================================================

/**
 * Definition of client-sensitive fields with metadata
 */
export interface FieldDefinition {
  id: string
  name: string
  description: string
  category: 'client' | 'process' | 'technical'
  defaultAction: 'clear' | 'preserve'
  templateIds: string[]
}

/**
 * Default field definitions for auto-clear functionality
 */
export const CLIENT_SENSITIVE_FIELDS: FieldDefinition[] = [
  {
    id: 'company_overview',
    name: 'Company Overview',
    description: 'General information about the client company',
    category: 'client',
    defaultAction: 'clear',
    templateIds: ['TPL-01'],
  },
  {
    id: 'key_stakeholders',
    name: 'Key Stakeholders',
    description: 'Names and contact information for client stakeholders',
    category: 'client',
    defaultAction: 'clear',
    templateIds: ['TPL-01'],
  },
  {
    id: 'budget_range',
    name: 'Budget Range',
    description: 'Client budget information',
    category: 'client',
    defaultAction: 'clear',
    templateIds: ['TPL-01'],
  },
  {
    id: 'client_name',
    name: 'Client Name',
    description: 'Client company or individual name',
    category: 'client',
    defaultAction: 'clear',
    templateIds: ['TPL-12'],
  },
  {
    id: 'testimonial',
    name: 'Client Testimonial',
    description: 'Client quotes and testimonials',
    category: 'client',
    defaultAction: 'clear',
    templateIds: ['TPL-12'],
  },
]

export const PRESERVABLE_FIELDS: FieldDefinition[] = [
  {
    id: 'process_description',
    name: 'Process Description',
    description: 'Workflow and process documentation',
    category: 'process',
    defaultAction: 'preserve',
    templateIds: ['TPL-02'],
  },
  {
    id: 'success_criteria',
    name: 'Success Criteria',
    description: 'Project success metrics and KPIs',
    category: 'process',
    defaultAction: 'preserve',
    templateIds: ['TPL-01', 'TPL-03'],
  },
  {
    id: 'ai_components',
    name: 'AI Components',
    description: 'Selected AI technologies and components',
    category: 'technical',
    defaultAction: 'preserve',
    templateIds: ['TPL-03'],
  },
  {
    id: 'automation_percentage',
    name: 'Automation Level',
    description: 'Expected automation percentage',
    category: 'technical',
    defaultAction: 'preserve',
    templateIds: ['TPL-03'],
  },
  {
    id: 'implementation_phases',
    name: 'Implementation Phases',
    description: 'Project phase definitions and tasks',
    category: 'process',
    defaultAction: 'preserve',
    templateIds: ['TPL-05'],
  },
]

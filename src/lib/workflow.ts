// SERVE OS Workflow Definitions
// Defines the artifact dependencies and station requirements for each pathway

export type StationId = 'S-01' | 'S-02' | 'S-03'
export type TemplateId = 'TPL-01' | 'TPL-02' | 'TPL-03' | 'TPL-05' | 'TPL-09' | 'TPL-10' | 'TPL-12'
export type Pathway = 'knowledge_spine' | 'roi_audit' | 'workflow_sprint'
export type ArtifactScope = 'client' | 'engagement'

// =============================================================================
// ARTIFACT SCOPE DEFINITIONS
// Determines whether an artifact belongs to the Client or the Engagement
// =============================================================================
export const ARTIFACT_SCOPES: Record<TemplateId, ArtifactScope> = {
  'TPL-01': 'client',      // Discovery Brief - describes the CLIENT's business
  'TPL-02': 'client',      // Current State Map - CLIENT's processes (doesn't change per engagement)
  'TPL-03': 'engagement',  // Future State Design - specific to THIS engagement's scope
  'TPL-05': 'engagement',  // Implementation Plan - specific to THIS engagement
  'TPL-09': 'engagement',  // ROI Calculator - specific to THIS engagement's scope
  'TPL-10': 'engagement',  // Client Handoff - deliverable for THIS engagement
  'TPL-12': 'engagement',  // Case Study - about THIS engagement
}

// =============================================================================
// STATION SCOPE DEFINITIONS
// Determines whether a station operates at Client or Engagement level
// =============================================================================
export const STATION_SCOPES: Record<StationId, ArtifactScope> = {
  'S-01': 'client',      // Discovery Station - analyzes CLIENT, outputs to CLIENT
  'S-02': 'engagement',  // Scoping Station - creates engagement-specific deliverables
  'S-03': 'engagement',  // QA Station - reviews engagement deliverables
}

export interface StationRequirement {
  stationId: StationId
  name: string
  description: string
  scope: ArtifactScope             // Whether this station operates at client or engagement level
  requiredArtifacts: TemplateId[]  // Artifacts that MUST exist before running
  optionalArtifacts: TemplateId[]  // Artifacts that enhance the output if present
  outputArtifacts: TemplateId[]    // Artifacts this station generates/updates
  previousStation?: StationId      // Must complete this station first
}

export interface WorkflowStage {
  stage: number
  name: string
  description: string
  stations: StationId[]
  requiredArtifacts: TemplateId[]
  outputArtifacts: TemplateId[]
}

// Station definitions with artifact dependencies
export const STATION_REQUIREMENTS: Record<StationId, StationRequirement> = {
  'S-01': {
    stationId: 'S-01',
    name: 'Discovery Station',
    description: 'Analyzes client context and generates discovery insights',
    scope: 'client',                // Operates at CLIENT level
    requiredArtifacts: ['TPL-01'],  // Client Discovery Brief required (client-level)
    optionalArtifacts: [],
    outputArtifacts: ['TPL-02'],    // Generates Current State Map (client-level)
    previousStation: undefined,     // First station - no prerequisite
  },
  'S-02': {
    stationId: 'S-02',
    name: 'Scoping Station',
    description: 'Creates project scope, implementation plan, and ROI analysis',
    scope: 'engagement',            // Operates at ENGAGEMENT level
    requiredArtifacts: ['TPL-01', 'TPL-02'],  // Need client-level artifacts
    optionalArtifacts: [],
    outputArtifacts: ['TPL-03', 'TPL-05', 'TPL-09'],  // Engagement-level outputs
    previousStation: 'S-01',  // Must complete discovery first (client must have Current State Map)
  },
  'S-03': {
    stationId: 'S-03',
    name: 'QA Station',
    description: 'Reviews and validates all T2 deliverables before client delivery',
    scope: 'engagement',            // Operates at ENGAGEMENT level
    requiredArtifacts: ['TPL-03', 'TPL-05'],  // Must have engagement deliverables to review
    optionalArtifacts: ['TPL-09', 'TPL-10'],  // ROI and handoff if available
    outputArtifacts: ['TPL-10'],  // Generates/validates Client Handoff
    previousStation: 'S-02',  // Must complete scoping first
  },
}

// Pathway-specific workflow stages
export const PATHWAY_WORKFLOWS: Record<Pathway, WorkflowStage[]> = {
  knowledge_spine: [
    {
      stage: 1,
      name: 'Intake & Discovery',
      description: 'Gather client information and document current state',
      stations: [],
      requiredArtifacts: [],
      outputArtifacts: ['TPL-01'],
    },
    {
      stage: 2,
      name: 'Analysis',
      description: 'AI-powered analysis of client situation',
      stations: ['S-01'],
      requiredArtifacts: ['TPL-01'],
      outputArtifacts: ['TPL-02'],
    },
    {
      stage: 3,
      name: 'Documentation',
      description: 'Create knowledge base and documentation',
      stations: ['S-02'],
      requiredArtifacts: ['TPL-01', 'TPL-02'],
      outputArtifacts: ['TPL-03', 'TPL-05'],
    },
    {
      stage: 4,
      name: 'Review',
      description: 'Quality assurance and validation',
      stations: ['S-03'],
      requiredArtifacts: ['TPL-03', 'TPL-05'],
      outputArtifacts: ['TPL-10'],
    },
    {
      stage: 5,
      name: 'Handoff',
      description: 'Client delivery and knowledge transfer',
      stations: [],
      requiredArtifacts: ['TPL-10'],
      outputArtifacts: ['TPL-12'],
    },
  ],
  roi_audit: [
    {
      stage: 1,
      name: 'Intake & Discovery',
      description: 'Gather client information and identify processes',
      stations: [],
      requiredArtifacts: [],
      outputArtifacts: ['TPL-01'],
    },
    {
      stage: 2,
      name: 'Process Analysis',
      description: 'Map current processes and identify automation opportunities',
      stations: ['S-01'],
      requiredArtifacts: ['TPL-01'],
      outputArtifacts: ['TPL-02'],
    },
    {
      stage: 3,
      name: 'ROI Modeling',
      description: 'Calculate potential value and build business case',
      stations: ['S-02'],
      requiredArtifacts: ['TPL-01', 'TPL-02'],
      outputArtifacts: ['TPL-03', 'TPL-09'],
    },
    {
      stage: 4,
      name: 'Review',
      description: 'Quality assurance and validation',
      stations: ['S-03'],
      requiredArtifacts: ['TPL-03', 'TPL-09'],
      outputArtifacts: ['TPL-10'],
    },
    {
      stage: 5,
      name: 'Handoff',
      description: 'Deliver ROI report and recommendations',
      stations: [],
      requiredArtifacts: ['TPL-10'],
      outputArtifacts: ['TPL-12'],
    },
  ],
  workflow_sprint: [
    {
      stage: 1,
      name: 'Intake & Discovery',
      description: 'Rapid intake and problem identification',
      stations: [],
      requiredArtifacts: [],
      outputArtifacts: ['TPL-01'],
    },
    {
      stage: 2,
      name: 'Current State Mapping',
      description: 'Document existing workflows in detail',
      stations: ['S-01'],
      requiredArtifacts: ['TPL-01'],
      outputArtifacts: ['TPL-02'],
    },
    {
      stage: 3,
      name: 'Solution Design',
      description: 'Design future state and implementation plan',
      stations: ['S-02'],
      requiredArtifacts: ['TPL-01', 'TPL-02'],
      outputArtifacts: ['TPL-03', 'TPL-05', 'TPL-09'],
    },
    {
      stage: 4,
      name: 'Review & Validate',
      description: 'Quality assurance on all deliverables',
      stations: ['S-03'],
      requiredArtifacts: ['TPL-03', 'TPL-05'],
      outputArtifacts: ['TPL-10'],
    },
    {
      stage: 5,
      name: 'Implementation Handoff',
      description: 'Deliver complete implementation package',
      stations: [],
      requiredArtifacts: ['TPL-10'],
      outputArtifacts: ['TPL-12'],
    },
  ],
}

// Template metadata with stage and scope information
export const TEMPLATE_METADATA: Record<TemplateId, {
  name: string
  stage: 'intake' | 'discovery' | 'scoping' | 'delivery' | 'handoff'
  tier: 'T1' | 'T2'
  scope: ArtifactScope
  description: string
}> = {
  'TPL-01': {
    name: 'Client Discovery Brief',
    stage: 'intake',
    tier: 'T1',
    scope: 'client',  // Belongs to the CLIENT
    description: 'Initial client information and context - describes the business',
  },
  'TPL-02': {
    name: 'Current State Map',
    stage: 'discovery',
    tier: 'T1',
    scope: 'client',  // Belongs to the CLIENT - their processes don't change per engagement
    description: 'Documented current processes and pain points',
  },
  'TPL-03': {
    name: 'Future State Design',
    stage: 'scoping',
    tier: 'T2',
    scope: 'engagement',  // Specific to THIS engagement's scope
    description: 'Proposed AI-enhanced workflow design',
  },
  'TPL-05': {
    name: 'Implementation Plan',
    stage: 'scoping',
    tier: 'T2',
    scope: 'engagement',  // Specific to THIS engagement
    description: 'Step-by-step implementation roadmap',
  },
  'TPL-09': {
    name: 'ROI Calculator',
    stage: 'scoping',
    tier: 'T2',
    scope: 'engagement',  // ROI calculated for THIS engagement's scope
    description: 'Quantified value and return on investment',
  },
  'TPL-10': {
    name: 'Client Handoff',
    stage: 'handoff',
    tier: 'T2',
    scope: 'engagement',  // Deliverable for THIS engagement
    description: 'Final delivery package for client',
  },
  'TPL-12': {
    name: 'Case Study',
    stage: 'handoff',
    tier: 'T2',
    scope: 'engagement',  // About THIS engagement
    description: 'Marketing-ready success story',
  },
}

export interface ValidationResult {
  canRun: boolean
  missingArtifacts: TemplateId[]
  missingStations: StationId[]
  warnings: string[]
}

export interface ArtifactInput {
  template_id: string
  status: string
  scope?: ArtifactScope  // 'client' or 'engagement'
}

export interface StationInput {
  station_id: string
  status: string
  scope?: ArtifactScope
}

/**
 * Validates whether a station can be run
 *
 * For client-level stations (S-01): Check client artifacts
 * For engagement-level stations (S-02, S-03): Check both client and engagement artifacts
 *
 * @param stationId - The station to validate
 * @param clientArtifacts - Artifacts belonging to the client
 * @param engagementArtifacts - Artifacts belonging to the engagement (optional for S-01)
 * @param completedStations - Previously completed station runs
 */
export function validateStationPrerequisites(
  stationId: StationId,
  existingArtifacts: ArtifactInput[],
  completedStations: StationInput[]
): ValidationResult {
  const requirements = STATION_REQUIREMENTS[stationId]
  const result: ValidationResult = {
    canRun: true,
    missingArtifacts: [],
    missingStations: [],
    warnings: [],
  }

  // Check required artifacts exist and are approved (or at least draft for T1)
  for (const templateId of requirements.requiredArtifacts) {
    const requiredScope = ARTIFACT_SCOPES[templateId]
    const artifact = existingArtifacts.find(
      (a) => a.template_id === templateId && ['draft', 'approved', 'pending_review'].includes(a.status)
    )
    if (!artifact) {
      result.missingArtifacts.push(templateId)
      result.canRun = false

      // Add helpful message about where to create the artifact
      const meta = TEMPLATE_METADATA[templateId]
      if (requiredScope === 'client') {
        result.warnings.push(`${meta.name} should be created at the Client level`)
      }
    }
  }

  // Check previous station was completed (if required)
  // For S-01 requirement, check client-level station runs
  // For S-02 requirement, check that S-01 was completed for this client
  if (requirements.previousStation) {
    const prevStationScope = STATION_SCOPES[requirements.previousStation]
    const prevStation = completedStations.find(
      (s) => s.station_id === requirements.previousStation &&
             ['approved', 'complete'].includes(s.status)
    )
    if (!prevStation) {
      result.missingStations.push(requirements.previousStation)
      result.canRun = false

      // Add helpful message
      const prevReq = STATION_REQUIREMENTS[requirements.previousStation]
      if (prevStationScope === 'client') {
        result.warnings.push(`${prevReq.name} must be run at the Client level first`)
      }
    }
  }

  // Add warnings for optional artifacts that are missing
  for (const templateId of requirements.optionalArtifacts) {
    const artifact = existingArtifacts.find(
      (a) => a.template_id === templateId && ['draft', 'approved', 'pending_review'].includes(a.status)
    )
    if (!artifact) {
      const meta = TEMPLATE_METADATA[templateId]
      result.warnings.push(`Optional: ${meta.name} (${templateId}) not found - output may be less detailed`)
    }
  }

  return result
}

/**
 * Gets the current workflow stage for an engagement based on completed artifacts
 */
export function getCurrentStage(
  pathway: Pathway,
  existingArtifacts: { template_id: string; status: string }[]
): { currentStage: number; stageName: string; completedArtifacts: TemplateId[]; nextArtifacts: TemplateId[] } {
  const workflow = PATHWAY_WORKFLOWS[pathway]
  const completedArtifacts: TemplateId[] = []

  for (const artifact of existingArtifacts) {
    if (['approved', 'draft', 'pending_review'].includes(artifact.status)) {
      completedArtifacts.push(artifact.template_id as TemplateId)
    }
  }

  // Find the current stage based on completed artifacts
  let currentStage = 1
  for (let i = workflow.length - 1; i >= 0; i--) {
    const stage = workflow[i]
    const hasAllRequired = stage.requiredArtifacts.every((t) => completedArtifacts.includes(t))
    if (hasAllRequired && stage.requiredArtifacts.length > 0) {
      currentStage = Math.min(stage.stage + 1, workflow.length)
      break
    }
  }

  const currentWorkflowStage = workflow[currentStage - 1]
  const nextArtifacts = currentWorkflowStage?.outputArtifacts || []

  return {
    currentStage,
    stageName: currentWorkflowStage?.name || 'Unknown',
    completedArtifacts,
    nextArtifacts,
  }
}

/**
 * Gets available stations for an engagement based on current state
 */
export function getAvailableStations(
  pathway: Pathway,
  existingArtifacts: { template_id: string; status: string }[],
  completedStations: { station_id: string; status: string }[]
): { stationId: StationId; canRun: boolean; validation: ValidationResult }[] {
  const workflow = PATHWAY_WORKFLOWS[pathway]
  const allStations = new Set<StationId>()

  // Collect all stations from this pathway's workflow
  for (const stage of workflow) {
    for (const station of stage.stations) {
      allStations.add(station)
    }
  }

  // Validate each station
  return Array.from(allStations).map((stationId) => {
    const validation = validateStationPrerequisites(stationId, existingArtifacts, completedStations)
    return {
      stationId,
      canRun: validation.canRun,
      validation,
    }
  })
}

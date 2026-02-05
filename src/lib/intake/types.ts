/**
 * Intake Assessment Types (F7.1-F7.4)
 *
 * Type definitions for the enhanced intake assessment system.
 */

// =============================================================================
// Question Types
// =============================================================================

export type QuestionType = 'single_choice' | 'multiple_choice' | 'scale' | 'text' | 'number'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface QuestionOption {
  id: string
  label: string
  value: string
  score: number // 0-100, contribution to pathway scoring
  description?: string // Optional description for the option
  triggersFollowUp?: string[] // IDs of follow-up questions to show
  riskLevel?: RiskLevel
}

export interface ConditionalTrigger {
  questionId: string
  optionValue: string
  action: 'show' | 'hide' | 'require'
}

export interface IntakeQuestion {
  id: string
  text: string
  type: QuestionType
  category: string
  weight: number // 1-5, higher = more important
  options?: QuestionOption[]
  scaleMin?: number
  scaleMax?: number
  scaleLabels?: { min: string; max: string }
  helpText?: string
  required?: boolean
  order?: number
  conditionalTriggers?: ConditionalTrigger[]
}

// =============================================================================
// Follow-up Questions (F7.2)
// =============================================================================

export interface FollowUpQuestion extends IntakeQuestion {
  parentQuestionId: string
  triggerOptionValue: string
  impactMultiplier: number // How much this affects the parent score
}

// =============================================================================
// Answers / Responses
// =============================================================================

export interface IntakeAnswer {
  questionId: string
  value: string | string[] | number
  notes?: string
  answeredAt?: string
}

// =============================================================================
// Scoring (F7.1)
// =============================================================================

export interface CategoryScore {
  category: string
  score: number // 0-100
  weight: number // Category weight multiplier
  maxScore: number
  answeredCount: number
  totalQuestions: number
}

export interface PathwayRecommendation {
  pathway: 'accelerated' | 'standard' | 'extended'
  confidence: number // 0-100
  rationale: string
  estimatedDuration: {
    weeks: number
    label: string
  }
  focusAreas: string[]
}

export interface AssessmentScores {
  overallScore: number // 0-100
  categoryScores: CategoryScore[]
  riskProfile: {
    level: RiskLevel
    factors: string[]
  }
  pathwayRecommendation: PathwayRecommendation
  answeredQuestions: number
  totalQuestions: number
  completionPercentage: number
}

// =============================================================================
// Assessment
// =============================================================================

export interface IntakeAssessment {
  id?: string
  engagementId: string
  answers: IntakeAnswer[]
  scores: AssessmentScores
  recommendedPathway: 'accelerated' | 'standard' | 'extended'
  pathwayOverride?: 'accelerated' | 'standard' | 'extended'
  overrideJustification?: string
  overrideBy?: string
  overrideAt?: string
  status: 'in_progress' | 'completed' | 'reviewed'
  completedAt?: string
  createdAt?: string
  updatedAt?: string
}

// =============================================================================
// Legacy Types (for backward compatibility)
// =============================================================================

export interface IntakeResponse {
  questionId: string
  value: string | string[] | number
  timestamp: string
}

export interface QuestionContribution {
  questionId: string
  questionText: string
  weight: number
  rawScore: number
  weightedContribution: number
}

export interface PathwayScore {
  pathway: string
  score: number
  confidence: number
  matchingFactors: string[]
  concerns: string[]
}

// =============================================================================
// Pathways
// =============================================================================

export type Pathway =
  | 'accelerated'
  | 'standard'
  | 'extended'
  | 'discovery'
  | 'roi_audit'
  | 'workflow_sprint'
  | 'full_implementation'
  | 'optimization'

export interface PathwayDefinition {
  id: Pathway
  name: string
  description: string
  minScore: number
  maxScore: number
  typicalDuration: string
  keyIndicators: string[]
  categoryWeights: Record<string, number>
}

export const PATHWAYS: PathwayDefinition[] = [
  {
    id: 'accelerated',
    name: 'Accelerated',
    description: 'Fast-track implementation for highly prepared organizations',
    minScore: 75,
    maxScore: 100,
    typicalDuration: '6-8 weeks',
    keyIndicators: ['High data readiness', 'Strong executive support', 'Clear objectives'],
    categoryWeights: {
      data_readiness: 1.2,
      process_maturity: 1.0,
      technical_infrastructure: 1.1,
      organizational_readiness: 1.0,
      stakeholder_alignment: 0.9,
    },
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Balanced approach with adequate preparation time',
    minScore: 50,
    maxScore: 74,
    typicalDuration: '10-14 weeks',
    keyIndicators: ['Moderate readiness', 'Some preparation needed', 'Good potential'],
    categoryWeights: {
      data_readiness: 1.0,
      process_maturity: 1.0,
      technical_infrastructure: 1.0,
      organizational_readiness: 1.0,
      stakeholder_alignment: 1.0,
    },
  },
  {
    id: 'extended',
    name: 'Extended',
    description: 'Comprehensive timeline for complex requirements',
    minScore: 0,
    maxScore: 49,
    typicalDuration: '16-24 weeks',
    keyIndicators: ['Lower readiness', 'Significant preparation needed', 'Risk factors present'],
    categoryWeights: {
      data_readiness: 1.3,
      process_maturity: 1.1,
      technical_infrastructure: 1.2,
      organizational_readiness: 1.1,
      stakeholder_alignment: 1.0,
    },
  },
]

// =============================================================================
// Override (F7.3)
// =============================================================================

export interface PathwayOverride {
  originalPathway: string
  newPathway: string
  justification: string
  overriddenBy: string
  overriddenAt: string
}

// =============================================================================
// Admin Configuration (F7.4)
// =============================================================================

export interface WeightConfiguration {
  questionId: string
  weight: number
  updatedBy: string
  updatedAt: string
}

export interface IntakeConfiguration {
  id: string
  name: string
  description: string
  questions: IntakeQuestion[]
  followUpQuestions: FollowUpQuestion[]
  categoryWeights: Record<string, number>
  pathwayThresholds: Record<Pathway, { min: number; max: number }>
  isActive: boolean
  version: number
  createdAt: string
  updatedAt: string
}

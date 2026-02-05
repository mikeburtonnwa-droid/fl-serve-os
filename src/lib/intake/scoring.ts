/**
 * Intake Assessment Scoring Engine (F7.1)
 *
 * Calculates weighted scores and determines recommended pathways.
 *
 * User Stories: US-028, US-029
 */

import type {
  IntakeQuestion,
  FollowUpQuestion,
  IntakeAnswer,
  IntakeAssessment,
  AssessmentScores,
  CategoryScore,
  PathwayRecommendation,
  RiskLevel,
} from './types'
import { INTAKE_QUESTIONS, FOLLOW_UP_QUESTIONS, SCORING_WEIGHTS } from './questions'

// =============================================================================
// Constants
// =============================================================================

const PATHWAY_THRESHOLDS = {
  ACCELERATED: 75, // Score >= 75 = accelerated pathway
  STANDARD: 50, // Score >= 50 = standard pathway
  EXTENDED: 0, // Score < 50 = extended pathway
}

const RISK_WEIGHTS: Record<RiskLevel, number> = {
  low: 1.0,
  medium: 0.85,
  high: 0.7,
  critical: 0.5,
}

// =============================================================================
// Main Scoring Functions
// =============================================================================

/**
 * Calculate the complete assessment score from answers
 */
export function calculateAssessmentScore(
  answers: IntakeAnswer[],
  questions: IntakeQuestion[] = INTAKE_QUESTIONS,
  followUpQuestions: FollowUpQuestion[] = FOLLOW_UP_QUESTIONS
): AssessmentScores {
  // Get all applicable questions (including triggered follow-ups)
  const applicableFollowUps = getApplicableFollowUps(answers, questions, followUpQuestions)
  const allQuestions = [...questions, ...applicableFollowUps]

  // Calculate category scores
  const categoryScores = calculateCategoryScores(answers, allQuestions)

  // Calculate overall weighted score
  const overallScore = calculateOverallScore(categoryScores)

  // Determine risk profile
  const riskProfile = calculateRiskProfile(answers, allQuestions)

  // Get pathway recommendation
  const pathwayRecommendation = determinePathway(overallScore, riskProfile, categoryScores)

  return {
    overallScore,
    categoryScores,
    riskProfile,
    pathwayRecommendation,
    answeredQuestions: answers.length,
    totalQuestions: allQuestions.length,
    completionPercentage: Math.round((answers.length / allQuestions.length) * 100),
  }
}

/**
 * Get follow-up questions that should be triggered based on answers
 */
export function getApplicableFollowUps(
  answers: IntakeAnswer[],
  questions: IntakeQuestion[],
  followUpQuestions: FollowUpQuestion[]
): FollowUpQuestion[] {
  const applicable: FollowUpQuestion[] = []

  for (const answer of answers) {
    const question = questions.find((q) => q.id === answer.questionId)
    if (!question || !question.options) continue

    // Handle single and multiple choice answers
    const selectedValues = Array.isArray(answer.value) ? answer.value : [answer.value]

    for (const value of selectedValues) {
      const option = question.options.find((o) => o.value === value)
      if (option?.triggersFollowUp) {
        const triggered = followUpQuestions.filter(
          (fq) =>
            option.triggersFollowUp?.includes(fq.id) &&
            fq.parentQuestionId === question.id
        )
        applicable.push(...triggered)
      }
    }
  }

  // Remove duplicates
  return [...new Map(applicable.map((q) => [q.id, q])).values()]
}

/**
 * Calculate scores for each category
 */
export function calculateCategoryScores(
  answers: IntakeAnswer[],
  questions: IntakeQuestion[]
): CategoryScore[] {
  // Group questions by category
  const categories = new Map<string, IntakeQuestion[]>()
  for (const question of questions) {
    const existing = categories.get(question.category) || []
    categories.set(question.category, [...existing, question])
  }

  const categoryScores: CategoryScore[] = []

  for (const [category, categoryQuestions] of categories) {
    const categoryWeight = SCORING_WEIGHTS[category as keyof typeof SCORING_WEIGHTS] || 1

    let totalWeightedScore = 0
    let maxPossible = 0

    for (const question of categoryQuestions) {
      const answer = answers.find((a) => a.questionId === question.id)
      const questionWeight = question.weight

      if (answer && question.options) {
        const score = getAnswerScore(answer, question)
        totalWeightedScore += score * questionWeight
      }

      // Calculate max possible for this question
      if (question.options) {
        const maxOptionScore = Math.max(...question.options.map((o) => o.score))
        maxPossible += maxOptionScore * questionWeight
      }
    }

    // Normalize to 0-100 scale
    const normalizedScore = maxPossible > 0
      ? Math.round((totalWeightedScore / maxPossible) * 100)
      : 0

    const answeredCount = answers.filter((a) =>
      categoryQuestions.some((q) => q.id === a.questionId)
    ).length

    categoryScores.push({
      category,
      score: normalizedScore,
      weight: categoryWeight,
      maxScore: 100,
      answeredCount,
      totalQuestions: categoryQuestions.length,
    })
  }

  return categoryScores
}

/**
 * Calculate the answer score considering multi-select
 */
function getAnswerScore(answer: IntakeAnswer, question: IntakeQuestion): number {
  if (!question.options) return 0

  const selectedValues = Array.isArray(answer.value) ? answer.value : [answer.value]
  let totalScore = 0

  for (const value of selectedValues) {
    const option = question.options.find((o) => o.value === value)
    if (option) {
      totalScore += option.score
    }
  }

  // For multi-select, average the scores
  if (Array.isArray(answer.value) && answer.value.length > 0) {
    totalScore = totalScore / answer.value.length
  }

  return totalScore
}

/**
 * Calculate overall weighted score from category scores
 */
export function calculateOverallScore(categoryScores: CategoryScore[]): number {
  let weightedSum = 0
  let totalWeight = 0

  for (const category of categoryScores) {
    weightedSum += category.score * category.weight
    totalWeight += category.weight
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
}

/**
 * Calculate risk profile based on answers
 */
export function calculateRiskProfile(
  answers: IntakeAnswer[],
  questions: IntakeQuestion[]
): { level: RiskLevel; factors: string[] } {
  const riskFactors: string[] = []
  let highRiskCount = 0
  let criticalRiskCount = 0

  for (const answer of answers) {
    const question = questions.find((q) => q.id === answer.questionId)
    if (!question?.options) continue

    const selectedValues = Array.isArray(answer.value) ? answer.value : [answer.value]

    for (const value of selectedValues) {
      const option = question.options.find((o) => o.value === value)
      if (option?.riskLevel === 'high') {
        highRiskCount++
        riskFactors.push(`${question.category}: ${option.label}`)
      } else if (option?.riskLevel === 'critical') {
        criticalRiskCount++
        riskFactors.push(`CRITICAL - ${question.category}: ${option.label}`)
      }
    }
  }

  let level: RiskLevel = 'low'
  if (criticalRiskCount > 0) {
    level = 'critical'
  } else if (highRiskCount >= 3) {
    level = 'high'
  } else if (highRiskCount >= 1) {
    level = 'medium'
  }

  return { level, factors: riskFactors }
}

/**
 * Determine the recommended pathway
 */
export function determinePathway(
  overallScore: number,
  riskProfile: { level: RiskLevel; factors: string[] },
  categoryScores: CategoryScore[]
): PathwayRecommendation {
  // Apply risk modifier to score
  const riskModifier = RISK_WEIGHTS[riskProfile.level]
  const adjustedScore = Math.round(overallScore * riskModifier)

  // Find weakest categories
  const sortedCategories = [...categoryScores].sort((a, b) => a.score - b.score)
  const weakCategories = sortedCategories
    .slice(0, 2)
    .filter((c) => c.score < 60)
    .map((c) => c.category)

  // Determine pathway
  let pathway: 'accelerated' | 'standard' | 'extended'
  let rationale: string

  if (riskProfile.level === 'critical') {
    pathway = 'extended'
    rationale = 'Critical risk factors require extended timeline for proper mitigation'
  } else if (adjustedScore >= PATHWAY_THRESHOLDS.ACCELERATED) {
    pathway = 'accelerated'
    rationale = 'Strong readiness across all categories supports accelerated implementation'
  } else if (adjustedScore >= PATHWAY_THRESHOLDS.STANDARD) {
    pathway = 'standard'
    rationale = 'Moderate readiness suggests standard implementation timeline'
  } else {
    pathway = 'extended'
    rationale = 'Lower readiness scores indicate need for extended preparation'
  }

  // Add weak category details to rationale
  if (weakCategories.length > 0 && pathway !== 'accelerated') {
    rationale += `. Focus areas: ${weakCategories.join(', ')}`
  }

  return {
    pathway,
    confidence: calculateConfidence(categoryScores),
    rationale,
    estimatedDuration: getEstimatedDuration(pathway),
    focusAreas: weakCategories,
  }
}

/**
 * Calculate confidence level based on score variance
 */
function calculateConfidence(categoryScores: CategoryScore[]): number {
  if (categoryScores.length === 0) return 0

  const scores = categoryScores.map((c) => c.score)
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length
  const stdDev = Math.sqrt(variance)

  // Lower variance = higher confidence
  // Max confidence at stdDev = 0, min at stdDev = 30+
  const confidence = Math.max(0, Math.min(100, 100 - stdDev * 2))
  return Math.round(confidence)
}

/**
 * Get estimated duration based on pathway
 */
function getEstimatedDuration(pathway: 'accelerated' | 'standard' | 'extended'): {
  weeks: number
  label: string
} {
  switch (pathway) {
    case 'accelerated':
      return { weeks: 8, label: '6-8 weeks' }
    case 'standard':
      return { weeks: 12, label: '10-14 weeks' }
    case 'extended':
      return { weeks: 20, label: '16-24 weeks' }
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get the next unanswered question
 */
export function getNextQuestion(
  answers: IntakeAnswer[],
  questions: IntakeQuestion[] = INTAKE_QUESTIONS,
  followUpQuestions: FollowUpQuestion[] = FOLLOW_UP_QUESTIONS
): IntakeQuestion | FollowUpQuestion | null {
  const answeredIds = new Set(answers.map((a) => a.questionId))

  // First, check for unanswered main questions
  for (const question of questions) {
    if (!answeredIds.has(question.id)) {
      return question
    }
  }

  // Then, check for triggered follow-ups that haven't been answered
  const applicableFollowUps = getApplicableFollowUps(answers, questions, followUpQuestions)
  for (const followUp of applicableFollowUps) {
    if (!answeredIds.has(followUp.id)) {
      return followUp
    }
  }

  return null
}

/**
 * Check if assessment is complete
 */
export function isAssessmentComplete(
  answers: IntakeAnswer[],
  questions: IntakeQuestion[] = INTAKE_QUESTIONS,
  followUpQuestions: FollowUpQuestion[] = FOLLOW_UP_QUESTIONS
): boolean {
  return getNextQuestion(answers, questions, followUpQuestions) === null
}

/**
 * Get questions by category
 */
export function getQuestionsByCategory(
  category: string,
  questions: IntakeQuestion[] = INTAKE_QUESTIONS
): IntakeQuestion[] {
  return questions.filter((q) => q.category === category)
}

/**
 * Validate that all required questions are answered
 */
export function validateAnswers(
  answers: IntakeAnswer[],
  questions: IntakeQuestion[]
): { valid: boolean; missingQuestions: string[] } {
  const answeredIds = new Set(answers.map((a) => a.questionId))
  const missingQuestions: string[] = []

  for (const question of questions) {
    if (!answeredIds.has(question.id)) {
      missingQuestions.push(question.id)
    }
  }

  return {
    valid: missingQuestions.length === 0,
    missingQuestions,
  }
}

/**
 * Create an empty assessment
 */
export function createEmptyAssessment(engagementId: string): Omit<IntakeAssessment, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    engagementId,
    answers: [],
    scores: {
      overallScore: 0,
      categoryScores: [],
      riskProfile: { level: 'low', factors: [] },
      pathwayRecommendation: {
        pathway: 'standard',
        confidence: 0,
        rationale: 'Assessment not yet complete',
        estimatedDuration: { weeks: 12, label: '10-14 weeks' },
        focusAreas: [],
      },
      answeredQuestions: 0,
      totalQuestions: INTAKE_QUESTIONS.length,
      completionPercentage: 0,
    },
    recommendedPathway: 'standard',
    status: 'in_progress',
  }
}

/**
 * Format score for display
 */
export function formatScore(score: number): string {
  return `${score}%`
}

/**
 * Get score color based on value
 */
export function getScoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-600'
  if (score >= 50) return 'text-amber-600'
  return 'text-red-600'
}

/**
 * Get risk level color
 */
export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'low':
      return 'text-emerald-600'
    case 'medium':
      return 'text-amber-600'
    case 'high':
      return 'text-red-600'
    case 'critical':
      return 'text-red-700'
  }
}

/**
 * Get pathway badge variant
 */
export function getPathwayVariant(
  pathway: 'accelerated' | 'standard' | 'extended'
): 'success' | 'warning' | 'info' {
  switch (pathway) {
    case 'accelerated':
      return 'success'
    case 'standard':
      return 'info'
    case 'extended':
      return 'warning'
  }
}

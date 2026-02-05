/**
 * Intake Questions Configuration (F7.1, F7.2)
 *
 * Default intake questions with weights and conditional logic.
 */

import type { IntakeQuestion, FollowUpQuestion } from './types'

// =============================================================================
// Main Intake Questions
// =============================================================================

export const INTAKE_QUESTIONS: IntakeQuestion[] = [
  // Data Readiness Category (Weight: High)
  {
    id: 'data_readiness_1',
    text: 'How would you describe your current data infrastructure?',
    type: 'single_choice',
    category: 'data_readiness',
    weight: 3,
    required: true,
    order: 1,
    helpText: 'Consider data storage, accessibility, and integration capabilities',
    options: [
      {
        id: 'dr1_a',
        label: 'Siloed, inconsistent data across systems',
        value: 'siloed',
        score: 20,
        riskLevel: 'high',
        triggersFollowUp: ['data_cleanup_timeline'],
      },
      {
        id: 'dr1_b',
        label: 'Partially integrated with some manual processes',
        value: 'partial',
        score: 50,
        riskLevel: 'medium',
      },
      {
        id: 'dr1_c',
        label: 'Well-integrated with automated data flows',
        value: 'integrated',
        score: 80,
        riskLevel: 'low',
      },
      {
        id: 'dr1_d',
        label: 'Cloud-native with real-time data pipelines',
        value: 'cloud_native',
        score: 100,
        riskLevel: 'low',
      },
    ],
  },
  {
    id: 'data_readiness_2',
    text: 'What is the quality of your historical data?',
    type: 'single_choice',
    category: 'data_readiness',
    weight: 2,
    required: true,
    order: 2,
    options: [
      {
        id: 'dr2_a',
        label: 'Poor - significant gaps and inconsistencies',
        value: 'poor',
        score: 15,
        riskLevel: 'high',
        triggersFollowUp: ['data_quality_plan'],
      },
      {
        id: 'dr2_b',
        label: 'Fair - some issues but generally usable',
        value: 'fair',
        score: 45,
        riskLevel: 'medium',
      },
      {
        id: 'dr2_c',
        label: 'Good - clean with minor exceptions',
        value: 'good',
        score: 75,
        riskLevel: 'low',
      },
      {
        id: 'dr2_d',
        label: 'Excellent - validated and well-maintained',
        value: 'excellent',
        score: 100,
        riskLevel: 'low',
      },
    ],
  },

  // Process Maturity Category (Weight: High)
  {
    id: 'process_maturity_1',
    text: 'How well-documented are your current business processes?',
    type: 'single_choice',
    category: 'process_maturity',
    weight: 3,
    required: true,
    order: 3,
    options: [
      {
        id: 'pm1_a',
        label: 'Not documented - tribal knowledge only',
        value: 'not_documented',
        score: 10,
        riskLevel: 'high',
        triggersFollowUp: ['documentation_resources'],
      },
      {
        id: 'pm1_b',
        label: 'Partially documented - key processes only',
        value: 'partial',
        score: 40,
        riskLevel: 'medium',
      },
      {
        id: 'pm1_c',
        label: 'Well documented - standard procedures exist',
        value: 'documented',
        score: 70,
        riskLevel: 'low',
      },
      {
        id: 'pm1_d',
        label: 'Fully documented with version control',
        value: 'fully_documented',
        score: 100,
        riskLevel: 'low',
      },
    ],
  },
  {
    id: 'process_maturity_2',
    text: 'Have you identified specific processes for automation?',
    type: 'single_choice',
    category: 'process_maturity',
    weight: 2,
    required: true,
    order: 4,
    options: [
      {
        id: 'pm2_a',
        label: 'No - still exploring possibilities',
        value: 'no',
        score: 20,
        riskLevel: 'medium',
      },
      {
        id: 'pm2_b',
        label: 'Generally - have some ideas but not validated',
        value: 'general',
        score: 50,
        riskLevel: 'medium',
      },
      {
        id: 'pm2_c',
        label: 'Yes - prioritized list with business cases',
        value: 'prioritized',
        score: 85,
        riskLevel: 'low',
      },
      {
        id: 'pm2_d',
        label: 'Yes - with ROI analysis completed',
        value: 'roi_complete',
        score: 100,
        riskLevel: 'low',
      },
    ],
  },

  // Stakeholder Alignment Category (Weight: Medium-High)
  {
    id: 'stakeholder_1',
    text: 'What level of executive sponsorship exists for this initiative?',
    type: 'single_choice',
    category: 'stakeholder_alignment',
    weight: 3,
    required: true,
    order: 5,
    options: [
      {
        id: 'st1_a',
        label: 'None - grassroots effort',
        value: 'none',
        score: 15,
        riskLevel: 'high',
        triggersFollowUp: ['sponsor_identification'],
      },
      {
        id: 'st1_b',
        label: 'Limited - department level only',
        value: 'limited',
        score: 40,
        riskLevel: 'medium',
      },
      {
        id: 'st1_c',
        label: 'Strong - VP or Director level',
        value: 'strong',
        score: 75,
        riskLevel: 'low',
      },
      {
        id: 'st1_d',
        label: 'Executive - C-suite backing',
        value: 'executive',
        score: 100,
        riskLevel: 'low',
      },
    ],
  },
  {
    id: 'stakeholder_2',
    text: 'How would you describe team readiness for change?',
    type: 'single_choice',
    category: 'stakeholder_alignment',
    weight: 2,
    required: true,
    order: 6,
    options: [
      {
        id: 'st2_a',
        label: 'Resistant - significant pushback expected',
        value: 'resistant',
        score: 20,
        riskLevel: 'high',
        triggersFollowUp: ['change_management_needs'],
      },
      {
        id: 'st2_b',
        label: 'Cautious - will need convincing',
        value: 'cautious',
        score: 45,
        riskLevel: 'medium',
      },
      {
        id: 'st2_c',
        label: 'Open - willing to try new approaches',
        value: 'open',
        score: 75,
        riskLevel: 'low',
      },
      {
        id: 'st2_d',
        label: 'Eager - actively requesting automation',
        value: 'eager',
        score: 100,
        riskLevel: 'low',
      },
    ],
  },

  // Timeline Category (Weight: Medium)
  {
    id: 'timeline_1',
    text: 'What is your desired timeline for initial results?',
    type: 'single_choice',
    category: 'timeline',
    weight: 2,
    required: true,
    order: 7,
    options: [
      {
        id: 'tl1_a',
        label: 'Immediate - within 4 weeks',
        value: 'immediate',
        score: 30,
        riskLevel: 'high',
        triggersFollowUp: ['timeline_flexibility'],
      },
      {
        id: 'tl1_b',
        label: 'Short-term - 1-3 months',
        value: 'short',
        score: 60,
        riskLevel: 'medium',
      },
      {
        id: 'tl1_c',
        label: 'Medium-term - 3-6 months',
        value: 'medium',
        score: 85,
        riskLevel: 'low',
      },
      {
        id: 'tl1_d',
        label: 'Flexible - focused on quality over speed',
        value: 'flexible',
        score: 100,
        riskLevel: 'low',
      },
    ],
  },

  // Budget Category (Weight: Medium)
  {
    id: 'budget_1',
    text: 'What is the allocated budget range for this initiative?',
    type: 'single_choice',
    category: 'budget',
    weight: 2,
    required: true,
    order: 8,
    options: [
      {
        id: 'bg1_a',
        label: 'Limited - under $25,000',
        value: 'limited',
        score: 30,
        riskLevel: 'medium',
      },
      {
        id: 'bg1_b',
        label: 'Moderate - $25,000 - $100,000',
        value: 'moderate',
        score: 60,
        riskLevel: 'low',
      },
      {
        id: 'bg1_c',
        label: 'Substantial - $100,000 - $500,000',
        value: 'substantial',
        score: 85,
        riskLevel: 'low',
      },
      {
        id: 'bg1_d',
        label: 'Enterprise - $500,000+',
        value: 'enterprise',
        score: 100,
        riskLevel: 'low',
      },
    ],
  },
  {
    id: 'budget_2',
    text: 'Is budget approved or still pending?',
    type: 'single_choice',
    category: 'budget',
    weight: 1,
    required: true,
    order: 9,
    options: [
      {
        id: 'bg2_a',
        label: 'Pending - requires business case',
        value: 'pending',
        score: 30,
        riskLevel: 'medium',
        triggersFollowUp: ['budget_approval_timeline'],
      },
      {
        id: 'bg2_b',
        label: 'Conditionally approved',
        value: 'conditional',
        score: 60,
        riskLevel: 'low',
      },
      {
        id: 'bg2_c',
        label: 'Fully approved and allocated',
        value: 'approved',
        score: 100,
        riskLevel: 'low',
      },
    ],
  },

  // Overall Assessment
  {
    id: 'overall_1',
    text: 'On a scale of 1-10, how critical is this initiative to your business strategy?',
    type: 'scale',
    category: 'overall',
    weight: 2,
    required: true,
    order: 10,
    scaleMin: 1,
    scaleMax: 10,
    scaleLabels: { min: 'Nice to have', max: 'Mission critical' },
  },
]

// =============================================================================
// Follow-up Questions (F7.2)
// =============================================================================

export const FOLLOW_UP_QUESTIONS: FollowUpQuestion[] = [
  {
    id: 'data_cleanup_timeline',
    parentQuestionId: 'data_readiness_1',
    triggerOptionValue: 'siloed',
    text: 'What is your estimated timeline for data cleanup and integration?',
    type: 'single_choice',
    category: 'data_readiness',
    weight: 2,
    impactMultiplier: 0.5,
    required: true,
    order: 1,
    options: [
      {
        id: 'dct_a',
        label: 'Already in progress - 1-2 months',
        value: 'in_progress',
        score: 70,
        riskLevel: 'low',
      },
      {
        id: 'dct_b',
        label: 'Planned - 3-6 months',
        value: 'planned',
        score: 50,
        riskLevel: 'medium',
      },
      {
        id: 'dct_c',
        label: 'Not planned - will need to start fresh',
        value: 'not_planned',
        score: 20,
        riskLevel: 'high',
      },
    ],
  },
  {
    id: 'data_quality_plan',
    parentQuestionId: 'data_readiness_2',
    triggerOptionValue: 'poor',
    text: 'Do you have a data quality improvement plan in place?',
    type: 'single_choice',
    category: 'data_readiness',
    weight: 1,
    impactMultiplier: 0.3,
    required: true,
    order: 2,
    options: [
      {
        id: 'dqp_a',
        label: 'Yes - actively implementing',
        value: 'implementing',
        score: 70,
        riskLevel: 'low',
      },
      {
        id: 'dqp_b',
        label: 'Yes - planned but not started',
        value: 'planned',
        score: 45,
        riskLevel: 'medium',
      },
      {
        id: 'dqp_c',
        label: 'No - need guidance',
        value: 'no',
        score: 20,
        riskLevel: 'high',
      },
    ],
  },
  {
    id: 'documentation_resources',
    parentQuestionId: 'process_maturity_1',
    triggerOptionValue: 'not_documented',
    text: 'Are resources available for process documentation?',
    type: 'single_choice',
    category: 'process_maturity',
    weight: 1,
    impactMultiplier: 0.4,
    required: true,
    order: 3,
    options: [
      {
        id: 'dr_a',
        label: 'Yes - dedicated team available',
        value: 'dedicated',
        score: 80,
        riskLevel: 'low',
      },
      {
        id: 'dr_b',
        label: 'Partially - can allocate part-time',
        value: 'partial',
        score: 50,
        riskLevel: 'medium',
      },
      {
        id: 'dr_c',
        label: 'No - would need external help',
        value: 'external',
        score: 30,
        riskLevel: 'medium',
      },
    ],
  },
  {
    id: 'sponsor_identification',
    parentQuestionId: 'stakeholder_1',
    triggerOptionValue: 'none',
    text: 'Is there potential to identify an executive sponsor?',
    type: 'single_choice',
    category: 'stakeholder_alignment',
    weight: 2,
    impactMultiplier: 0.5,
    required: true,
    order: 4,
    options: [
      {
        id: 'si_a',
        label: 'Yes - already have someone in mind',
        value: 'identified',
        score: 70,
        riskLevel: 'low',
      },
      {
        id: 'si_b',
        label: 'Maybe - would need to build the case',
        value: 'maybe',
        score: 40,
        riskLevel: 'medium',
      },
      {
        id: 'si_c',
        label: 'Unlikely - organization is risk-averse',
        value: 'unlikely',
        score: 15,
        riskLevel: 'high',
      },
    ],
  },
  {
    id: 'change_management_needs',
    parentQuestionId: 'stakeholder_2',
    triggerOptionValue: 'resistant',
    text: 'What change management support is available?',
    type: 'single_choice',
    category: 'stakeholder_alignment',
    weight: 1,
    impactMultiplier: 0.4,
    required: true,
    order: 5,
    options: [
      {
        id: 'cmn_a',
        label: 'Internal change management team',
        value: 'internal',
        score: 75,
        riskLevel: 'low',
      },
      {
        id: 'cmn_b',
        label: 'HR support available',
        value: 'hr',
        score: 50,
        riskLevel: 'medium',
      },
      {
        id: 'cmn_c',
        label: 'Would need external consultants',
        value: 'external',
        score: 30,
        riskLevel: 'medium',
      },
    ],
  },
  {
    id: 'timeline_flexibility',
    parentQuestionId: 'timeline_1',
    triggerOptionValue: 'immediate',
    text: 'If the recommended timeline is longer, would you be flexible?',
    type: 'single_choice',
    category: 'timeline',
    weight: 1,
    impactMultiplier: 0.3,
    required: true,
    order: 6,
    options: [
      {
        id: 'tf_a',
        label: 'Yes - quality is more important',
        value: 'flexible',
        score: 80,
        riskLevel: 'low',
      },
      {
        id: 'tf_b',
        label: 'Somewhat - within reason',
        value: 'somewhat',
        score: 50,
        riskLevel: 'medium',
      },
      {
        id: 'tf_c',
        label: 'No - deadline is fixed',
        value: 'fixed',
        score: 20,
        riskLevel: 'high',
      },
    ],
  },
  {
    id: 'budget_approval_timeline',
    parentQuestionId: 'budget_2',
    triggerOptionValue: 'pending',
    text: 'When is the budget expected to be approved?',
    type: 'single_choice',
    category: 'budget',
    weight: 1,
    impactMultiplier: 0.3,
    required: true,
    order: 7,
    options: [
      {
        id: 'bat_a',
        label: 'Within 2 weeks',
        value: '2_weeks',
        score: 80,
        riskLevel: 'low',
      },
      {
        id: 'bat_b',
        label: 'Within 1-2 months',
        value: '1_2_months',
        score: 50,
        riskLevel: 'medium',
      },
      {
        id: 'bat_c',
        label: 'Uncertain - depends on business case',
        value: 'uncertain',
        score: 25,
        riskLevel: 'high',
      },
    ],
  },
]

// =============================================================================
// Scoring Weights
// =============================================================================

export const SCORING_WEIGHTS: Record<string, number> = {
  data_readiness: 1.2,
  process_maturity: 1.0,
  technical_infrastructure: 1.1,
  organizational_readiness: 1.0,
  stakeholder_alignment: 0.9,
  timeline: 0.8,
  budget: 0.8,
  overall: 1.0,
}

// =============================================================================
// Category Configuration
// =============================================================================

export const CATEGORIES = {
  data_readiness: {
    name: 'Data Readiness',
    description: 'Assesses the quality and accessibility of your data',
    defaultWeight: 3,
    icon: 'database',
  },
  process_maturity: {
    name: 'Process Maturity',
    description: 'Evaluates how well-defined and documented your processes are',
    defaultWeight: 3,
    icon: 'workflow',
  },
  stakeholder_alignment: {
    name: 'Stakeholder Alignment',
    description: 'Measures organizational readiness and support',
    defaultWeight: 2,
    icon: 'users',
  },
  timeline: {
    name: 'Timeline',
    description: 'Considers urgency and scheduling constraints',
    defaultWeight: 2,
    icon: 'clock',
  },
  budget: {
    name: 'Budget',
    description: 'Evaluates financial readiness and constraints',
    defaultWeight: 2,
    icon: 'dollar-sign',
  },
  overall: {
    name: 'Overall',
    description: 'General strategic importance',
    defaultWeight: 2,
    icon: 'target',
  },
}

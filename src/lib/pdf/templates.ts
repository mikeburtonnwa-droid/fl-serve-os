/**
 * PDF Templates (F4.3-F4.7)
 *
 * Defines the structure and layout for each PDF template type.
 * Templates map artifact content to PDF sections.
 *
 * User Stories: US-018, US-020
 */

import type { PDFTemplate, PDFSection, PDFTemplateType } from './types'

// =============================================================================
// ROI Calculator Template (F4.3)
// =============================================================================

const roiCalculatorSections: PDFSection[] = [
  {
    id: 'header',
    title: 'ROI Analysis Report',
    type: 'header',
    config: {
      includeDate: true,
      includeClientName: true,
    },
  },
  {
    id: 'executive-summary',
    title: 'Executive Summary',
    type: 'text',
    dataKey: 'executiveSummary',
    config: {
      style: 'highlight',
    },
  },
  {
    id: 'key-metrics',
    title: 'Key Metrics',
    type: 'metrics',
    dataKey: 'keyMetrics',
    config: {
      layout: 'grid',
      columns: 3,
      metrics: [
        { key: 'totalInvestment', label: 'Total Investment', format: 'currency' },
        { key: 'annualSavings', label: 'Annual Savings', format: 'currency' },
        { key: 'paybackPeriod', label: 'Payback Period', format: 'months' },
        { key: 'threeYearROI', label: '3-Year ROI', format: 'percentage' },
        { key: 'netPresentValue', label: 'NPV', format: 'currency' },
        { key: 'internalRateOfReturn', label: 'IRR', format: 'percentage' },
      ],
    },
  },
  {
    id: 'payback-timeline',
    title: 'Payback Timeline',
    type: 'chart',
    dataKey: 'paybackTimeline',
    config: {
      chartType: 'area',
      showBreakeven: true,
      xAxisLabel: 'Months',
      yAxisLabel: 'Cumulative Value ($)',
    },
  },
  {
    id: 'monthly-savings',
    title: 'Monthly Savings Breakdown',
    type: 'chart',
    dataKey: 'monthlySavings',
    config: {
      chartType: 'bar',
      stacked: false,
      showTrend: true,
    },
  },
  {
    id: 'cost-breakdown',
    title: 'Cost Breakdown',
    type: 'table',
    dataKey: 'costBreakdown',
    config: {
      columns: [
        { key: 'category', header: 'Category', width: '40%' },
        { key: 'oneTime', header: 'One-Time Cost', width: '30%', format: 'currency' },
        { key: 'recurring', header: 'Recurring (Annual)', width: '30%', format: 'currency' },
      ],
      showTotals: true,
    },
  },
  {
    id: 'savings-breakdown',
    title: 'Savings Breakdown',
    type: 'table',
    dataKey: 'savingsBreakdown',
    config: {
      columns: [
        { key: 'category', header: 'Category', width: '50%' },
        { key: 'annualSavings', header: 'Annual Savings', width: '25%', format: 'currency' },
        { key: 'source', header: 'Source', width: '25%' },
      ],
      showTotals: true,
    },
  },
  {
    id: 'assumptions',
    title: 'Assumptions & Parameters',
    type: 'list',
    dataKey: 'assumptions',
    config: {
      style: 'numbered',
    },
  },
  {
    id: 'methodology',
    title: 'Methodology',
    type: 'text',
    dataKey: 'methodology',
  },
]

// =============================================================================
// Implementation Plan Template (F4.4)
// =============================================================================

const implementationPlanSections: PDFSection[] = [
  {
    id: 'header',
    title: 'Implementation Plan',
    type: 'header',
    config: {
      includeDate: true,
      includeClientName: true,
    },
  },
  {
    id: 'overview',
    title: 'Project Overview',
    type: 'text',
    dataKey: 'overview',
  },
  {
    id: 'objectives',
    title: 'Project Objectives',
    type: 'list',
    dataKey: 'objectives',
    config: {
      style: 'bullet',
    },
  },
  {
    id: 'timeline',
    title: 'Project Timeline',
    type: 'chart',
    dataKey: 'timeline',
    config: {
      chartType: 'timeline',
      showMilestones: true,
      showPhases: true,
    },
  },
  {
    id: 'phases',
    title: 'Implementation Phases',
    type: 'table',
    dataKey: 'phases',
    config: {
      columns: [
        { key: 'phase', header: 'Phase', width: '20%' },
        { key: 'description', header: 'Description', width: '40%' },
        { key: 'duration', header: 'Duration', width: '15%' },
        { key: 'deliverables', header: 'Deliverables', width: '25%' },
      ],
    },
  },
  {
    id: 'resources',
    title: 'Resource Requirements',
    type: 'table',
    dataKey: 'resources',
    config: {
      columns: [
        { key: 'role', header: 'Role', width: '30%' },
        { key: 'responsibility', header: 'Responsibility', width: '40%' },
        { key: 'allocation', header: 'Allocation', width: '15%' },
        { key: 'source', header: 'Source', width: '15%' },
      ],
    },
  },
  {
    id: 'risks',
    title: 'Risk Assessment',
    type: 'table',
    dataKey: 'risks',
    config: {
      columns: [
        { key: 'risk', header: 'Risk', width: '35%' },
        { key: 'impact', header: 'Impact', width: '15%' },
        { key: 'probability', header: 'Probability', width: '15%' },
        { key: 'mitigation', header: 'Mitigation Strategy', width: '35%' },
      ],
      colorCode: {
        field: 'impact',
        high: '#EF4444',
        medium: '#F59E0B',
        low: '#22C55E',
      },
    },
  },
  {
    id: 'success-criteria',
    title: 'Success Criteria',
    type: 'list',
    dataKey: 'successCriteria',
    config: {
      style: 'checkbox',
    },
  },
  {
    id: 'next-steps',
    title: 'Next Steps',
    type: 'list',
    dataKey: 'nextSteps',
    config: {
      style: 'numbered',
    },
  },
]

// =============================================================================
// Future State Template (F4.5)
// =============================================================================

const futureStateSections: PDFSection[] = [
  {
    id: 'header',
    title: 'Future State Vision',
    type: 'header',
    config: {
      includeDate: true,
      includeClientName: true,
    },
  },
  {
    id: 'vision-statement',
    title: 'Vision Statement',
    type: 'text',
    dataKey: 'visionStatement',
    config: {
      style: 'highlight',
      fontSize: 14,
    },
  },
  {
    id: 'current-vs-future',
    title: 'Current State vs Future State',
    type: 'table',
    dataKey: 'comparison',
    config: {
      columns: [
        { key: 'dimension', header: 'Dimension', width: '25%' },
        { key: 'currentState', header: 'Current State', width: '37.5%' },
        { key: 'futureState', header: 'Future State', width: '37.5%' },
      ],
      highlightDifferences: true,
    },
  },
  {
    id: 'capabilities',
    title: 'Target Capabilities',
    type: 'list',
    dataKey: 'capabilities',
    config: {
      style: 'bullet',
      grouped: true,
    },
  },
  {
    id: 'technology-stack',
    title: 'Technology Stack',
    type: 'table',
    dataKey: 'technologyStack',
    config: {
      columns: [
        { key: 'layer', header: 'Layer', width: '25%' },
        { key: 'current', header: 'Current', width: '25%' },
        { key: 'proposed', header: 'Proposed', width: '25%' },
        { key: 'rationale', header: 'Rationale', width: '25%' },
      ],
    },
  },
  {
    id: 'benefits',
    title: 'Expected Benefits',
    type: 'metrics',
    dataKey: 'benefits',
    config: {
      layout: 'list',
      showIcons: true,
    },
  },
  {
    id: 'roadmap',
    title: 'Transformation Roadmap',
    type: 'chart',
    dataKey: 'roadmap',
    config: {
      chartType: 'timeline',
      showQuarters: true,
    },
  },
]

// =============================================================================
// Client Handoff Template (F4.6)
// =============================================================================

const clientHandoffSections: PDFSection[] = [
  {
    id: 'header',
    title: 'Engagement Summary & Handoff',
    type: 'header',
    config: {
      includeDate: true,
      includeClientName: true,
    },
  },
  {
    id: 'engagement-overview',
    title: 'Engagement Overview',
    type: 'text',
    dataKey: 'engagementOverview',
  },
  {
    id: 'deliverables',
    title: 'Deliverables Summary',
    type: 'table',
    dataKey: 'deliverables',
    config: {
      columns: [
        { key: 'deliverable', header: 'Deliverable', width: '40%' },
        { key: 'status', header: 'Status', width: '20%' },
        { key: 'location', header: 'Location', width: '40%' },
      ],
      statusColors: {
        complete: '#22C55E',
        'in progress': '#F59E0B',
        pending: '#94A3B8',
      },
    },
  },
  {
    id: 'key-findings',
    title: 'Key Findings',
    type: 'list',
    dataKey: 'keyFindings',
    config: {
      style: 'numbered',
    },
  },
  {
    id: 'recommendations',
    title: 'Recommendations',
    type: 'list',
    dataKey: 'recommendations',
    config: {
      style: 'bullet',
      priority: true,
    },
  },
  {
    id: 'knowledge-transfer',
    title: 'Knowledge Transfer',
    type: 'table',
    dataKey: 'knowledgeTransfer',
    config: {
      columns: [
        { key: 'topic', header: 'Topic', width: '30%' },
        { key: 'description', header: 'Description', width: '40%' },
        { key: 'resources', header: 'Resources', width: '30%' },
      ],
    },
  },
  {
    id: 'contacts',
    title: 'Key Contacts',
    type: 'table',
    dataKey: 'contacts',
    config: {
      columns: [
        { key: 'name', header: 'Name', width: '25%' },
        { key: 'role', header: 'Role', width: '25%' },
        { key: 'email', header: 'Email', width: '30%' },
        { key: 'phone', header: 'Phone', width: '20%' },
      ],
    },
  },
  {
    id: 'signatures',
    title: 'Acceptance',
    type: 'signature',
    config: {
      signatures: [
        { label: 'Client Representative', dateLabel: 'Date' },
        { label: 'Frontier Logic Consultant', dateLabel: 'Date' },
      ],
    },
  },
]

// =============================================================================
// Case Study Template (F4.7)
// =============================================================================

const caseStudySections: PDFSection[] = [
  {
    id: 'header',
    title: 'Case Study',
    type: 'header',
    config: {
      includeClientName: true,
      anonymize: true, // Option to anonymize for public use
    },
  },
  {
    id: 'at-a-glance',
    title: 'At a Glance',
    type: 'metrics',
    dataKey: 'atAGlance',
    config: {
      layout: 'sidebar',
      metrics: [
        { key: 'industry', label: 'Industry' },
        { key: 'companySize', label: 'Company Size' },
        { key: 'duration', label: 'Engagement Duration' },
        { key: 'primaryOutcome', label: 'Primary Outcome' },
      ],
    },
  },
  {
    id: 'challenge',
    title: 'The Challenge',
    type: 'text',
    dataKey: 'challenge',
  },
  {
    id: 'solution',
    title: 'Our Solution',
    type: 'text',
    dataKey: 'solution',
  },
  {
    id: 'approach',
    title: 'Approach',
    type: 'list',
    dataKey: 'approach',
    config: {
      style: 'numbered',
    },
  },
  {
    id: 'results',
    title: 'Results',
    type: 'metrics',
    dataKey: 'results',
    config: {
      layout: 'grid',
      columns: 2,
      showComparison: true,
    },
  },
  {
    id: 'testimonial',
    title: 'Client Testimonial',
    type: 'text',
    dataKey: 'testimonial',
    config: {
      style: 'quote',
      attribution: true,
    },
  },
  {
    id: 'lessons-learned',
    title: 'Key Takeaways',
    type: 'list',
    dataKey: 'lessonsLearned',
    config: {
      style: 'bullet',
    },
  },
]

// =============================================================================
// Generic Template
// =============================================================================

const genericSections: PDFSection[] = [
  {
    id: 'header',
    title: 'Document',
    type: 'header',
    config: {
      includeDate: true,
      includeClientName: true,
    },
  },
  {
    id: 'content',
    title: 'Content',
    type: 'text',
    dataKey: 'content',
  },
]

// =============================================================================
// Template Registry
// =============================================================================

export const PDF_TEMPLATES: Record<PDFTemplateType, PDFTemplate> = {
  roi_calculator: {
    id: 'roi_calculator',
    name: 'ROI Calculator Report',
    description: 'Comprehensive ROI analysis with charts, metrics, and financial projections',
    sections: roiCalculatorSections,
  },
  implementation_plan: {
    id: 'implementation_plan',
    name: 'Implementation Plan',
    description: 'Project plan with timeline, phases, resources, and risk assessment',
    sections: implementationPlanSections,
  },
  future_state: {
    id: 'future_state',
    name: 'Future State Vision',
    description: 'Vision document comparing current and target states with roadmap',
    sections: futureStateSections,
  },
  client_handoff: {
    id: 'client_handoff',
    name: 'Client Handoff Package',
    description: 'Engagement summary with deliverables and knowledge transfer',
    sections: clientHandoffSections,
  },
  case_study: {
    id: 'case_study',
    name: 'Case Study',
    description: 'Success story format for marketing and reference',
    sections: caseStudySections,
  },
  generic: {
    id: 'generic',
    name: 'Generic Document',
    description: 'Simple document with header and content',
    sections: genericSections,
  },
}

/**
 * Get a PDF template by type
 */
export function getPDFTemplate(type: PDFTemplateType): PDFTemplate {
  return PDF_TEMPLATES[type] || PDF_TEMPLATES.generic
}

/**
 * Map artifact template ID to PDF template type
 */
export function artifactTemplateToPDFTemplate(artifactTemplateId: string): PDFTemplateType {
  const mapping: Record<string, PDFTemplateType> = {
    'TPL-09': 'roi_calculator',
    'TPL-10': 'implementation_plan',
    'TPL-11': 'future_state',
    'TPL-12': 'client_handoff',
    'TPL-13': 'case_study',
  }

  return mapping[artifactTemplateId] || 'generic'
}

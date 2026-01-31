// SERVE OS Workflow Guidance Content Library
// Educational content for internal users on the SERVE framework, stages, and artifacts

import type { StationId, TemplateId, Pathway } from './workflow'

// =============================================================================
// SERVE FRAMEWORK OVERVIEW
// =============================================================================

export const SERVE_FRAMEWORK = {
  name: 'SERVE',
  tagline: 'Standardize • Establish • Re-engineer • Verify • Expand',
  description: `
    SERVE is Frontier Logic's proprietary methodology for delivering AI implementation consulting services.
    It provides a structured, repeatable approach that ensures quality, consistency, and measurable outcomes
    for every client engagement.
  `,
  valueProposition: `
    We help organizations unlock the full potential of AI by bridging the gap between cutting-edge technology
    and practical business implementation. Our SERVE methodology ensures that every engagement delivers
    tangible ROI through carefully validated, client-ready deliverables.
  `,
  phases: [
    {
      letter: 'S',
      name: 'Standardize',
      description: 'Establish consistent intake and discovery processes',
      keyActivities: [
        'Conduct structured intake assessment',
        'Complete Client Discovery Brief (TPL-01)',
        'Determine appropriate service pathway',
        'Set engagement parameters and expectations',
      ],
      outcome: 'Clear understanding of client needs and aligned service pathway',
    },
    {
      letter: 'E',
      name: 'Establish',
      description: 'Document current state and identify opportunities',
      keyActivities: [
        'Map existing workflows and processes',
        'Run Discovery Station (S-01) analysis',
        'Create Current State Map (TPL-02)',
        'Identify pain points and bottlenecks',
      ],
      outcome: 'Comprehensive current state documentation with identified opportunities',
    },
    {
      letter: 'R',
      name: 'Re-engineer',
      description: 'Design AI-enhanced future state and implementation plan',
      keyActivities: [
        'Run Scoping Station (S-02) for solution design',
        'Create Future State Design (TPL-03)',
        'Develop Implementation Plan (TPL-05)',
        'Calculate ROI and build business case (TPL-09)',
      ],
      outcome: 'Complete solution design with clear implementation roadmap',
    },
    {
      letter: 'V',
      name: 'Verify',
      description: 'Quality assurance and validation of all deliverables',
      keyActivities: [
        'Run QA Station (S-03) for T2 review',
        'Validate all client-facing deliverables',
        'Ensure consistency and completeness',
        'Prepare Client Handoff package (TPL-10)',
      ],
      outcome: 'Validated, client-ready deliverable package',
    },
    {
      letter: 'E',
      name: 'Expand',
      description: 'Deliver value and enable ongoing success',
      keyActivities: [
        'Present deliverables to client',
        'Conduct knowledge transfer sessions',
        'Create Case Study for portfolio (TPL-12)',
        'Identify expansion opportunities',
      ],
      outcome: 'Successful delivery with documented success story',
    },
  ],
}

// =============================================================================
// SERVICE PATHWAYS
// =============================================================================

export interface PathwayGuidance {
  id: Pathway
  name: string
  scoreRange: string
  duration: string
  targetClient: string
  description: string
  jobsToBeDone: string[]
  keyDeliverables: string[]
  successMetrics: string[]
  tips: string[]
  commonPitfalls: string[]
}

export const PATHWAY_GUIDANCE: Record<Pathway, PathwayGuidance> = {
  knowledge_spine: {
    id: 'knowledge_spine',
    name: 'Knowledge Spine',
    scoreRange: '0-7',
    duration: '2-4 weeks',
    targetClient: 'Organizations new to AI with foundational knowledge gaps',
    description: `
      The Knowledge Spine pathway focuses on building AI literacy and foundational documentation.
      It's designed for clients who need to understand AI capabilities before implementing solutions.
      This pathway emphasizes education, documentation frameworks, and readiness assessment.
    `,
    jobsToBeDone: [
      'Build organizational AI literacy and understanding',
      'Create foundational AI documentation and policies',
      'Assess current technology readiness',
      'Develop AI adoption roadmap',
      'Establish governance frameworks',
    ],
    keyDeliverables: [
      'Client Discovery Brief with readiness assessment',
      'Current State Map of technology landscape',
      'AI Policy and Governance Framework (Future State)',
      'Implementation Plan for knowledge building',
      'Training and enablement recommendations',
    ],
    successMetrics: [
      'Stakeholder AI literacy improvement (pre/post assessment)',
      'Documentation coverage score',
      'Policy adoption rate',
      'Time to first AI experiment',
    ],
    tips: [
      'Focus on education and demystification first',
      'Use simple language and avoid jargon',
      'Provide concrete examples relevant to their industry',
      'Build confidence before discussing advanced solutions',
    ],
    commonPitfalls: [
      'Jumping to implementation too quickly',
      'Overwhelming stakeholders with technical details',
      'Underestimating change management needs',
      'Not securing executive sponsorship early',
    ],
  },
  roi_audit: {
    id: 'roi_audit',
    name: 'ROI Audit',
    scoreRange: '8-14',
    duration: '3-6 weeks',
    targetClient: 'Organizations seeking to quantify AI investment potential',
    description: `
      The ROI Audit pathway is designed for clients who understand AI conceptually but need
      a data-driven business case for investment. This pathway focuses on process analysis,
      value quantification, and building a compelling ROI narrative.
    `,
    jobsToBeDone: [
      'Identify highest-value automation opportunities',
      'Quantify potential time and cost savings',
      'Build executive-ready business case',
      'Prioritize implementation candidates',
      'Validate feasibility and constraints',
    ],
    keyDeliverables: [
      'Client Discovery Brief with process inventory',
      'Current State Map with time/cost analysis',
      'Opportunity Assessment (Future State)',
      'ROI Calculator with detailed projections',
      'Prioritized implementation roadmap',
    ],
    successMetrics: [
      'Total addressable savings identified',
      'Number of automation candidates surfaced',
      'Executive approval for next phase',
      'Accuracy of initial estimates (post-implementation)',
    ],
    tips: [
      'Get access to real operational data early',
      'Interview both managers and frontline workers',
      'Be conservative in ROI estimates initially',
      'Document assumptions clearly for credibility',
    ],
    commonPitfalls: [
      'Over-promising savings without validation',
      'Ignoring hidden costs (change management, training)',
      'Focusing only on easy wins vs. strategic value',
      'Not involving finance stakeholders',
    ],
  },
  workflow_sprint: {
    id: 'workflow_sprint',
    name: 'Workflow Sprint',
    scoreRange: '15-21',
    duration: '4-8 weeks',
    targetClient: 'AI-ready organizations needing rapid implementation',
    description: `
      The Workflow Sprint pathway is for clients ready to implement AI solutions immediately.
      These clients have AI experience, clear use cases, and organizational buy-in.
      This pathway focuses on rapid design, implementation planning, and delivery.
    `,
    jobsToBeDone: [
      'Design production-ready AI workflows',
      'Create detailed technical specifications',
      'Build complete implementation package',
      'Enable internal team for execution',
      'Establish success measurement framework',
    ],
    keyDeliverables: [
      'Client Discovery Brief with technical requirements',
      'Current State Map with integration points',
      'Future State Design with technical architecture',
      'Implementation Plan with sprint schedules',
      'ROI Calculator with KPI dashboard specs',
      'Complete Client Handoff package',
    ],
    successMetrics: [
      'Time to production deployment',
      'First-month adoption rate',
      'Achieved vs. projected savings',
      'User satisfaction scores',
    ],
    tips: [
      'Maintain velocity while ensuring quality',
      'Use agile/sprint methodology',
      'Include client team in design sessions',
      'Plan for immediate quick wins',
    ],
    commonPitfalls: [
      'Moving too fast without proper validation',
      'Scope creep from eager stakeholders',
      'Underestimating integration complexity',
      'Not planning for post-deployment support',
    ],
  },
}

// =============================================================================
// ARTIFACT GUIDANCE
// =============================================================================

export interface ArtifactGuidance {
  templateId: TemplateId
  name: string
  stage: string
  tier: 'T1' | 'T2'
  purpose: string
  description: string
  keyComponents: string[]
  qualityCriteria: string[]
  requiredInputs: string[]
  expectedOutputs: string[]
  estimatedTime: string
  tips: string[]
  examples: {
    title: string
    description: string
  }[]
}

export const ARTIFACT_GUIDANCE: Record<TemplateId, ArtifactGuidance> = {
  'TPL-01': {
    templateId: 'TPL-01',
    name: 'Client Discovery Brief',
    stage: 'Standardize',
    tier: 'T1',
    purpose: 'Capture essential client information to inform pathway selection and engagement approach',
    description: `
      The Client Discovery Brief is the foundation document for every engagement. It captures
      critical information about the client's organization, goals, challenges, and readiness.
      This document drives the intake scoring algorithm and determines the service pathway.
    `,
    keyComponents: [
      'Company overview and industry context',
      'Key stakeholders and decision makers',
      'Strategic goals and AI objectives',
      'Current technology landscape',
      'Pain points and challenges',
      'Budget and timeline expectations',
      'Risk factors and constraints',
    ],
    qualityCriteria: [
      'All required fields completed with specific details',
      'Stakeholder information verified',
      'Goals are measurable and time-bound',
      'Pain points clearly articulated',
      'No conflicting information',
    ],
    requiredInputs: [
      'Client intake call notes',
      'Company research and background',
      'Stakeholder contact information',
      'Initial requirements documentation',
    ],
    expectedOutputs: [
      'Completed Discovery Brief document',
      'Intake score calculation (0-21)',
      'Recommended service pathway',
      'Initial risk assessment',
    ],
    estimatedTime: '1-2 hours',
    tips: [
      'Schedule a structured discovery call with key stakeholders',
      'Use the intake assessment questions as a framework',
      'Document direct quotes where possible',
      'Validate understanding before finalizing',
    ],
    examples: [
      {
        title: 'Manufacturing Company',
        description: 'Discovery Brief for a manufacturing firm seeking to automate quality control processes',
      },
      {
        title: 'Professional Services Firm',
        description: 'Discovery Brief for a law firm exploring AI for document review and research',
      },
    ],
  },
  'TPL-02': {
    templateId: 'TPL-02',
    name: 'Current State Map',
    stage: 'Establish',
    tier: 'T1',
    purpose: 'Document existing processes, technologies, and pain points to establish baseline',
    description: `
      The Current State Map provides a comprehensive view of how the client operates today.
      It documents processes, technologies, data flows, and identifies bottlenecks and inefficiencies.
      This artifact is generated by the Discovery Station (S-01) using the Client Discovery Brief as input.
    `,
    keyComponents: [
      'Process flow diagrams or descriptions',
      'Technology stack inventory',
      'Data sources and flows',
      'Role responsibilities matrix',
      'Time and effort analysis',
      'Pain points mapped to processes',
      'Integration dependencies',
    ],
    qualityCriteria: [
      'All key processes documented',
      'Pain points quantified where possible',
      'Technology dependencies identified',
      'Current costs/time documented',
      'Validated with client stakeholders',
    ],
    requiredInputs: [
      'Client Discovery Brief (TPL-01)',
      'Process documentation (if available)',
      'Stakeholder interviews',
      'System access for analysis',
    ],
    expectedOutputs: [
      'Visual process maps',
      'Technology inventory',
      'Bottleneck analysis',
      'Baseline metrics for comparison',
    ],
    estimatedTime: 'AI-generated (2-3 minutes), Review: 30-60 minutes',
    tips: [
      'Request access to existing documentation before running S-01',
      'Include screenshots or diagrams from client systems',
      'Focus on processes most relevant to AI opportunities',
      'Quantify pain points in time/money where possible',
    ],
    examples: [
      {
        title: 'Sales Process Map',
        description: 'Current state of lead-to-close process with CRM integration points',
      },
      {
        title: 'Document Processing Flow',
        description: 'Manual document review process with time analysis',
      },
    ],
  },
  'TPL-03': {
    templateId: 'TPL-03',
    name: 'Future State Design',
    stage: 'Re-engineer',
    tier: 'T2',
    purpose: 'Define the AI-enhanced target state with clear transformation roadmap',
    description: `
      The Future State Design articulates how the client's processes will work after AI implementation.
      It bridges the gap between current challenges and proposed solutions, providing a clear vision
      of the transformed state. This is a client-facing deliverable requiring approval before delivery.
    `,
    keyComponents: [
      'Vision statement and objectives',
      'AI-enhanced process designs',
      'Technology architecture overview',
      'Integration requirements',
      'Change impact assessment',
      'Success metrics and KPIs',
      'Risk mitigation strategies',
    ],
    qualityCriteria: [
      'Clear before/after comparison',
      'Feasible with available technology',
      'Aligned with client goals',
      'Addresses all major pain points',
      'Includes measurable success criteria',
      'Reviewed and approved by QA Station',
    ],
    requiredInputs: [
      'Client Discovery Brief (TPL-01)',
      'Current State Map (TPL-02)',
      'S-02 Scoping Station output',
    ],
    expectedOutputs: [
      'Future state process diagrams',
      'Technology recommendations',
      'Integration specifications',
      'Change management plan outline',
    ],
    estimatedTime: 'AI-generated (3-5 minutes), Review: 1-2 hours',
    tips: [
      'Make the vision tangible with specific examples',
      'Show quick wins alongside long-term changes',
      'Address potential objections proactively',
      'Use client\'s language and terminology',
    ],
    examples: [
      {
        title: 'Automated Document Processing',
        description: 'AI-powered document intake with human-in-the-loop review',
      },
      {
        title: 'Intelligent Sales Enablement',
        description: 'AI assistant for proposal generation and customer insights',
      },
    ],
  },
  'TPL-05': {
    templateId: 'TPL-05',
    name: 'Implementation Plan',
    stage: 'Re-engineer',
    tier: 'T2',
    purpose: 'Provide detailed roadmap for executing the future state design',
    description: `
      The Implementation Plan translates the Future State Design into actionable steps.
      It includes timelines, resource requirements, dependencies, and risk mitigation.
      This is a client-facing deliverable that guides the execution phase.
    `,
    keyComponents: [
      'Phase breakdown with milestones',
      'Task-level implementation details',
      'Resource requirements (people, tools, budget)',
      'Timeline with dependencies',
      'Risk register with mitigation plans',
      'Success criteria for each phase',
      'Communication and training plan',
    ],
    qualityCriteria: [
      'Realistic timelines based on scope',
      'Clear ownership assignments',
      'Dependencies explicitly mapped',
      'Risks identified with mitigations',
      'Aligned with client capacity',
      'Budget estimates included',
    ],
    requiredInputs: [
      'Future State Design (TPL-03)',
      'Client resource availability',
      'Technical constraints and requirements',
    ],
    expectedOutputs: [
      'Phased implementation schedule',
      'Resource allocation plan',
      'Risk management framework',
      'Communication plan',
    ],
    estimatedTime: 'AI-generated (3-5 minutes), Review: 1-2 hours',
    tips: [
      'Build in buffer time for unexpected issues',
      'Identify critical path clearly',
      'Plan for parallel workstreams where possible',
      'Include client responsibilities explicitly',
    ],
    examples: [
      {
        title: 'Phased Rollout Plan',
        description: 'Three-phase implementation with pilot, expand, and scale stages',
      },
      {
        title: 'Sprint-Based Delivery',
        description: 'Two-week sprint schedule for rapid implementation',
      },
    ],
  },
  'TPL-09': {
    templateId: 'TPL-09',
    name: 'ROI Calculator',
    stage: 'Re-engineer',
    tier: 'T2',
    purpose: 'Quantify the business value and return on investment for the proposed solution',
    description: `
      The ROI Calculator provides a data-driven business case for the AI implementation.
      It includes cost-benefit analysis, payback period calculations, and sensitivity analysis.
      This artifact is critical for securing executive buy-in and budget approval.
    `,
    keyComponents: [
      'Current cost baseline',
      'Projected savings breakdown',
      'Implementation cost estimates',
      'Payback period calculation',
      'Net present value (NPV)',
      'Sensitivity analysis scenarios',
      'Risk-adjusted projections',
    ],
    qualityCriteria: [
      'Assumptions clearly documented',
      'Data sources cited',
      'Conservative and optimistic scenarios included',
      'Calculations verifiable',
      'Aligned with client financial standards',
    ],
    requiredInputs: [
      'Current State Map with cost data (TPL-02)',
      'Future State Design (TPL-03)',
      'Implementation Plan with budget (TPL-05)',
      'Client financial parameters',
    ],
    expectedOutputs: [
      'Executive summary of ROI',
      'Detailed cost-benefit analysis',
      'Visual charts and projections',
      'Scenario comparison table',
    ],
    estimatedTime: 'AI-generated (2-3 minutes), Review: 30-60 minutes',
    tips: [
      'Use client\'s actual cost data when available',
      'Be conservative in benefits estimates',
      'Show monthly and annual views',
      'Include soft benefits (quality, satisfaction)',
    ],
    examples: [
      {
        title: 'Process Automation ROI',
        description: 'Time savings calculation with FTE reduction analysis',
      },
      {
        title: 'Quality Improvement Value',
        description: 'Error reduction translated to cost savings',
      },
    ],
  },
  'TPL-10': {
    templateId: 'TPL-10',
    name: 'Client Handoff',
    stage: 'Verify',
    tier: 'T2',
    purpose: 'Package all deliverables for formal client delivery with knowledge transfer',
    description: `
      The Client Handoff is the final delivery package that bundles all engagement artifacts.
      It includes an executive summary, all approved deliverables, next steps, and support information.
      This artifact marks the completion of the consulting engagement.
    `,
    keyComponents: [
      'Executive summary and key findings',
      'All approved T2 deliverables',
      'Implementation recommendations',
      'Next steps and action items',
      'Knowledge transfer materials',
      'Support and contact information',
      'Appendices and reference materials',
    ],
    qualityCriteria: [
      'All T2 artifacts QA-approved',
      'Executive summary is concise and compelling',
      'Next steps are actionable',
      'Professional formatting and branding',
      'No conflicting information across documents',
    ],
    requiredInputs: [
      'Future State Design (TPL-03) - Approved',
      'Implementation Plan (TPL-05) - Approved',
      'ROI Calculator (TPL-09) - Approved',
      'S-03 QA Station approval',
    ],
    expectedOutputs: [
      'Complete delivery package',
      'Presentation materials',
      'Reference documentation',
      'Transition plan',
    ],
    estimatedTime: 'AI-generated (3-5 minutes), Review: 1-2 hours',
    tips: [
      'Create a compelling narrative thread',
      'Include quick reference guides',
      'Prepare for common questions',
      'Plan the delivery meeting agenda',
    ],
    examples: [
      {
        title: 'AI Readiness Package',
        description: 'Complete handoff for knowledge spine engagement',
      },
      {
        title: 'Implementation Launch Kit',
        description: 'Full sprint handoff with technical specifications',
      },
    ],
  },
  'TPL-12': {
    templateId: 'TPL-12',
    name: 'Case Study',
    stage: 'Expand',
    tier: 'T2',
    purpose: 'Document engagement success for marketing and future sales enablement',
    description: `
      The Case Study captures the engagement story for Frontier Logic's portfolio.
      It highlights the challenge, approach, solution, and results in a format suitable
      for marketing materials and sales conversations. Requires client approval for publication.
    `,
    keyComponents: [
      'Client background (anonymized if required)',
      'Challenge and pain points',
      'Approach and methodology',
      'Solution overview',
      'Results and metrics',
      'Client testimonial',
      'Key learnings',
    ],
    qualityCriteria: [
      'Compelling narrative structure',
      'Quantified results included',
      'Client-approved for publication',
      'Visual design consistent with brand',
      'Suitable for target audience',
    ],
    requiredInputs: [
      'Client Handoff (TPL-10)',
      'Results data (post-implementation)',
      'Client testimonial/approval',
    ],
    expectedOutputs: [
      'Marketing-ready case study',
      'Social media snippets',
      'Sales presentation slides',
    ],
    estimatedTime: '2-3 hours (manual creation)',
    tips: [
      'Lead with the most impressive result',
      'Use specific numbers and percentages',
      'Keep jargon minimal for broad appeal',
      'Get written approval before publishing',
    ],
    examples: [
      {
        title: 'Enterprise Transformation',
        description: 'Fortune 500 AI implementation success story',
      },
      {
        title: 'SMB Quick Win',
        description: 'Small business automation case study',
      },
    ],
  },
}

// =============================================================================
// STATION GUIDANCE
// =============================================================================

export interface StationGuidance {
  stationId: StationId
  name: string
  purpose: string
  description: string
  howItWorks: string[]
  bestPractices: string[]
  inputRequirements: string[]
  outputExpectations: string[]
  reviewChecklist: string[]
  troubleshooting: {
    issue: string
    solution: string
  }[]
}

export const STATION_GUIDANCE: Record<StationId, StationGuidance> = {
  'S-01': {
    stationId: 'S-01',
    name: 'Discovery Station',
    purpose: 'Transform client discovery information into actionable current state analysis',
    description: `
      The Discovery Station is the first AI-powered analysis point in the SERVE workflow.
      It ingests the Client Discovery Brief and generates a comprehensive Current State Map
      that documents existing processes, identifies pain points, and surfaces opportunities.
    `,
    howItWorks: [
      'Ingests the Client Discovery Brief (TPL-01) as primary input',
      'Analyzes client context, industry, and stated challenges',
      'Generates structured current state documentation',
      'Identifies patterns and potential automation opportunities',
      'Produces TPL-02 Current State Map as output',
    ],
    bestPractices: [
      'Ensure TPL-01 is complete and detailed before running',
      'Include any additional context in the "notes" field',
      'Review output for accuracy before proceeding',
      'Add client-specific details the AI may have missed',
    ],
    inputRequirements: [
      'TPL-01 Client Discovery Brief (required)',
      'Complete intake assessment scores',
      'Client industry and company size context',
    ],
    outputExpectations: [
      'Structured current state documentation',
      'Process flow descriptions',
      'Pain point identification',
      'Initial opportunity assessment',
    ],
    reviewChecklist: [
      'Are all major client processes documented?',
      'Are pain points accurately captured?',
      'Is the industry context appropriate?',
      'Are there any factual errors to correct?',
      'Does the output align with discovery call notes?',
    ],
    troubleshooting: [
      {
        issue: 'Output seems too generic',
        solution: 'Add more specific details to TPL-01 discovery brief and re-run',
      },
      {
        issue: 'Missing key processes',
        solution: 'Update TPL-01 with explicit process descriptions before re-running',
      },
      {
        issue: 'Industry context is wrong',
        solution: 'Verify industry field in client record and engagement settings',
      },
    ],
  },
  'S-02': {
    stationId: 'S-02',
    name: 'Scoping Station',
    purpose: 'Design future state solutions and build comprehensive implementation plan',
    description: `
      The Scoping Station is the solution design engine of SERVE. It takes the understanding
      from Discovery and transforms it into actionable deliverables: Future State Design,
      Implementation Plan, and ROI Calculator. This station produces the core T2 artifacts.
    `,
    howItWorks: [
      'Ingests TPL-01 (Discovery Brief) and TPL-02 (Current State) as inputs',
      'Analyzes opportunities and designs AI-enhanced solutions',
      'Calculates implementation requirements and timeline',
      'Generates ROI projections based on identified opportunities',
      'Produces TPL-03, TPL-05, and TPL-09 as outputs',
    ],
    bestPractices: [
      'Ensure S-01 output has been reviewed and approved',
      'Verify current state map reflects accurate baseline',
      'Consider pathway-specific focus areas',
      'Review all three outputs together for consistency',
    ],
    inputRequirements: [
      'TPL-01 Client Discovery Brief (required)',
      'TPL-02 Current State Map (required)',
      'S-01 must be complete and approved',
      'Pathway context (knowledge_spine, roi_audit, or workflow_sprint)',
    ],
    outputExpectations: [
      'Future State Design with clear transformation vision',
      'Implementation Plan with phases and milestones',
      'ROI Calculator with quantified business case',
      'All outputs aligned and internally consistent',
    ],
    reviewChecklist: [
      'Does future state address all pain points?',
      'Is the implementation plan realistic?',
      'Are ROI assumptions documented and reasonable?',
      'Do the three documents tell a coherent story?',
      'Is the solution appropriate for client maturity level?',
    ],
    troubleshooting: [
      {
        issue: 'Future state is too ambitious',
        solution: 'Re-run with additional context about client constraints',
      },
      {
        issue: 'ROI numbers seem unrealistic',
        solution: 'Add actual cost data to TPL-02 and re-run',
      },
      {
        issue: 'Implementation timeline is wrong',
        solution: 'Update engagement dates and add resource constraints',
      },
    ],
  },
  'S-03': {
    stationId: 'S-03',
    name: 'QA Station',
    purpose: 'Validate all T2 deliverables before client delivery',
    description: `
      The QA Station is the quality gatekeeper for all client-facing deliverables.
      It reviews T2 artifacts for completeness, consistency, accuracy, and professionalism.
      This station produces the Client Handoff package and flags issues for resolution.
    `,
    howItWorks: [
      'Ingests all T2 artifacts (TPL-03, TPL-05, TPL-09) as inputs',
      'Performs comprehensive quality checks',
      'Identifies inconsistencies across documents',
      'Validates calculations and recommendations',
      'Generates TPL-10 Client Handoff package',
    ],
    bestPractices: [
      'Run QA only after thorough human review of inputs',
      'Address any flagged issues before approving',
      'Use QA output as supplement to, not replacement for, human review',
      'Document any manual corrections made',
    ],
    inputRequirements: [
      'TPL-03 Future State Design (required)',
      'TPL-05 Implementation Plan (required)',
      'TPL-09 ROI Calculator (optional but recommended)',
      'S-02 must be complete',
    ],
    outputExpectations: [
      'Quality assessment report',
      'Consistency check results',
      'Client Handoff package draft (TPL-10)',
      'Issue list with severity ratings',
    ],
    reviewChecklist: [
      'Are all cross-references accurate?',
      'Do numbers match across documents?',
      'Is branding and formatting consistent?',
      'Are all client names and specifics correct?',
      'Is the executive summary compelling?',
    ],
    troubleshooting: [
      {
        issue: 'Inconsistencies flagged between documents',
        solution: 'Review flagged sections and update source artifacts, then re-run',
      },
      {
        issue: 'QA missed obvious errors',
        solution: 'Always perform human review; report gaps for system improvement',
      },
      {
        issue: 'Handoff package formatting issues',
        solution: 'Make manual adjustments to TPL-10 after generation',
      },
    ],
  },
}

// =============================================================================
// SENSITIVITY TIERS
// =============================================================================

export const SENSITIVITY_TIERS = {
  T1: {
    name: 'Tier 1 - Internal',
    description: 'Internal working documents that do not require client approval',
    approval: 'Auto-approved or single consultant approval',
    examples: ['TPL-01 Client Discovery Brief', 'TPL-02 Current State Map'],
    guidelines: [
      'Can be iterated freely during engagement',
      'Used as inputs to AI stations',
      'May contain working notes and drafts',
      'Not shared with clients directly',
    ],
  },
  T2: {
    name: 'Tier 2 - Client-Facing',
    description: 'Deliverables intended for client delivery that require QA approval',
    approval: 'Must pass QA Station review and manager approval',
    examples: [
      'TPL-03 Future State Design',
      'TPL-05 Implementation Plan',
      'TPL-09 ROI Calculator',
      'TPL-10 Client Handoff',
      'TPL-12 Case Study',
    ],
    guidelines: [
      'Must be reviewed by QA Station (S-03)',
      'Requires manager approval before delivery',
      'Uses professional formatting and branding',
      'Checked for accuracy and consistency',
      'Client names and specifics verified',
    ],
  },
}

// =============================================================================
// INTAKE ASSESSMENT GUIDANCE
// =============================================================================

export const INTAKE_ASSESSMENT = {
  overview: `
    The intake assessment is a structured questionnaire that evaluates client AI readiness
    across seven dimensions. The total score (0-21) determines the recommended service pathway
    and helps calibrate expectations for the engagement.
  `,
  dimensions: [
    {
      name: 'AI Familiarity',
      question: 'How familiar is your organization with AI concepts and applications?',
      scoring: {
        0: 'No AI experience or awareness',
        1: 'Basic awareness of AI concepts',
        2: 'Some experience with AI tools',
        3: 'Active AI usage and experimentation',
      },
      guidance: 'Higher scores indicate readiness for more advanced implementations',
    },
    {
      name: 'Technical Infrastructure',
      question: 'How would you rate your current technical infrastructure and data systems?',
      scoring: {
        0: 'Legacy systems, limited digital capabilities',
        1: 'Basic cloud or modern systems in place',
        2: 'Good infrastructure with integration capabilities',
        3: 'Advanced, AI-ready technical environment',
      },
      guidance: 'Infrastructure gaps may require Knowledge Spine work first',
    },
    {
      name: 'Data Readiness',
      question: 'How organized and accessible is your data for analysis?',
      scoring: {
        0: 'Data is scattered and inconsistent',
        1: 'Some structured data available',
        2: 'Well-organized data with some gaps',
        3: 'Comprehensive, high-quality data assets',
      },
      guidance: 'Data quality directly impacts AI solution effectiveness',
    },
    {
      name: 'Process Documentation',
      question: 'How well-documented are your current business processes?',
      scoring: {
        0: 'No documentation exists',
        1: 'Informal or outdated documentation',
        2: 'Documented but gaps exist',
        3: 'Comprehensive, current documentation',
      },
      guidance: 'Better documentation accelerates Discovery Station output quality',
    },
    {
      name: 'Change Readiness',
      question: 'How receptive is your organization to change and new technologies?',
      scoring: {
        0: 'Resistant to change',
        1: 'Cautious but open',
        2: 'Generally supportive of innovation',
        3: 'Actively seeking transformation',
      },
      guidance: 'Lower scores may require additional change management focus',
    },
    {
      name: 'Executive Sponsorship',
      question: 'What level of executive support exists for AI initiatives?',
      scoring: {
        0: 'No executive awareness or support',
        1: 'Limited interest from leadership',
        2: 'Moderate executive support',
        3: 'Strong executive championship',
      },
      guidance: 'Strong sponsorship correlates with implementation success',
    },
    {
      name: 'Budget Clarity',
      question: 'How clear is the budget allocation for AI implementation?',
      scoring: {
        0: 'No budget identified',
        1: 'Exploring budget options',
        2: 'Budget allocated pending business case',
        3: 'Approved budget ready for deployment',
      },
      guidance: 'Budget clarity impacts pathway selection and timeline',
    },
  ],
  pathwayRecommendation: {
    'knowledge_spine': {
      range: '0-7',
      rationale: 'Focus on building foundational understanding and readiness',
    },
    'roi_audit': {
      range: '8-14',
      rationale: 'Good foundation exists; need to build business case',
    },
    'workflow_sprint': {
      range: '15-21',
      rationale: 'Ready for immediate implementation; high readiness',
    },
  },
}

// =============================================================================
// TUTORIAL CONTENT
// =============================================================================

export interface TutorialStep {
  id: string
  title: string
  description: string
  content: string
  actionItems?: string[]
  nextStep?: string
}

export interface Tutorial {
  id: string
  title: string
  description: string
  estimatedTime: string
  targetAudience: string
  steps: TutorialStep[]
}

export const TUTORIALS: Tutorial[] = [
  {
    id: 'getting-started',
    title: 'Getting Started with SERVE OS',
    description: 'Learn the basics of navigating and using SERVE OS for client engagements',
    estimatedTime: '15 minutes',
    targetAudience: 'New consultants',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to SERVE OS',
        description: 'Introduction to the platform and its purpose',
        content: `
          SERVE OS is Frontier Logic's internal operating system for managing AI implementation
          consulting engagements. It guides you through our SERVE methodology, automates
          document creation with AI stations, and ensures quality through structured workflows.

          Key features:
          • Client and engagement management
          • AI-powered analysis stations
          • Template-based artifact creation
          • Gatekeeper workflow enforcement
          • Quality assurance automation
        `,
        actionItems: ['Review the dashboard overview', 'Familiarize yourself with the navigation'],
        nextStep: 'create-client',
      },
      {
        id: 'create-client',
        title: 'Creating Your First Client',
        description: 'How to set up a new client in the system',
        content: `
          Every engagement starts with a client record. The client contains company information
          that persists across multiple engagements.

          Required information:
          • Company name
          • Industry sector
          • Primary contact name and email
          • Company size (optional but helpful)

          You can have multiple engagements per client, making it easy to track repeat
          business and build on previous work.
        `,
        actionItems: ['Navigate to Clients', 'Click "New Client"', 'Complete the client form'],
        nextStep: 'create-engagement',
      },
      {
        id: 'create-engagement',
        title: 'Starting an Engagement',
        description: 'Creating and configuring a new engagement',
        content: `
          An engagement represents a specific project with a client. During creation, you'll:

          1. Select the client
          2. Name the engagement
          3. Complete the intake assessment (7 questions)
          4. Review the recommended pathway
          5. Confirm or override the pathway selection

          The intake score determines which of the three pathways is recommended:
          • 0-7: Knowledge Spine
          • 8-14: ROI Audit
          • 15-21: Workflow Sprint
        `,
        actionItems: [
          'Navigate to Engagements',
          'Click "New Engagement"',
          'Complete the intake assessment',
        ],
        nextStep: 'first-artifact',
      },
      {
        id: 'first-artifact',
        title: 'Creating Your First Artifact',
        description: 'Building the Client Discovery Brief (TPL-01)',
        content: `
          The Client Discovery Brief is always the first artifact you create. It captures
          essential information about the client and their needs.

          The artifact workflow:
          1. Navigate to the engagement detail page
          2. Click "Create" next to TPL-01 in the Workflow Requirements
          3. Complete all required fields in the template
          4. Save as draft or submit for review

          Once TPL-01 exists, the Discovery Station (S-01) becomes available.
        `,
        actionItems: ['Open your engagement', 'Create TPL-01', 'Complete and save the document'],
        nextStep: 'run-station',
      },
      {
        id: 'run-station',
        title: 'Running Your First AI Station',
        description: 'Using S-01 Discovery Station',
        content: `
          AI Stations are the automated analysis engines in SERVE OS. They:

          1. Ingest artifacts as context
          2. Apply AI analysis to generate insights
          3. Produce new artifacts with structured content
          4. Flag items for review when needed

          To run S-01 Discovery Station:
          1. Ensure TPL-01 is complete
          2. Click "Run Station" on S-01
          3. Wait for analysis (typically 2-3 minutes)
          4. Review the generated output
          5. Create suggested artifacts from the output

          Stations enforce prerequisites—you cannot skip steps!
        `,
        actionItems: [
          'Verify TPL-01 is complete',
          'Run S-01 Discovery Station',
          'Review and save suggested artifacts',
        ],
        nextStep: 'understand-tiers',
      },
      {
        id: 'understand-tiers',
        title: 'Understanding Sensitivity Tiers',
        description: 'T1 vs T2 artifacts and approval workflows',
        content: `
          SERVE OS uses two sensitivity tiers:

          T1 (Internal):
          • Working documents not shared with clients
          • TPL-01 and TPL-02 are T1
          • Can be iterated without approval

          T2 (Client-Facing):
          • Deliverables for client presentation
          • TPL-03, TPL-05, TPL-09, TPL-10, TPL-12 are T2
          • Require QA Station review
          • Must be approved before delivery

          The QA Station (S-03) acts as the quality gate for all T2 content.
        `,
        actionItems: ['Review artifact tiers in the workflow view', 'Understand approval requirements'],
        nextStep: 'complete-engagement',
      },
      {
        id: 'complete-engagement',
        title: 'Completing an Engagement',
        description: 'From QA to client handoff',
        content: `
          The final stages of an engagement:

          1. Run S-03 QA Station on all T2 artifacts
          2. Review flagged issues and make corrections
          3. Approve the QA output
          4. Generate the Client Handoff (TPL-10)
          5. Deliver to client
          6. Create Case Study (TPL-12) for portfolio

          After completion, mark the engagement status as "Complete" and
          consider expansion opportunities with the client.
        `,
        actionItems: [
          'Complete all station runs',
          'Approve all T2 artifacts',
          'Generate client handoff',
          'Update engagement status',
        ],
      },
    ],
  },
  {
    id: 'pathway-deep-dive',
    title: 'Understanding Service Pathways',
    description: 'Deep dive into the three SERVE pathways and when to use each',
    estimatedTime: '20 minutes',
    targetAudience: 'All consultants',
    steps: [
      {
        id: 'pathway-overview',
        title: 'Pathway Overview',
        description: 'Why we have different pathways',
        content: `
          SERVE uses three pathways to tailor our approach to client readiness:

          The pathways exist because not all clients are at the same stage:
          • Some need education before implementation
          • Some need a business case to secure budget
          • Some are ready to execute immediately

          The intake assessment helps us match the right approach to each client,
          setting appropriate expectations and delivering maximum value.
        `,
        nextStep: 'knowledge-spine-detail',
      },
      {
        id: 'knowledge-spine-detail',
        title: 'Knowledge Spine Pathway',
        description: 'For clients scoring 0-7',
        content: `
          Knowledge Spine is our foundational pathway for AI-curious organizations.

          Client profile:
          • Limited AI experience
          • Need for education and demystification
          • Building organizational readiness
          • Early-stage AI exploration

          Focus areas:
          • AI literacy and training
          • Documentation and policy frameworks
          • Readiness assessment
          • Roadmap development

          Success looks like:
          • Increased stakeholder confidence
          • Clear governance frameworks
          • Defined next steps for AI adoption
        `,
        nextStep: 'roi-audit-detail',
      },
      {
        id: 'roi-audit-detail',
        title: 'ROI Audit Pathway',
        description: 'For clients scoring 8-14',
        content: `
          ROI Audit is for organizations that understand AI but need the business case.

          Client profile:
          • Moderate AI familiarity
          • Need to justify investment
          • Seeking quantified value
          • Budget pending approval

          Focus areas:
          • Process analysis and mapping
          • Value quantification
          • Business case development
          • Priority identification

          Success looks like:
          • Clear ROI projections
          • Executive buy-in secured
          • Implementation priorities defined
          • Budget approved
        `,
        nextStep: 'workflow-sprint-detail',
      },
      {
        id: 'workflow-sprint-detail',
        title: 'Workflow Sprint Pathway',
        description: 'For clients scoring 15-21',
        content: `
          Workflow Sprint is our execution-focused pathway for AI-ready organizations.

          Client profile:
          • Strong AI experience
          • Clear use cases identified
          • Budget approved
          • Organizational readiness high

          Focus areas:
          • Rapid solution design
          • Detailed implementation planning
          • Technical specifications
          • Quick time-to-value

          Success looks like:
          • Production-ready solutions
          • Fast deployment timelines
          • Measurable early results
          • Enabled internal teams
        `,
      },
    ],
  },
  {
    id: 'artifact-mastery',
    title: 'Mastering Artifact Creation',
    description: 'Best practices for creating high-quality artifacts',
    estimatedTime: '25 minutes',
    targetAudience: 'Experienced consultants',
    steps: [
      {
        id: 'artifact-philosophy',
        title: 'Artifact Philosophy',
        description: 'Why quality artifacts matter',
        content: `
          Artifacts are the tangible outputs of our work. They:

          • Document our understanding and recommendations
          • Serve as communication tools with clients
          • Enable AI stations to produce better outputs
          • Create a knowledge base for future engagements

          Quality principles:
          1. Completeness - All required fields populated
          2. Accuracy - Facts verified and sources cited
          3. Clarity - Written for the intended audience
          4. Consistency - Aligned across all documents
          5. Actionability - Clear next steps included
        `,
        nextStep: 'discovery-brief-tips',
      },
      {
        id: 'discovery-brief-tips',
        title: 'Discovery Brief Excellence',
        description: 'Creating impactful TPL-01 documents',
        content: `
          The Discovery Brief sets the foundation for everything that follows.

          Excellence criteria:
          • Capture direct quotes from stakeholders
          • Document specific pain points with examples
          • Include quantified impact where possible
          • Note political dynamics and constraints
          • Identify quick wins and red flags

          Common mistakes to avoid:
          • Generic descriptions lacking specificity
          • Missing stakeholder perspectives
          • Unverified assumptions
          • Overlooking constraints
        `,
        nextStep: 'ai-output-refinement',
      },
      {
        id: 'ai-output-refinement',
        title: 'Refining AI Station Outputs',
        description: 'How to review and improve generated content',
        content: `
          AI stations produce strong first drafts, but human refinement is essential.

          Review process:
          1. Accuracy check - Verify facts and figures
          2. Context alignment - Ensure it fits client situation
          3. Gap identification - Note what's missing
          4. Tone adjustment - Match client expectations
          5. Enhancement - Add specific examples and details

          Remember: You are the expert; AI is your assistant.
          Your judgment and client knowledge make the difference.
        `,
        nextStep: 't2-quality-standards',
      },
      {
        id: 't2-quality-standards',
        title: 'T2 Quality Standards',
        description: 'Ensuring client-ready deliverables',
        content: `
          T2 artifacts represent Frontier Logic to clients. Standards:

          Content standards:
          • Executive summary on first page
          • Clear section organization
          • Specific, actionable recommendations
          • Supporting data and rationale
          • Professional language

          Visual standards:
          • Consistent formatting
          • Branded elements in place
          • Charts and diagrams where helpful
          • Clean, scannable layout

          QA checklist:
          • Spell check completed
          • Client name correct throughout
          • Numbers consistent across documents
          • Links and references working
        `,
      },
    ],
  },
]

// =============================================================================
// QUICK REFERENCE
// =============================================================================

export const QUICK_REFERENCE = {
  keyboardShortcuts: [
    { key: '?', action: 'Show help / keyboard shortcuts' },
    { key: '⌘ + H', action: 'Go to home/dashboard' },
    { key: '⌘ + ⇧ + C', action: 'New client' },
    { key: '⌘ + ⇧ + E', action: 'New engagement' },
    { key: '⌘ + K', action: 'Open search' },
    { key: 'Esc', action: 'Close modals' },
  ],
  statusDefinitions: {
    engagement: {
      intake: 'Initial setup and assessment in progress',
      discovery: 'Discovery phase active, collecting information',
      active: 'Main engagement work underway',
      review: 'Deliverables under QA review',
      complete: 'Engagement successfully delivered',
      on_hold: 'Temporarily paused',
    },
    artifact: {
      draft: 'In progress, not yet ready for review',
      pending_review: 'Submitted for approval',
      approved: 'Validated and ready for use/delivery',
      archived: 'No longer active, kept for reference',
    },
    station: {
      pending: 'Waiting to be run',
      running: 'Currently processing',
      complete: 'Finished, output ready (T1)',
      awaiting_approval: 'T2 output needs approval',
      approved: 'Output approved for use',
      rejected: 'Output rejected, needs re-run',
      failed: 'Error occurred during processing',
    },
  },
  templateQuickRef: [
    { id: 'TPL-01', name: 'Client Discovery Brief', tier: 'T1', stage: 'Standardize' },
    { id: 'TPL-02', name: 'Current State Map', tier: 'T1', stage: 'Establish' },
    { id: 'TPL-03', name: 'Future State Design', tier: 'T2', stage: 'Re-engineer' },
    { id: 'TPL-05', name: 'Implementation Plan', tier: 'T2', stage: 'Re-engineer' },
    { id: 'TPL-09', name: 'ROI Calculator', tier: 'T2', stage: 'Re-engineer' },
    { id: 'TPL-10', name: 'Client Handoff', tier: 'T2', stage: 'Verify' },
    { id: 'TPL-12', name: 'Case Study', tier: 'T2', stage: 'Expand' },
  ],
  stationQuickRef: [
    { id: 'S-01', name: 'Discovery Station', inputs: 'TPL-01', outputs: 'TPL-02' },
    { id: 'S-02', name: 'Scoping Station', inputs: 'TPL-01, TPL-02', outputs: 'TPL-03, TPL-05, TPL-09' },
    { id: 'S-03', name: 'QA Station', inputs: 'TPL-03, TPL-05', outputs: 'TPL-10' },
  ],
}

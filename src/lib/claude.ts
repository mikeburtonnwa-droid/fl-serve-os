// Claude API integration for SERVE OS AI Stations
import Anthropic from '@anthropic-ai/sdk'
import { STATION_REQUIREMENTS, TEMPLATE_METADATA, type StationId, type TemplateId } from './workflow'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export interface ArtifactContent {
  templateId: TemplateId
  templateName: string
  content: Record<string, unknown>
  status: string
  createdAt: string
}

export interface StationInput {
  engagementId: string
  clientName: string
  clientIndustry?: string
  pathway: string
  intakeScore: number
  intakeDetails?: Record<string, number>
  // NEW: Structured artifact inputs
  artifacts: ArtifactContent[]
  previousStationOutputs?: {
    stationId: string
    output: string
    createdAt: string
  }[]
  additionalContext?: string
}

export interface StationOutput {
  success: boolean
  content: string
  structuredData?: Record<string, unknown>
  // NEW: Suggested artifact updates
  suggestedArtifacts?: {
    templateId: TemplateId
    suggestedContent: Record<string, unknown>
    action: 'create' | 'update'
  }[]
  tokensIn: number
  tokensOut: number
  model: string
  durationMs: number
  error?: string
}

// Format artifact content for the prompt
function formatArtifactForPrompt(artifact: ArtifactContent): string {
  const meta = TEMPLATE_METADATA[artifact.templateId]
  let formatted = `\n### ${meta?.name || artifact.templateName} (${artifact.templateId})\n`
  formatted += `Status: ${artifact.status} | Created: ${new Date(artifact.createdAt).toLocaleDateString()}\n\n`

  // Format each field in the artifact content
  for (const [key, value] of Object.entries(artifact.content)) {
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    if (value && String(value).trim()) {
      formatted += `**${label}:** ${value}\n\n`
    }
  }

  return formatted
}

// Station prompt templates - now artifact-aware
const STATION_PROMPTS = {
  'S-01': {
    name: 'Discovery Station',
    systemPrompt: `You are an AI implementation consultant conducting a discovery analysis for Frontier Logic, an AI implementation consulting firm.

Your role is to:
1. Analyze the client's situation based on their Discovery Brief and intake assessment
2. Identify key gaps, pain points, and opportunities for AI implementation
3. Generate Current State Map content documenting existing processes
4. Provide preliminary recommendations aligned with their service pathway

You have access to artifacts from previous stages. Use this context to provide specific, actionable insights.

IMPORTANT: Your output should include structured data that can be used to pre-populate the Current State Map (TPL-02) template.`,

    userPromptTemplate: (input: StationInput) => {
      const requiredArtifacts = input.artifacts.filter(a =>
        STATION_REQUIREMENTS['S-01'].requiredArtifacts.includes(a.templateId)
      )
      const hasRequiredArtifacts = requiredArtifacts.length > 0

      return `
## Discovery Analysis Request

**Client:** ${input.clientName}
**Industry:** ${input.clientIndustry || 'Not specified'}
**Service Pathway:** ${input.pathway.replace('_', ' ').toUpperCase()}
**Overall Readiness Score:** ${input.intakeScore}/21

### Intake Assessment Details
${input.intakeDetails ? Object.entries(input.intakeDetails)
  .map(([key, value]) => `- ${key.replace(/_/g, ' ')}: ${value}/3`)
  .join('\n') : 'No detailed scores available'}

---

## Available Artifacts
${hasRequiredArtifacts
  ? requiredArtifacts.map(a => formatArtifactForPrompt(a)).join('\n')
  : '⚠️ WARNING: No Client Discovery Brief (TPL-01) found. Analysis will be limited.'}

${input.additionalContext ? `### Additional Context\n${input.additionalContext}` : ''}

---

## Required Output

Please provide a comprehensive discovery analysis including:

### 1. Situation Assessment
- Summary of client's current state based on Discovery Brief
- AI readiness evaluation
- Key strengths and gaps identified

### 2. Process Analysis
For each major process/workflow identified, document:
- Process name
- Current challenges
- Time/effort involved
- Automation potential (High/Medium/Low)

### 3. Discovery Findings
- Critical pain points that need addressing
- Quick wins (low effort, high impact)
- Strategic opportunities based on the ${input.pathway.replace('_', ' ')} pathway

### 4. Current State Map Data
Provide structured data for creating Current State Map artifacts:

\`\`\`json
{
  "processes": [
    {
      "process_name": "Example Process",
      "process_owner": "Role/Department",
      "process_description": "Step by step description",
      "frequency": "Daily/Weekly/etc",
      "time_per_instance": 30,
      "pain_points": "Key issues",
      "automation_potential": "High/Medium/Low"
    }
  ]
}
\`\`\`

### 5. Recommended Next Steps
- Immediate actions for the engagement team
- Information to gather before scoping
- Suggested focus areas for S-02 Scoping Station
`
    },
  },

  'S-02': {
    name: 'Scoping Station',
    systemPrompt: `You are an AI implementation consultant creating a comprehensive scoping package for Frontier Logic.

Your role is to:
1. Synthesize all discovery findings and artifacts into actionable scope
2. Design the future state workflow based on current state analysis
3. Calculate effort estimates and timeline
4. Generate ROI projections based on documented metrics
5. Create implementation plan with clear phases

You have access to artifacts from previous stages. Use the specific metrics and details from Current State Maps to make accurate projections.

IMPORTANT: Your output should include structured data for:
- TPL-03: Future State Design
- TPL-05: Implementation Plan
- TPL-09: ROI Calculator`,

    userPromptTemplate: (input: StationInput) => {
      const allArtifacts = input.artifacts
      const discoveryBrief = allArtifacts.find(a => a.templateId === 'TPL-01')
      const currentStateMaps = allArtifacts.filter(a => a.templateId === 'TPL-02')
      const previousOutputs = input.previousStationOutputs?.find(s => s.stationId === 'S-01')

      return `
## Scoping Request

**Client:** ${input.clientName}
**Industry:** ${input.clientIndustry || 'Not specified'}
**Service Pathway:** ${input.pathway.replace('_', ' ').toUpperCase()}
**Readiness Score:** ${input.intakeScore}/21

---

## Input Artifacts

${discoveryBrief
  ? formatArtifactForPrompt(discoveryBrief)
  : '⚠️ WARNING: No Client Discovery Brief (TPL-01) found.'}

### Current State Maps (TPL-02)
${currentStateMaps.length > 0
  ? currentStateMaps.map(a => formatArtifactForPrompt(a)).join('\n')
  : '⚠️ WARNING: No Current State Maps found. Scoping accuracy will be limited.'}

${previousOutputs ? `
### Previous Discovery Analysis (S-01)
${previousOutputs.output}
` : ''}

${input.additionalContext ? `### Additional Context\n${input.additionalContext}` : ''}

---

## Required Output

Create a comprehensive scoping package with the following sections:

### 1. Engagement Scope Definition
- Objectives and success criteria (derived from Discovery Brief)
- In-scope deliverables
- Out-of-scope items (explicit exclusions)

### 2. Future State Design (TPL-03 Data)
For each process being transformed:

\`\`\`json
{
  "solution_name": "AI-Powered [Process Name]",
  "target_process": "Current process name",
  "ai_components": ["Component1", "Component2"],
  "future_workflow": "Step by step future state",
  "automation_percentage": 75,
  "human_touchpoints": "Where humans still needed",
  "integration_requirements": "Systems to integrate",
  "data_requirements": "Data needed",
  "success_metrics": "How to measure success"
}
\`\`\`

### 3. Implementation Plan (TPL-05 Data)
\`\`\`json
{
  "project_name": "Project Name",
  "project_duration": 8,
  "phases": [
    {
      "name": "Phase 1: Setup",
      "tasks": "Task list",
      "duration_days": 5
    }
  ],
  "dependencies": "Key dependencies",
  "risks": "Implementation risks"
}
\`\`\`

### 4. ROI Analysis (TPL-09 Data)
Based on Current State Map metrics, calculate:

\`\`\`json
{
  "process_name": "Process name",
  "current_hours_per_week": 40,
  "hourly_cost": 50,
  "error_rate": 15,
  "automation_level": 70,
  "implementation_cost": 25000,
  "monthly_cost": 500,
  "monthly_savings": 5600,
  "payback_months": 4.5,
  "annual_roi_percentage": 168,
  "qualitative_benefits": "Additional benefits"
}
\`\`\`

### 5. Investment Summary
- Total estimated effort (hours)
- Suggested pricing tier
- Expected ROI timeline
- Risk factors and mitigation

### 6. Next Steps for S-03 QA
- Key areas requiring validation
- Client-specific sensitivities
- Recommended review focus
`
    },
  },

  'S-03': {
    name: 'QA Station',
    systemPrompt: `You are a quality assurance specialist for Frontier Logic, reviewing all T2 (client-facing) deliverables before client delivery.

Your role is to:
1. Verify accuracy and internal consistency across all artifacts
2. Check that calculations and projections are reasonable
3. Ensure alignment with client context and engagement goals
4. Validate professional quality and brand consistency
5. Flag any issues that need addressing before client delivery

You have access to all artifacts produced during this engagement. Compare them for consistency and accuracy.

IMPORTANT: Be thorough but constructive. Provide specific, actionable feedback.`,

    userPromptTemplate: (input: StationInput) => {
      const allArtifacts = input.artifacts
      const t2Artifacts = allArtifacts.filter(a =>
        TEMPLATE_METADATA[a.templateId]?.tier === 'T2'
      )
      const t1Artifacts = allArtifacts.filter(a =>
        TEMPLATE_METADATA[a.templateId]?.tier === 'T1'
      )

      return `
## Quality Assurance Review Request

**Client:** ${input.clientName}
**Service Pathway:** ${input.pathway.replace('_', ' ').toUpperCase()}
**Readiness Score:** ${input.intakeScore}/21

---

## Source Documents (T1 - Internal)
${t1Artifacts.length > 0
  ? t1Artifacts.map(a => formatArtifactForPrompt(a)).join('\n')
  : 'No T1 artifacts found.'}

---

## Deliverables for Review (T2 - Client-Facing)
${t2Artifacts.length > 0
  ? t2Artifacts.map(a => formatArtifactForPrompt(a)).join('\n')
  : '⚠️ WARNING: No T2 deliverables found to review.'}

---

## Previous Station Outputs
${input.previousStationOutputs?.map(s => `
### ${s.stationId} Output
${s.output}
`).join('\n') || 'No previous outputs available.'}

${input.additionalContext ? `### Review Focus Areas\n${input.additionalContext}` : ''}

---

## Required Review Output

### 1. Consistency Check
- Are all artifacts internally consistent?
- Do projections match between documents?
- Are client details accurate across all deliverables?

### 2. Accuracy Validation
- Are calculations correct (especially ROI)?
- Are timelines realistic?
- Are effort estimates reasonable?

### 3. Completeness Review
- Are all required sections present?
- Is sufficient detail provided for client understanding?
- Any gaps in the analysis?

### 4. Quality Assessment
- Professional tone and language?
- Clear and logical structure?
- Appropriate for the client audience?

### 5. Brand & Methodology Alignment
- Aligned with SERVE methodology?
- Follows Frontier Logic best practices?
- Consistent with service pathway guidance?

### 6. Issue Tracker

\`\`\`json
{
  "critical_issues": [
    {
      "artifact": "TPL-XX",
      "field": "field_name",
      "issue": "Description",
      "recommendation": "How to fix"
    }
  ],
  "suggestions": [
    {
      "artifact": "TPL-XX",
      "suggestion": "Nice to have improvement"
    }
  ],
  "quality_score": 8
}
\`\`\`

### 7. Final Recommendation
- **APPROVED**: Ready for client delivery
- **REVISE**: Needs changes (list specific items)
- **REJECT**: Requires significant rework

### 8. Client Handoff Preparation
If approved, provide content for TPL-10 Client Handoff:

\`\`\`json
{
  "project_summary": "High-level summary",
  "deliverables": "List of what's being delivered",
  "outcomes_achieved": "Expected outcomes",
  "next_steps": "Client's next actions",
  "expansion_opportunities": "Future opportunities"
}
\`\`\`
`
    },
  },
}

export async function runStation(
  stationId: StationId,
  input: StationInput
): Promise<StationOutput> {
  const startTime = Date.now()
  const station = STATION_PROMPTS[stationId]

  if (!station) {
    return {
      success: false,
      content: '',
      tokensIn: 0,
      tokensOut: 0,
      model: '',
      durationMs: Date.now() - startTime,
      error: `Unknown station: ${stationId}`,
    }
  }

  // Validate required artifacts
  const requirements = STATION_REQUIREMENTS[stationId]
  const missingArtifacts = requirements.requiredArtifacts.filter(
    reqId => !input.artifacts.some(a => a.templateId === reqId)
  )

  if (missingArtifacts.length > 0) {
    const missingNames = missingArtifacts.map(id =>
      `${TEMPLATE_METADATA[id]?.name || id} (${id})`
    ).join(', ')

    return {
      success: false,
      content: '',
      tokensIn: 0,
      tokensOut: 0,
      model: 'claude-sonnet-4-20250514',
      durationMs: Date.now() - startTime,
      error: `Missing required artifacts: ${missingNames}. Please create these artifacts before running this station.`,
    }
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,  // Increased for structured outputs
      system: station.systemPrompt,
      messages: [
        {
          role: 'user',
          content: station.userPromptTemplate(input),
        },
      ],
    })

    const content = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')

    // Extract structured data from JSON blocks in the response
    const suggestedArtifacts = extractSuggestedArtifacts(content, stationId)

    return {
      success: true,
      content,
      suggestedArtifacts,
      tokensIn: response.usage.input_tokens,
      tokensOut: response.usage.output_tokens,
      model: response.model,
      durationMs: Date.now() - startTime,
    }
  } catch (error) {
    return {
      success: false,
      content: '',
      tokensIn: 0,
      tokensOut: 0,
      model: 'claude-sonnet-4-20250514',
      durationMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// Check if an object looks like a Current State Map process
function isCurrentStateMapProcess(obj: Record<string, unknown>): boolean {
  // Check for common process fields
  const processFields = ['process_name', 'process_owner', 'process_description', 'pain_points', 'automation_potential']
  const matchingFields = processFields.filter(field => field in obj)
  return matchingFields.length >= 2 // At least 2 process-like fields
}

// Extract structured artifact suggestions from station output
function extractSuggestedArtifacts(
  content: string,
  stationId: StationId
): StationOutput['suggestedArtifacts'] {
  const suggestions: StationOutput['suggestedArtifacts'] = []
  const outputTemplates = STATION_REQUIREMENTS[stationId].outputArtifacts

  // Look for JSON blocks in the content
  const jsonBlockRegex = /```json\s*([\s\S]*?)```/g
  let match

  while ((match = jsonBlockRegex.exec(content)) !== null) {
    try {
      const jsonContent = JSON.parse(match[1])

      // Try to determine which template this JSON is for based on structure
      // TPL-02: Current State Map - handle multiple formats
      if (outputTemplates.includes('TPL-02')) {
        // Format 1: { "processes": [...] }
        if (jsonContent.processes && Array.isArray(jsonContent.processes)) {
          for (const process of jsonContent.processes) {
            suggestions.push({
              templateId: 'TPL-02',
              suggestedContent: process,
              action: 'create',
            })
          }
          continue
        }
        // Format 2: Array of processes directly [...]
        if (Array.isArray(jsonContent)) {
          for (const item of jsonContent) {
            if (isCurrentStateMapProcess(item)) {
              suggestions.push({
                templateId: 'TPL-02',
                suggestedContent: item,
                action: 'create',
              })
            }
          }
          if (suggestions.length > 0) continue
        }
        // Format 3: Single process object
        if (isCurrentStateMapProcess(jsonContent)) {
          suggestions.push({
            templateId: 'TPL-02',
            suggestedContent: jsonContent,
            action: 'create',
          })
          continue
        }
      }

      // TPL-03: Future State Design
      if (jsonContent.solution_name && outputTemplates.includes('TPL-03')) {
        suggestions.push({
          templateId: 'TPL-03',
          suggestedContent: jsonContent,
          action: 'create',
        })
        continue
      }

      // TPL-05: Implementation Plan
      if (jsonContent.project_name && jsonContent.phases && outputTemplates.includes('TPL-05')) {
        suggestions.push({
          templateId: 'TPL-05',
          suggestedContent: jsonContent,
          action: 'create',
        })
        continue
      }

      // TPL-09: ROI Calculator
      if (jsonContent.current_hours_per_week && outputTemplates.includes('TPL-09')) {
        suggestions.push({
          templateId: 'TPL-09',
          suggestedContent: jsonContent,
          action: 'create',
        })
        continue
      }

      // TPL-10: Client Handoff
      if (jsonContent.project_summary && outputTemplates.includes('TPL-10')) {
        suggestions.push({
          templateId: 'TPL-10',
          suggestedContent: jsonContent,
          action: 'create',
        })
        continue
      }
    } catch (e) {
      // Invalid JSON, log and skip
      console.warn('Failed to parse JSON block in station output:', e)
    }
  }

  console.log(`Extracted ${suggestions.length} artifact suggestions from ${stationId} output`)
  return suggestions.length > 0 ? suggestions : undefined
}

// Get station metadata
export function getStationInfo(stationId: StationId) {
  const requirements = STATION_REQUIREMENTS[stationId]
  return {
    id: stationId,
    name: requirements.name,
    description: requirements.description,
    requiredArtifacts: requirements.requiredArtifacts.map(id => ({
      id,
      name: TEMPLATE_METADATA[id]?.name || id,
    })),
    outputArtifacts: requirements.outputArtifacts.map(id => ({
      id,
      name: TEMPLATE_METADATA[id]?.name || id,
    })),
    sensitivity: stationId === 'S-01' ? 'T1' as const : 'T2' as const,
    requiresApproval: stationId !== 'S-01',
  }
}

/**
 * Example Templates (F8.1, F8.2)
 *
 * Pre-built example templates for the template library.
 */

import type { Template, TemplateCategory } from './types'

// =============================================================================
// System Templates
// =============================================================================

export const SYSTEM_TEMPLATES: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Assessment Templates
  {
    name: 'AI Readiness Assessment',
    description: 'Comprehensive assessment template for evaluating an organization\'s readiness for AI implementation.',
    category: 'assessment',
    content: `# AI Readiness Assessment

## Executive Summary

[Organization Name] is currently positioned at a **[Score]%** AI readiness level, indicating a **[Pathway]** implementation pathway is recommended.

## Assessment Dimensions

### 1. Data Readiness (Score: [X]/100)

**Current State:**
- Data infrastructure: [Description]
- Data quality: [Description]
- Data governance: [Description]

**Key Findings:**
- [Finding 1]
- [Finding 2]
- [Finding 3]

**Recommendations:**
1. [Recommendation]
2. [Recommendation]

### 2. Process Maturity (Score: [X]/100)

**Current State:**
- Process documentation: [Description]
- Automation level: [Description]
- Standardization: [Description]

**Key Findings:**
- [Finding 1]
- [Finding 2]

**Recommendations:**
1. [Recommendation]
2. [Recommendation]

### 3. Technical Infrastructure (Score: [X]/100)

**Current State:**
- Cloud readiness: [Description]
- Integration capabilities: [Description]
- Security posture: [Description]

### 4. Organizational Readiness (Score: [X]/100)

**Current State:**
- Leadership support: [Description]
- Change management: [Description]
- Skills and training: [Description]

## Recommended Pathway

Based on the assessment results, we recommend the **[Pathway]** implementation pathway:

| Pathway | Timeline | Key Focus Areas |
|---------|----------|-----------------|
| [Pathway] | [X] weeks | [Focus areas] |

## Next Steps

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Appendix

### Assessment Methodology
[Description of methodology used]

### Data Sources
[List of data sources consulted]
`,
    contentFormat: 'markdown',
    source: 'system',
    isAnonymized: true,
    tags: ['assessment', 'ai-readiness', 'foundation'],
    industry: 'general',
    useCase: 'Initial client assessment',
    usageCount: 0,
    status: 'published',
  },
  {
    name: 'Process Automation Opportunity Assessment',
    description: 'Template for identifying and prioritizing automation opportunities within an organization.',
    category: 'assessment',
    content: `# Process Automation Opportunity Assessment

## Overview

This assessment identifies automation opportunities across [Organization Name]'s operations, prioritized by ROI potential and implementation complexity.

## Assessment Scope

**Departments Analyzed:**
- [Department 1]
- [Department 2]
- [Department 3]

**Processes Evaluated:** [X] total processes

## Automation Opportunity Matrix

| Process | Current FTE | Automation Potential | Estimated Savings | Complexity | Priority |
|---------|-------------|---------------------|-------------------|------------|----------|
| [Process 1] | [X] | [High/Med/Low] | $[X]K/year | [1-5] | [P1/P2/P3] |
| [Process 2] | [X] | [High/Med/Low] | $[X]K/year | [1-5] | [P1/P2/P3] |

## Top 5 Opportunities

### 1. [Process Name]
- **Current State:** [Description]
- **Automation Approach:** [Description]
- **Expected ROI:** [X]% in [X] months
- **Implementation Timeline:** [X] weeks

### 2. [Process Name]
[Details]

### 3. [Process Name]
[Details]

### 4. [Process Name]
[Details]

### 5. [Process Name]
[Details]

## Implementation Roadmap

### Phase 1: Quick Wins (Weeks 1-4)
- [Process] - [Description]

### Phase 2: Core Automation (Weeks 5-12)
- [Process] - [Description]

### Phase 3: Advanced Integration (Weeks 13-20)
- [Process] - [Description]

## Investment Summary

| Category | Investment | Annual Savings | Payback Period |
|----------|------------|----------------|----------------|
| Quick Wins | $[X]K | $[X]K | [X] months |
| Core | $[X]K | $[X]K | [X] months |
| Advanced | $[X]K | $[X]K | [X] months |
| **Total** | **$[X]K** | **$[X]K** | **[X] months** |

## Recommendations

1. [Recommendation]
2. [Recommendation]
3. [Recommendation]
`,
    contentFormat: 'markdown',
    source: 'system',
    isAnonymized: true,
    tags: ['assessment', 'automation', 'process'],
    industry: 'general',
    useCase: 'Process improvement',
    usageCount: 0,
    status: 'published',
  },

  // Proposal Templates
  {
    name: 'AI Implementation Proposal',
    description: 'Standard proposal template for AI/automation implementation engagements.',
    category: 'proposal',
    content: `# AI Implementation Proposal

**Prepared for:** [Client Name]
**Prepared by:** [Consultant Name]
**Date:** [Date]

---

## Executive Summary

[Brief overview of the proposed engagement, key objectives, and expected outcomes]

## Understanding Your Needs

Based on our discovery conversations, we understand that [Client Name] is looking to:

1. [Objective 1]
2. [Objective 2]
3. [Objective 3]

## Proposed Solution

### Approach Overview

[Description of the overall approach]

### Phase 1: Discovery & Planning (Weeks 1-2)
- Stakeholder interviews
- Current state documentation
- Requirements gathering
- Solution design

### Phase 2: Development & Configuration (Weeks 3-8)
- [Deliverable 1]
- [Deliverable 2]
- [Deliverable 3]

### Phase 3: Testing & Refinement (Weeks 9-10)
- User acceptance testing
- Performance optimization
- Documentation

### Phase 4: Deployment & Training (Weeks 11-12)
- Production deployment
- User training
- Knowledge transfer

## Deliverables

| Deliverable | Description | Timeline |
|-------------|-------------|----------|
| [Deliverable 1] | [Description] | Week [X] |
| [Deliverable 2] | [Description] | Week [X] |
| [Deliverable 3] | [Description] | Week [X] |

## Investment

| Item | Amount |
|------|--------|
| Professional Services | $[X] |
| Technology/Licensing | $[X] |
| Training | $[X] |
| **Total Investment** | **$[X]** |

## Expected ROI

- **Annual Savings:** $[X]
- **Payback Period:** [X] months
- **3-Year ROI:** [X]%

## Team & Expertise

### Project Lead
[Name] - [Brief bio and relevant experience]

### Technical Lead
[Name] - [Brief bio and relevant experience]

## Why [Your Company]

1. [Differentiator 1]
2. [Differentiator 2]
3. [Differentiator 3]

## Next Steps

1. Proposal review and questions
2. Scope refinement (if needed)
3. Statement of Work execution
4. Project kickoff

## Terms & Conditions

[Standard terms or reference to master agreement]

---

*We look forward to partnering with [Client Name] on this initiative.*
`,
    contentFormat: 'markdown',
    source: 'system',
    isAnonymized: true,
    tags: ['proposal', 'ai', 'implementation'],
    industry: 'general',
    useCase: 'Client proposals',
    usageCount: 0,
    status: 'published',
  },

  // Report Templates
  {
    name: 'Monthly Engagement Status Report',
    description: 'Standard template for monthly client engagement status updates.',
    category: 'report',
    content: `# Monthly Status Report

**Engagement:** [Engagement Name]
**Client:** [Client Name]
**Period:** [Month Year]
**Report Date:** [Date]

---

## Executive Summary

[Brief summary of overall progress and key highlights]

## Project Health

| Dimension | Status | Trend |
|-----------|--------|-------|
| Schedule | 🟢 On Track | → |
| Budget | 🟢 On Track | → |
| Scope | 🟢 On Track | → |
| Quality | 🟢 On Track | → |

## Progress Summary

### Completed This Period
- ✅ [Milestone/Task 1]
- ✅ [Milestone/Task 2]
- ✅ [Milestone/Task 3]

### In Progress
- 🔄 [Task 1] - [X]% complete
- 🔄 [Task 2] - [X]% complete

### Planned for Next Period
- ⏳ [Task 1]
- ⏳ [Task 2]
- ⏳ [Task 3]

## Key Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| [Metric 1] | [X] | [X] | 🟢 |
| [Metric 2] | [X] | [X] | 🟡 |
| [Metric 3] | [X] | [X] | 🟢 |

## Budget Status

| Category | Budget | Spent | Remaining |
|----------|--------|-------|-----------|
| Professional Services | $[X] | $[X] | $[X] |
| Technology | $[X] | $[X] | $[X] |
| Other | $[X] | $[X] | $[X] |
| **Total** | **$[X]** | **$[X]** | **$[X]** |

## Risks & Issues

### Open Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| [Risk 1] | [H/M/L] | [H/M/L] | [Action] |

### Open Issues
| Issue | Priority | Owner | Due Date |
|-------|----------|-------|----------|
| [Issue 1] | [P1/P2/P3] | [Name] | [Date] |

## Decisions Needed

1. [Decision 1] - Due by [Date]
2. [Decision 2] - Due by [Date]

## Upcoming Milestones

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| [Milestone 1] | [Date] | On Track |
| [Milestone 2] | [Date] | On Track |

## Team Updates

[Any team changes, availability notes, etc.]

---

*Next report: [Date]*
`,
    contentFormat: 'markdown',
    source: 'system',
    isAnonymized: true,
    tags: ['report', 'status', 'monthly'],
    industry: 'general',
    useCase: 'Client reporting',
    usageCount: 0,
    status: 'published',
  },

  // Plan Templates
  {
    name: 'Implementation Project Plan',
    description: 'Detailed project plan template for AI/automation implementations.',
    category: 'plan',
    content: `# Implementation Project Plan

**Project:** [Project Name]
**Client:** [Client Name]
**Start Date:** [Date]
**Target End Date:** [Date]

---

## Project Overview

### Objectives
1. [Objective 1]
2. [Objective 2]
3. [Objective 3]

### Success Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

### Scope

**In Scope:**
- [Item 1]
- [Item 2]

**Out of Scope:**
- [Item 1]
- [Item 2]

## Project Timeline

### Phase 1: Discovery (Weeks 1-2)

| Task | Owner | Start | End | Dependencies |
|------|-------|-------|-----|--------------|
| Stakeholder interviews | [Name] | W1D1 | W1D3 | - |
| Current state analysis | [Name] | W1D2 | W1D5 | - |
| Requirements documentation | [Name] | W2D1 | W2D3 | Task 1, 2 |
| Solution design | [Name] | W2D2 | W2D5 | Task 3 |

### Phase 2: Build (Weeks 3-8)

| Task | Owner | Start | End | Dependencies |
|------|-------|-------|-----|--------------|
| [Task 1] | [Name] | W3D1 | W4D5 | Phase 1 |
| [Task 2] | [Name] | W4D1 | W6D5 | Task 1 |
| [Task 3] | [Name] | W6D1 | W8D5 | Task 2 |

### Phase 3: Test (Weeks 9-10)

| Task | Owner | Start | End | Dependencies |
|------|-------|-------|-----|--------------|
| Unit testing | [Name] | W9D1 | W9D3 | Phase 2 |
| Integration testing | [Name] | W9D3 | W9D5 | Task 1 |
| UAT | [Name] | W10D1 | W10D5 | Task 2 |

### Phase 4: Deploy (Weeks 11-12)

| Task | Owner | Start | End | Dependencies |
|------|-------|-------|-----|--------------|
| Production setup | [Name] | W11D1 | W11D3 | Phase 3 |
| Data migration | [Name] | W11D3 | W11D5 | Task 1 |
| Go-live | [Name] | W12D1 | W12D2 | Task 2 |
| Hypercare | [Name] | W12D2 | W12D5 | Task 3 |

## Resources

### Project Team

| Role | Name | Allocation | Responsibilities |
|------|------|------------|------------------|
| Project Manager | [Name] | 50% | Overall delivery |
| Technical Lead | [Name] | 100% | Solution design, development |
| Developer | [Name] | 100% | Development |
| Client PM | [Name] | 25% | Stakeholder coordination |

### Client Resources Needed

| Role | Availability Needed | Purpose |
|------|---------------------|---------|
| [Role] | [X] hrs/week | [Purpose] |

## Risk Management

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| [Risk 1] | Medium | High | [Strategy] |
| [Risk 2] | Low | Medium | [Strategy] |

## Communication Plan

| Meeting | Frequency | Attendees | Purpose |
|---------|-----------|-----------|---------|
| Daily standup | Daily | Project team | Progress sync |
| Status review | Weekly | PM + Client PM | Status update |
| Steering committee | Bi-weekly | Leadership | Decisions, escalations |

## Change Management

[Process for handling scope changes, change request form reference]

## Acceptance Criteria

[Detailed acceptance criteria for each deliverable]
`,
    contentFormat: 'markdown',
    source: 'system',
    isAnonymized: true,
    tags: ['plan', 'project', 'implementation'],
    industry: 'general',
    useCase: 'Project planning',
    usageCount: 0,
    status: 'published',
  },

  // Checklist Templates
  {
    name: 'Go-Live Readiness Checklist',
    description: 'Pre-deployment checklist to ensure all requirements are met before go-live.',
    category: 'checklist',
    content: `# Go-Live Readiness Checklist

**Project:** [Project Name]
**Target Go-Live Date:** [Date]
**Review Date:** [Date]

---

## Technical Readiness

### Infrastructure
- [ ] Production environment provisioned
- [ ] SSL certificates installed
- [ ] DNS configured
- [ ] Load balancer configured
- [ ] Backup systems in place
- [ ] Monitoring tools configured

### Security
- [ ] Security audit completed
- [ ] Penetration testing passed
- [ ] Access controls configured
- [ ] Data encryption enabled
- [ ] Audit logging enabled

### Integration
- [ ] All API integrations tested
- [ ] Authentication flows verified
- [ ] Data synchronization tested
- [ ] Error handling verified

### Performance
- [ ] Load testing completed
- [ ] Performance benchmarks met
- [ ] Response times within SLA

## Data Readiness

- [ ] Data migration completed
- [ ] Data validation passed
- [ ] Rollback plan tested
- [ ] Historical data accessible

## User Readiness

### Training
- [ ] Admin training completed
- [ ] End-user training completed
- [ ] Training materials distributed
- [ ] Quick reference guides available

### Support
- [ ] Help desk briefed
- [ ] Escalation path defined
- [ ] FAQ documentation ready
- [ ] Support contact information shared

## Documentation

- [ ] User documentation complete
- [ ] Admin documentation complete
- [ ] API documentation complete
- [ ] Runbook/operations guide ready

## Business Readiness

- [ ] Stakeholder sign-off obtained
- [ ] Communication plan executed
- [ ] Go/No-Go decision made
- [ ] Success metrics defined

## Contingency Planning

- [ ] Rollback procedure documented
- [ ] Rollback procedure tested
- [ ] Emergency contacts identified
- [ ] War room setup planned

## Post Go-Live Support

- [ ] Hypercare schedule defined
- [ ] Support team on standby
- [ ] Monitoring dashboards ready
- [ ] Incident response plan ready

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Project Manager | | | |
| Technical Lead | | | |
| Client Sponsor | | | |
`,
    contentFormat: 'markdown',
    source: 'system',
    isAnonymized: true,
    tags: ['checklist', 'go-live', 'deployment'],
    industry: 'general',
    useCase: 'Deployment preparation',
    usageCount: 0,
    status: 'published',
  },
]

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: TemplateCategory): typeof SYSTEM_TEMPLATES {
  return SYSTEM_TEMPLATES.filter((t) => t.category === category)
}

/**
 * Search templates by keyword
 */
export function searchTemplates(query: string): typeof SYSTEM_TEMPLATES {
  const lowercaseQuery = query.toLowerCase()
  return SYSTEM_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lowercaseQuery) ||
      t.description.toLowerCase().includes(lowercaseQuery) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
  )
}

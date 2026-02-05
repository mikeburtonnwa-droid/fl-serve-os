# SERVE OS v2.0 Technical Specification Gap Analysis

## Executive Summary

After thorough review of the Technical Specification against the existing codebase, I've identified **47 specific gaps** that must be addressed before development can begin. These gaps range from missing type definitions to unspecified error handling behaviors and incomplete integration points.

---

## Critical Gaps (Must Resolve Before Development)

### 1. Markdown Rendering (Section 3.1)

#### Gap 1.1: Missing Component Props for Existing UI Integration
**Issue:** The spec defines `MarkdownRendererProps` but doesn't specify how it integrates with the existing `station_runs.output_data` structure.

**Current Code Reality:**
```typescript
// In engagement detail page, output_data has this shape:
output_data: {
  content: string;
  suggestedArtifacts?: Array<{...}>
} | null
```

**Required Clarification:**
- Should the renderer handle `null` output_data gracefully?
- How should the component handle the existing `error_message` field display?
- What's the fallback when markdown parsing fails?

#### Gap 1.2: No Styling Specification for Rendered Markdown
**Issue:** No Tailwind CSS classes or style tokens defined for rendered elements.

**Required Specification:**
```typescript
interface MarkdownStyles {
  h1: string;  // e.g., "text-2xl font-bold text-slate-900 mb-4"
  h2: string;
  code: string;
  codeBlock: string;
  table: string;
  // etc.
}
```

#### Gap 1.3: JSON Block Detection Logic Undefined
**Issue:** Spec mentions "detects ```json blocks" but doesn't specify:
- Regex pattern or parser approach
- Handling of malformed JSON
- Nested JSON within markdown

---

### 2. One-Click Artifact Creation (Section 3.2)

#### Gap 2.1: Template Field Mapping Not Specified
**Issue:** The spec doesn't define how AI-suggested content maps to existing template fields.

**Current Template Structure (from templates.ts):**
```typescript
interface TemplateField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'rich_text';
  required: boolean;
  options?: string[];
  section?: string;
}
```

**Required Specification:**
- Mapping algorithm from AI JSON keys to `TemplateField.name`
- Handling of missing required fields
- Type coercion rules (e.g., AI returns string "75" for number field)
- Handling of `select`/`multiselect` fields when AI value doesn't match `options[]`

#### Gap 2.2: Batch Create Transaction Semantics Undefined
**Issue:** `/api/artifacts/batch` endpoint specified but no transactional behavior defined.

**Required Clarification:**
- Should batch creation be atomic (all or nothing)?
- Error handling when 3rd of 5 artifacts fails validation
- Rollback strategy for Supabase (no native transactions in JS client)

#### Gap 2.3: Preview Modal State Management
**Issue:** No specification for how editable preview state is managed.

**Required Specification:**
- React state management approach (useState, useReducer, form library?)
- Validation timing (on blur, on change, on submit?)
- Dirty state tracking for unsaved changes warning

#### Gap 2.4: FieldDiffViewer Not Fully Specified
**Issue:** Mentioned in spec but no interface or implementation details.

**Required Specification:**
```typescript
interface FieldDiff {
  fieldId: string;
  fieldLabel: string;
  aiSuggested: unknown;
  userModified: unknown;
  diffType: 'added' | 'removed' | 'changed' | 'unchanged';
}
```

---

### 3. PDF Export (Section 3.3)

#### Gap 3.1: Branding Asset Storage Undefined
**Issue:** `BrandingConfig` includes `logo?: string` but no specification for:
- Where logo assets are stored (Supabase Storage? Public folder? CDN?)
- Logo file format requirements (PNG, SVG, dimensions)
- How logos are retrieved in PDF generation context

#### Gap 3.2: PDF Template Data Transformation Not Specified
**Issue:** Each T2 template has different field structures. Spec doesn't define:
- How `artifact.content` JSONB is transformed for each PDF template
- Field rendering rules (e.g., how `multiselect` arrays render)
- Handling of empty optional fields

**Example - TPL-09 ROI Calculator has these fields:**
```typescript
{
  process_name: string;
  current_hours_per_week: number;
  hourly_cost: number;
  error_rate?: number;
  automation_level: number;
  implementation_cost: number;
  monthly_cost: number;
  qualitative_benefits?: string;
}
```

**Required:** Calculated fields specification:
- `monthly_savings = (current_hours_per_week * 4 * hourly_cost) * (automation_level / 100)`
- `payback_months = implementation_cost / monthly_savings`
- `annual_roi = ((monthly_savings * 12) - (monthly_cost * 12) - implementation_cost) / implementation_cost * 100`

#### Gap 3.3: Chart Generation for ROI PDF
**Issue:** Spec mentions "charts matching interactive version" but @react-pdf/renderer doesn't support Recharts.

**Required Clarification:**
- Use SVG chart generation (e.g., victory-native or d3 to SVG)?
- Pre-render charts server-side as images?
- Alternative charting approach for PDF context?

#### Gap 3.4: PDF Streaming vs Buffer Response
**Issue:** Spec says "application/pdf stream" but doesn't specify:
- Memory limits for large PDFs
- Timeout handling for complex documents
- Caching strategy for repeated exports

#### Gap 3.5: ADA Compliance Implementation Details
**Issue:** "ADA-compliant (tagged PDF structure)" mentioned but no specification for:
- Required PDF tags (headings, paragraphs, lists, tables)
- Alt text requirements for images/charts
- Reading order specification
- Language tagging

---

### 4. Artifact Editing with Version History (Section 3.4)

#### Gap 4.1: Concurrent Edit Detection Implementation
**Issue:** Spec mentions "warns if artifact modified by another user" but doesn't specify:
- Optimistic locking field (e.g., `updated_at` timestamp comparison)
- Conflict resolution UI
- Real-time vs. polling approach

**Required Specification:**
```typescript
// Option A: Supabase Realtime subscription
// Option B: ETag-based optimistic locking
// Option C: Timestamp comparison on save
```

#### Gap 4.2: Version Trigger Missing `updated_by` Field
**Issue:** Trigger references `NEW.updated_by` but current `artifacts` table doesn't have this column.

**Current Schema (from database.ts):**
```typescript
interface Artifact {
  id: string;
  engagement_id: string;
  template_id: string;
  name: string;
  content: Record<string, unknown>;
  sensitivity_tier: SensitivityTier;
  status: ArtifactStatus;
  version: number;
  google_drive_url?: string;
  created_at: string;
  updated_at: string;
  created_by: string;  // Only created_by exists
}
```

**Required Migration:**
```sql
ALTER TABLE artifacts ADD COLUMN updated_by UUID REFERENCES users(id);
```

#### Gap 4.3: Diff Viewer Field-Level Comparison Logic
**Issue:** Spec mentions "field-level changes between any two versions" but doesn't specify:
- Deep comparison algorithm for nested objects
- Array diff presentation (added/removed items)
- Rich text diff visualization

#### Gap 4.4: Change Summary Auto-Generation
**Issue:** `artifact_versions.change_summary` field exists but no specification for:
- Auto-generation logic vs. user input
- Summary format/length constraints
- When summary is required vs. optional

---

### 5. Global Search (Section 3.5)

#### Gap 5.1: Artifact Content Indexing Strategy
**Issue:** Spec notes "artifacts.content is JSONB, requires trigger for indexing" but doesn't provide the trigger.

**Required Implementation:**
```sql
CREATE OR REPLACE FUNCTION update_artifact_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  -- How to extract text from JSONB content?
  -- Which fields to index? All string fields?
  -- How to handle nested objects?
  NEW.search_vector := to_tsvector('english', ???);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### Gap 5.2: Search Result Ranking Not Specified
**Issue:** Full-text search returns results, but ranking/ordering logic undefined.

**Required Specification:**
- ts_rank vs ts_rank_cd
- Boost factors for different entity types
- Recency weighting
- Relevance threshold for exclusion

#### Gap 5.3: Command Palette Component Details
**Issue:** Keyboard shortcut handling specified but not:
- Focus trap implementation
- Escape key behavior (close immediately vs. clear first)
- Mobile support (no Cmd/Ctrl keys)
- Accessibility: ARIA roles, screen reader announcements

#### Gap 5.4: Search API Response Pagination
**Issue:** Spec shows `limit: number` param but not:
- Offset/cursor pagination approach
- Total count query performance (can be slow with FTS)
- Infinite scroll vs. load more UX

---

### 6. Interactive ROI Calculator (Section 4.1)

#### Gap 6.1: Calculation Formula Specification
**Issue:** ROI formulas not explicitly defined in spec.

**Required Formulas:**
```typescript
interface ROICalculations {
  // Current cost
  weeklyLaborCost: currentHoursPerWeek * hourlyCost;
  monthlyLaborCost: weeklyLaborCost * 4.33;
  annualLaborCost: monthlyLaborCost * 12;

  // Error cost (if error_rate provided)
  errorCostMultiplier: 1 + (errorRate / 100);

  // Savings
  automationSavings: monthlyLaborCost * (automationLevel / 100);
  netMonthlySavings: automationSavings - monthlyCost;

  // ROI
  paybackMonths: implementationCost / netMonthlySavings;
  firstYearROI: ((netMonthlySavings * 12) - implementationCost) / implementationCost * 100;
  fiveYearValue: (netMonthlySavings * 60) - implementationCost;
}
```

#### Gap 6.2: Slider Configuration Not Specified
**Issue:** "Slider controls for key variables" but no specification for:
- Min/max values for each slider
- Step increments
- Default values
- Input validation (e.g., automation level can't exceed 100%)

#### Gap 6.3: Real-time Chart Update Debouncing
**Issue:** "< 100ms latency" requirement but no debounce strategy for:
- Rapid slider movements
- Chart re-render optimization
- State batching approach

#### Gap 6.4: Scenario Comparison Layout
**Issue:** "up to 3 scenarios side-by-side" but no specification for:
- Responsive layout for mobile (stack vs. scroll)
- Highlighting differences between scenarios
- Baseline scenario designation

---

### 7. Enhanced Intake Assessment (Section 4.2)

#### Gap 7.1: Weighted Score Calculation Algorithm
**Issue:** Spec mentions "weighted scoring" but doesn't define the algorithm.

**Current Behavior (from intake-form.tsx):**
```typescript
const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
// Simple sum, no weighting
```

**Required Specification:**
```typescript
// Option A: Multiplicative weights
totalScore = sum(score[i] * weight[i]) / sum(weight[i]) * maxScore

// Option B: Additive weights
totalScore = sum(score[i] * weight[i])

// Which option? What's maxScore?
```

#### Gap 7.2: Conditional Follow-up Question Schema
**Issue:** Spec shows `conditionalFollowUp` but doesn't specify:
- How follow-up questions affect scoring
- UI transition animation
- Impact on progress indicator (7 questions becomes dynamic)

#### Gap 7.3: Pathway Override Audit Requirements
**Issue:** "Override capability with justification" but doesn't specify:
- Required justification minimum length
- Who can override (admin only? all consultants?)
- Override approval workflow (if any)

#### Gap 7.4: Admin UI for Weight/Threshold Configuration
**Issue:** Spec mentions "Admin UI" but provides no wireframes or component specs.

**Required Specification:**
- Route: `/dashboard/settings/intake-config`?
- Table/form layout for weight editing
- Preview of pathway distribution with current weights
- Validation (weights must be 1-3, thresholds must not overlap)

---

### 8. Template Library (Section 4.3)

#### Gap 8.1: Example Anonymization Rules
**Issue:** "curated examples from anonymized past engagements" but no specification for:
- Which fields require anonymization
- Anonymization algorithm (hash, generic replacement, removal)
- Approval workflow for promoting real artifacts to examples

#### Gap 8.2: Industry and Pathway Taxonomy
**Issue:** Filter by "industry and pathway" but:
- Industry list not defined (should match `clients.industry`?)
- Should be enum or free-text?
- No specification for "Other" or null handling

#### Gap 8.3: "Use as Starting Point" Data Flow
**Issue:** Spec mentions pre-populating new artifact form but:
- How does data flow from example to `/dashboard/artifacts/new`?
- URL query params? Session storage? Context?
- How to handle engagement selection (example isn't tied to engagement)

---

### 9. Client Portal (Section 4.4)

#### Gap 9.1: Magic Link Security Implementation
**Issue:** "magic link authentication" mentioned but critical security details missing:
- Token generation algorithm (crypto.randomBytes size?)
- Token hashing algorithm (bcrypt? argon2? SHA-256?)
- Token expiration handling (hard delete vs. soft expire)
- Rate limiting for magic link requests
- IP-based access restrictions

#### Gap 9.2: Portal Session Management
**Issue:** "7-day expiry, single engagement scope" but:
- How is session stored? (JWT? Supabase session? Custom cookie?)
- Session refresh behavior (sliding window?)
- Logout mechanism
- Multi-tab behavior

#### Gap 9.3: Artifact Visibility Control UI
**Issue:** `client_visible` boolean added to artifacts but:
- No UI for consultants to toggle visibility
- Bulk visibility toggle for all T2 artifacts?
- Warning when sharing sensitive content?

#### Gap 9.4: Portal Notification to Consultant
**Issue:** Spec logs "portal views" but doesn't specify:
- Should consultant receive notification when client views portal?
- Real-time notification vs. daily digest?
- Notification channel (in-app, email, both?)

#### Gap 9.5: Portal URL Structure
**Issue:** Route `/portal/[engagementId]` but:
- Is engagement ID exposed in URL? (security concern)
- Should use opaque token instead?
- SEO considerations (noindex?)

---

### 10. Engagement Cloning (Section 4.5)

#### Gap 10.1: Client-Specific Field Detection
**Issue:** "clearClientSpecificFields" option but no specification for:
- Which fields are "client-specific" per template
- Algorithm for detection (field name patterns? manual list?)
- User confirmation before clearing

**Example - TPL-01 Discovery Brief:**
```typescript
// Which of these are client-specific?
{
  company_overview: "...",      // Yes - mentions company
  primary_objectives: "...",    // Maybe - could be generic
  current_challenges: "...",    // Maybe - could be generic
  existing_tech_stack: "...",   // Yes - specific to client
  budget_range: "...",          // Maybe - depends
  key_stakeholders: "...",      // Yes - names
  success_criteria: "...",      // Maybe
}
```

#### Gap 10.2: Station Run History Handling
**Issue:** Spec clones artifacts but doesn't mention:
- Should station runs be cloned?
- If not, what's the state of gatekeeper validations?
- Does cloned engagement start at Stage 1 always?

#### Gap 10.3: Clone Permissions
**Issue:** No specification for:
- Who can clone (creator only? any consultant? admin only?)
- Cross-client cloning allowed?
- Clone from completed engagement only, or any status?

---

## Database Schema Gaps

### Gap D.1: Missing RLS Policies
**Issue:** New tables specified but no Row Level Security policies defined.

**Required for each new table:**
```sql
-- artifact_versions
ALTER TABLE artifact_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view versions of artifacts they can access" ...

-- roi_scenarios
ALTER TABLE roi_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage scenarios for their engagements" ...

-- client_portal_tokens
ALTER TABLE client_portal_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only consultants can create portal tokens" ...

-- etc.
```

### Gap D.2: Missing Indexes for Performance
**Issue:** Spec includes some indexes but missing:
```sql
CREATE INDEX idx_artifact_versions_created_at ON artifact_versions(created_at DESC);
CREATE INDEX idx_roi_scenarios_engagement ON roi_scenarios(engagement_id);
CREATE INDEX idx_template_examples_featured ON template_examples(is_featured) WHERE is_featured = true;
CREATE INDEX idx_client_portal_tokens_expires ON client_portal_tokens(expires_at);
```

### Gap D.3: Foreign Key Cascades Undefined
**Issue:** Some tables have `ON DELETE CASCADE`, others don't.

**Required Consistency:**
- `artifact_versions` → `artifacts`: CASCADE (specified ✓)
- `roi_scenarios` → `engagements`: CASCADE? (not specified)
- `roi_scenarios` → `artifacts`: SET NULL? (not specified)
- `client_portal_views` → `client_portal_tokens`: CASCADE (not specified)

---

## API Endpoint Gaps

### Gap A.1: Missing Error Response Schemas
**Issue:** Endpoints specified but error responses not standardized.

**Required Specification:**
```typescript
interface APIError {
  error: string;
  code: string;  // Machine-readable error code
  details?: Record<string, unknown>;
  requestId?: string;  // For debugging
}
```

### Gap A.2: Authentication for New Endpoints
**Issue:** Not all endpoints specify authentication requirements.

**Required Clarification:**
- `/api/artifacts/batch` - Auth required
- `/api/artifacts/[id]/export/pdf` - Auth required
- `/api/search` - Auth required
- `/api/roi-scenarios/*` - Auth required
- `/portal/*` - Magic link auth (different from Supabase auth)

### Gap A.3: Rate Limiting Not Specified
**Issue:** Critical for:
- `/api/search` - Could be CPU-intensive
- `/api/artifacts/[id]/export/pdf` - Memory-intensive
- `/api/stations/run` - API cost implications

### Gap A.4: Webhook/Real-time Subscriptions
**Issue:** Some features imply real-time updates but no specification:
- Concurrent edit warnings need real-time
- Client portal activity notifications
- Approval queue badge updates (currently implemented via Supabase Realtime)

---

## Integration Gaps

### Gap I.1: Supabase Storage Integration
**Issue:** PDF export and branding logos likely need file storage, but:
- Bucket names not specified
- Public vs. private access rules
- File size limits
- Content type restrictions

### Gap I.2: Email Service Integration
**Issue:** Magic link feature requires email delivery:
- Which email service? (Supabase built-in? Resend? SendGrid?)
- Email template content
- From address configuration
- Bounce/complaint handling

### Gap I.3: Environment Variable Documentation
**Issue:** New features require new env vars not documented:
```bash
# PDF Export
PDF_EXPORT_TIMEOUT_MS=30000
PDF_MAX_SIZE_MB=10

# Email (for magic links)
EMAIL_SERVICE_API_KEY=...
EMAIL_FROM_ADDRESS=...

# Search
SEARCH_MIN_QUERY_LENGTH=2
SEARCH_RESULT_LIMIT=50
```

---

## Testing Gaps

### Gap T.1: No Test Data Fixtures
**Issue:** Testing strategy mentioned but no fixtures defined:
- Sample engagement with all artifacts
- Sample station run outputs with suggested artifacts
- Sample ROI scenarios for calculator testing

### Gap T.2: E2E Test Scenarios Not Specified
**Issue:** "Test complete user journeys" but specific scenarios missing:
- Happy path: New engagement → All stations → PDF export
- Error path: Station fails prerequisites
- Concurrent edit conflict resolution
- Client portal access flow

---

## Recommendations

### Before Sprint 1 Can Begin:
1. **Resolve all Critical Gaps in Sections 1-5** (Tier 1 features)
2. **Define complete RLS policies** for new tables
3. **Specify error handling patterns** consistently
4. **Create field mapping documentation** for AI → Template conversion

### Before Sprint 3 Can Begin:
1. **Resolve Gaps in Sections 6-10** (Tier 2 features)
2. **Design magic link email templates**
3. **Define client-specific field lists** per template

### Recommended Additions to Spec:
1. **Component Library Extension** - Document new UI components added to `/src/components/ui/`
2. **State Management Pattern** - Specify React Query vs. SWR vs. native fetch for data
3. **Error Boundary Strategy** - How each feature handles runtime errors
4. **Analytics Events** - What user actions should be tracked for product analytics

---

## Appendix: Questions for Product Manager

1. For magic links, should clients be able to request a new link themselves, or only through consultant?

2. For ROI calculator, should scenarios persist across sessions or be ephemeral?

3. For clone feature, should intake assessment be re-run or copied from source?

4. For search, should station run outputs be searchable, or just artifacts?

5. For PDF export, is A4 support required for international clients?

6. For version history, how long should versions be retained? (Storage cost implications)

7. For client portal, should there be a consultant preview mode?

8. For intake assessment weights, should changes apply retroactively to existing engagements?

---

*Document prepared by: Full-Stack Engineer*
*Date: February 4, 2026*
*Based on: SERVE OS v2.0 Technical Specification*

# SERVE OS: Client-Level Architecture

## The Problem We're Solving

Previously, all data in SERVE OS was organized around **Engagements**. This created confusion because:

1. **Client information was duplicated** - Every new engagement required re-entering the same client discovery brief
2. **The Current State Map was engagement-specific** - But a client's business processes don't change between projects
3. **AI stations were disjointed** - Running S-01 for one engagement didn't benefit another engagement for the same client
4. **Multiple duplicate runs** - The UX allowed running stations multiple times, creating 49 artifact suggestions for what should have been 1

## The New Architecture

### Core Principle: **Client Data Lives with the Client**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  CLIENT                                      │
│  (e.g., "Airship Pumphouse")                                                │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  CLIENT-LEVEL DATA (Permanent, shared across all engagements)       │   │
│  │                                                                      │   │
│  │  • Basic Info: Name, Industry, Contacts                             │   │
│  │  • Intake Assessment: Score (8/21), Responses, Recommended Pathway  │   │
│  │  • TPL-01: Discovery Brief - "Who is this client?"                  │   │
│  │  • TPL-02: Current State Map - "What are their processes?"          │   │
│  │  • S-01 Station Runs: Discovery analysis history                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ENGAGEMENTS (Projects - Each has its own scope and deliverables)   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────┐    ┌─────────────────────┐                 │   │
│  │  │ Engagement 1        │    │ Engagement 2        │                 │   │
│  │  │ "ROI Audit Q1 2026" │    │ "Workflow Sprint"   │                 │   │
│  │  │                     │    │                     │                 │   │
│  │  │ • TPL-03: Future    │    │ • TPL-03: Future    │                 │   │
│  │  │   State Design      │    │   State Design      │                 │   │
│  │  │ • TPL-05: Impl Plan │    │ • TPL-05: Impl Plan │                 │   │
│  │  │ • TPL-09: ROI Calc  │    │ • TPL-09: ROI Calc  │                 │   │
│  │  │ • TPL-10: Handoff   │    │ • TPL-10: Handoff   │                 │   │
│  │  └─────────────────────┘    └─────────────────────┘                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## The User Journey

### Phase 1: Client Onboarding

**Before:** Create engagement first, then fill out discovery brief for that engagement.

**After:**

1. **Create Client** - Enter basic business information
2. **Complete Intake Assessment** - Answer 7 questions about AI readiness (stored at client level)
3. **System Recommends Pathway** - Based on score:
   - Score 15-21: Workflow Sprint (high readiness)
   - Score 10-14: ROI Audit (medium readiness)
   - Score 0-9: Knowledge Spine (start with documentation)
4. **Create Discovery Brief (TPL-01)** - Detailed information about the client's business, goals, and challenges

This information now **belongs to the client** and is available for all future engagements.

---

### Phase 2: Discovery Analysis (S-01 - Client Level)

**Before:** Run S-01 for each engagement, creating duplicate analysis.

**After:**

1. Navigate to **Client Page** (not Engagement)
2. Click **"Run Discovery Station"**
3. S-01 analyzes the Discovery Brief and creates a **Current State Map** at the **client level**
4. The Current State Map contains ALL discovered business processes:
   ```
   Current State Map (7 processes)
   ├── Inventory Management
   ├── Order Processing
   ├── Customer Onboarding
   ├── Menu Planning
   ├── Wholesale Distribution
   ├── E-commerce Fulfillment
   └── Staff Scheduling
   ```

This analysis is now **permanently available** for this client. Every engagement automatically has access to it.

---

### Phase 3: Create Engagement

**Before:** Start from scratch, manually entering context.

**After:**

1. **Create Engagement** - Give it a name and select the pathway
2. **Client Context Auto-Loaded** - The engagement automatically has access to:
   - Client's Discovery Brief (TPL-01)
   - Client's Current State Map (TPL-02)
   - Client's intake assessment and score
3. **Define Engagement Scope** - What specific processes/problems will this project address?

The engagement focuses on **what's unique to this project**, not re-documenting the client.

---

### Phase 4: Scoping & Deliverables (S-02 - Engagement Level)

**Before:** S-02 would recreate context or work with incomplete data.

**After:**

1. Navigate to **Engagement Page**
2. Click **"Run Scoping Station"**
3. S-02 receives BOTH:
   - **Client-level artifacts**: Discovery Brief, Current State Map
   - **Engagement context**: Pathway, specific scope
4. S-02 generates **engagement-specific deliverables**:
   - TPL-03: Future State Design (for THIS project's scope)
   - TPL-05: Implementation Plan (for THIS project)
   - TPL-09: ROI Calculator (for THIS project's processes)

These deliverables are specific to this engagement. A different engagement might focus on different processes.

---

### Phase 5: QA & Handoff (S-03 - Engagement Level)

1. S-03 reviews all engagement deliverables
2. Generates TPL-10: Client Handoff
3. Marks engagement as ready for delivery

---

## What This Enables

### 1. **Multiple Engagements, Single Source of Truth**

```
Client: Airship Pumphouse
├── Discovery Brief (created once)
├── Current State Map (7 processes, analyzed once)
│
├── Engagement 1: "Inventory Optimization" (Feb 2026)
│   └── Focuses on: Inventory Management, Order Processing
│       └── Future State: AI-powered inventory forecasting
│       └── ROI: $45K annual savings
│
├── Engagement 2: "Customer Experience" (Apr 2026)
│   └── Focuses on: Customer Onboarding, E-commerce
│       └── Future State: Automated onboarding flow
│       └── ROI: 30% faster customer activation
│
└── Engagement 3: "Operations Efficiency" (Jul 2026)
    └── Focuses on: Staff Scheduling, Menu Planning
        └── Future State: AI scheduling optimization
        └── ROI: 15% labor cost reduction
```

### 2. **Intelligent Station Behavior**

| Station | Level | What It Does | What It Uses |
|---------|-------|--------------|--------------|
| S-01 | Client | Analyzes business, maps processes | TPL-01 (Discovery Brief) |
| S-02 | Engagement | Creates project deliverables | TPL-01 + TPL-02 + Engagement scope |
| S-03 | Engagement | Reviews & validates | All engagement artifacts |

### 3. **No More Duplicate Work**

- Run S-01 **once per client** (not per engagement)
- Discovery Brief entered **once** (reused across engagements)
- Current State Map is **living documentation** of the client's business

### 4. **Clean Workflow Progression**

```
CLIENT LEVEL                    ENGAGEMENT LEVEL
─────────────                   ─────────────────
   │                                  │
   ▼                                  │
┌──────────────┐                      │
│ Create Client │                     │
└──────┬───────┘                      │
       │                              │
       ▼                              │
┌──────────────┐                      │
│ Intake       │                      │
│ Assessment   │                      │
└──────┬───────┘                      │
       │                              │
       ▼                              │
┌──────────────┐                      │
│ Discovery    │                      │
│ Brief(TPL-01)│                      │
└──────┬───────┘                      │
       │                              │
       ▼                              │
┌──────────────┐                      │
│ Run S-01     │                      │
│ Discovery    │                      │
└──────┬───────┘                      │
       │                              │
       ▼                              │
┌──────────────┐                      │
│ Current State│                      │
│ Map (TPL-02) │                      │
└──────┬───────┘                      │
       │                              │
       │    ┌─────────────────────────┘
       │    │
       ▼    ▼
      ┌──────────────┐
      │ Create       │
      │ Engagement   │
      └──────┬───────┘
             │
             ▼
      ┌──────────────┐
      │ Run S-02     │
      │ Scoping      │
      └──────┬───────┘
             │
             ▼
      ┌──────────────┐
      │ TPL-03, 05,  │
      │ 09 Created   │
      └──────┬───────┘
             │
             ▼
      ┌──────────────┐
      │ Run S-03 QA  │
      └──────┬───────┘
             │
             ▼
      ┌──────────────┐
      │ Handoff      │
      │ (TPL-10)     │
      └──────────────┘
```

---

## Database Changes Summary

### New Columns

**clients table:**
- `intake_score` - AI readiness score (0-21)
- `intake_responses` - Detailed assessment answers (JSONB)
- `intake_completed_at` - When assessment was completed
- `recommended_pathway` - System-recommended engagement type

**artifacts table:**
- `client_id` - For client-level artifacts (TPL-01, TPL-02)
- `scope` - 'client' or 'engagement'

**station_runs table:**
- `client_id` - For client-level runs (S-01)
- `scope` - 'client' or 'engagement'

### Constraints

- Artifacts must have EITHER `client_id` OR `engagement_id` (not both)
- Scope must match: client artifacts have `client_id`, engagement artifacts have `engagement_id`

---

## Migration Steps

1. **Run the schema migration** (`20240212_client_level_artifacts.sql`)
   - Adds new columns and constraints

2. **Run the data migration** (`20240213_migrate_existing_artifacts.sql`)
   - Moves TPL-01 and TPL-02 to client level
   - Migrates intake data from engagements to clients
   - Cleans up duplicate station runs
   - Archives duplicate artifacts

---

## Expected Behavior After Migration

### On the Client Page:
- See client's Discovery Brief
- See client's Current State Map (with all processes)
- Run S-01 Discovery Station (client level)
- See history of S-01 runs for this client

### On the Engagement Page:
- See engagement-specific artifacts (TPL-03, 05, 09, 10)
- Automatically have access to client's Discovery Brief & Current State Map
- Run S-02 and S-03 (engagement level)
- Create engagement-specific deliverables

### When Running S-02:
- Receives client's Discovery Brief (TPL-01) automatically
- Receives client's Current State Map (TPL-02) automatically
- Has full context without re-entering data
- Creates Future State, Implementation Plan, ROI specific to this engagement's scope

---

## Summary

This architecture change transforms SERVE OS from an **engagement-centric** system to a **client-centric** system that supports multiple engagements.

**The key insight:** A client's business processes (Current State Map) and profile (Discovery Brief) are properties of the **client**, not any specific project. By storing this data at the client level, we enable:

1. **Efficiency** - No duplicate data entry
2. **Consistency** - Single source of truth for client information
3. **Intelligence** - AI stations build on accumulated knowledge
4. **Scalability** - Easy to create new engagements for existing clients

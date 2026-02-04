/**
 * Search Infrastructure (F3.1)
 *
 * Provides full-text search across clients, engagements, and artifacts.
 * Features:
 * - Fuzzy matching with Fuse.js
 * - Result ranking by relevance
 * - Type-based grouping
 * - Content search within artifacts
 *
 * User Stories: US-013, US-014
 * Test Cases: TC-103, TC-302
 */

import Fuse, { IFuseOptions } from 'fuse.js'

// =============================================================================
// Types
// =============================================================================

export type SearchResultType = 'client' | 'engagement' | 'artifact'

export interface SearchableItem {
  id: string
  type: SearchResultType
  title: string
  subtitle?: string
  description?: string
  content?: string
  metadata: Record<string, unknown>
  url: string
  score?: number
}

export interface SearchResult {
  item: SearchableItem
  score: number
  matches?: Array<{
    key: string
    value: string
    indices: Array<[number, number]>
  }>
}

export interface GroupedSearchResults {
  clients: SearchResult[]
  engagements: SearchResult[]
  artifacts: SearchResult[]
  total: number
}

export interface SearchOptions {
  limit?: number
  threshold?: number
  includeMatches?: boolean
  types?: SearchResultType[]
}

// =============================================================================
// Search Configuration
// =============================================================================

const DEFAULT_OPTIONS: IFuseOptions<SearchableItem> = {
  // Which keys to search
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'subtitle', weight: 0.2 },
    { name: 'description', weight: 0.2 },
    { name: 'content', weight: 0.2 },
  ],
  // Fuzzy matching settings
  threshold: 0.4, // Lower = stricter matching
  distance: 100,
  minMatchCharLength: 2,
  // Include match information for highlighting
  includeScore: true,
  includeMatches: true,
  // Use extended search for advanced queries
  useExtendedSearch: true,
  // Ignore location for better content matching
  ignoreLocation: true,
}

// =============================================================================
// Search Index Class
// =============================================================================

export class SearchIndex {
  private fuse: Fuse<SearchableItem>
  private items: SearchableItem[]

  constructor(items: SearchableItem[] = []) {
    this.items = items
    this.fuse = new Fuse(items, DEFAULT_OPTIONS)
  }

  /**
   * Update the search index with new items
   */
  setItems(items: SearchableItem[]): void {
    this.items = items
    this.fuse = new Fuse(items, DEFAULT_OPTIONS)
  }

  /**
   * Add items to the index
   */
  addItems(items: SearchableItem[]): void {
    this.items = [...this.items, ...items]
    this.fuse = new Fuse(this.items, DEFAULT_OPTIONS)
  }

  /**
   * Remove an item from the index
   */
  removeItem(id: string): void {
    this.items = this.items.filter(item => item.id !== id)
    this.fuse = new Fuse(this.items, DEFAULT_OPTIONS)
  }

  /**
   * Perform a search query
   */
  search(query: string, options: SearchOptions = {}): GroupedSearchResults {
    const {
      limit = 20,
      threshold = 0.4,
      includeMatches = true,
      types,
    } = options

    if (!query.trim()) {
      return {
        clients: [],
        engagements: [],
        artifacts: [],
        total: 0,
      }
    }

    // Create a new Fuse instance with custom options for this search
    const searchFuse = new Fuse(this.items, {
      ...DEFAULT_OPTIONS,
      threshold,
      includeMatches,
    })

    // Perform search
    let results = searchFuse.search(query, { limit: limit * 2 })

    // Filter by types if specified
    if (types && types.length > 0) {
      results = results.filter(r => types.includes(r.item.type))
    }

    // Convert to SearchResult format
    const searchResults: SearchResult[] = results.map(r => ({
      item: r.item,
      score: r.score ?? 1,
      matches: r.matches?.map(m => ({
        key: m.key ?? '',
        value: m.value ?? '',
        indices: m.indices as Array<[number, number]>,
      })),
    }))

    // Group by type
    const grouped = this.groupResults(searchResults, limit)

    return grouped
  }

  /**
   * Group search results by type
   */
  private groupResults(results: SearchResult[], limit: number): GroupedSearchResults {
    const clients: SearchResult[] = []
    const engagements: SearchResult[] = []
    const artifacts: SearchResult[] = []

    // Sort by score (lower is better in Fuse.js)
    const sorted = [...results].sort((a, b) => a.score - b.score)

    for (const result of sorted) {
      switch (result.item.type) {
        case 'client':
          if (clients.length < limit) clients.push(result)
          break
        case 'engagement':
          if (engagements.length < limit) engagements.push(result)
          break
        case 'artifact':
          if (artifacts.length < limit) artifacts.push(result)
          break
      }
    }

    return {
      clients,
      engagements,
      artifacts,
      total: clients.length + engagements.length + artifacts.length,
    }
  }

  /**
   * Get all items (for debugging)
   */
  getItems(): SearchableItem[] {
    return this.items
  }
}

// =============================================================================
// Data Transformers
// =============================================================================

export interface Client {
  id: string
  name: string
  industry: string | null
  primary_contact_name: string | null
  primary_contact_email: string | null
  notes: string | null
}

export interface Engagement {
  id: string
  name: string
  pathway: string
  status: string
  notes: string | null
  client: {
    id: string
    name: string
  }
}

export interface Artifact {
  id: string
  name: string
  template_id: string
  status: string
  content: Record<string, unknown>
  engagement: {
    id: string
    name: string
    client: {
      name: string
    }
  }
}

/**
 * Transform a client record into a searchable item
 */
export function clientToSearchable(client: Client): SearchableItem {
  return {
    id: client.id,
    type: 'client',
    title: client.name,
    subtitle: client.industry || undefined,
    description: client.primary_contact_name
      ? `Contact: ${client.primary_contact_name}`
      : undefined,
    content: client.notes || undefined,
    metadata: {
      industry: client.industry,
      contactName: client.primary_contact_name,
      contactEmail: client.primary_contact_email,
    },
    url: `/dashboard/clients/${client.id}`,
  }
}

/**
 * Transform an engagement record into a searchable item
 */
export function engagementToSearchable(engagement: Engagement): SearchableItem {
  const pathwayLabels: Record<string, string> = {
    knowledge_spine: 'Knowledge Spine',
    roi_audit: 'ROI Audit',
    workflow_sprint: 'Workflow Sprint',
  }

  return {
    id: engagement.id,
    type: 'engagement',
    title: engagement.name,
    subtitle: engagement.client.name,
    description: `${pathwayLabels[engagement.pathway] || engagement.pathway} • ${engagement.status}`,
    content: engagement.notes || undefined,
    metadata: {
      pathway: engagement.pathway,
      status: engagement.status,
      clientId: engagement.client.id,
      clientName: engagement.client.name,
    },
    url: `/dashboard/engagements/${engagement.id}`,
  }
}

/**
 * Transform an artifact record into a searchable item
 */
export function artifactToSearchable(artifact: Artifact): SearchableItem {
  // Extract searchable text from artifact content
  const contentText = extractTextFromContent(artifact.content)

  return {
    id: artifact.id,
    type: 'artifact',
    title: artifact.name,
    subtitle: `${artifact.engagement.client.name} • ${artifact.engagement.name}`,
    description: `${artifact.template_id} • ${artifact.status}`,
    content: contentText,
    metadata: {
      templateId: artifact.template_id,
      status: artifact.status,
      engagementId: artifact.engagement.id,
      engagementName: artifact.engagement.name,
      clientName: artifact.engagement.client.name,
    },
    url: `/dashboard/artifacts/${artifact.id}`,
  }
}

/**
 * Extract searchable text from artifact content
 */
function extractTextFromContent(content: Record<string, unknown>): string {
  const texts: string[] = []

  for (const value of Object.values(content)) {
    if (typeof value === 'string') {
      texts.push(value)
    } else if (Array.isArray(value)) {
      texts.push(value.filter(v => typeof v === 'string').join(' '))
    } else if (typeof value === 'object' && value !== null) {
      texts.push(extractTextFromContent(value as Record<string, unknown>))
    }
  }

  return texts.join(' ').slice(0, 5000) // Limit content length
}

// =============================================================================
// Singleton Search Index Instance
// =============================================================================

let globalSearchIndex: SearchIndex | null = null

export function getSearchIndex(): SearchIndex {
  if (!globalSearchIndex) {
    globalSearchIndex = new SearchIndex()
  }
  return globalSearchIndex
}

export function resetSearchIndex(): void {
  globalSearchIndex = null
}

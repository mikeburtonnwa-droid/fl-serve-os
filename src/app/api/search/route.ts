/**
 * Search API Endpoint (F3.1)
 *
 * Provides server-side search across clients, engagements, and artifacts.
 * Returns grouped, ranked results within 200ms SLA.
 *
 * User Stories: US-013, US-014
 * Test Cases: TC-103, TC-302
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  SearchIndex,
  clientToSearchable,
  engagementToSearchable,
  artifactToSearchable,
  type SearchResultType,
  type GroupedSearchResults,
} from '@/lib/search'

// =============================================================================
// Supabase Client
// =============================================================================

async function createSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}

// =============================================================================
// GET Handler
// =============================================================================

export async function GET(request: NextRequest) {
  const startTime = performance.now()

  try {
    const supabase = await createSupabaseClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const typesParam = searchParams.get('types')
    const types = typesParam
      ? (typesParam.split(',') as SearchResultType[])
      : undefined

    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        query: '',
        results: {
          clients: [],
          engagements: [],
          artifacts: [],
          total: 0,
        },
        durationMs: Math.round(performance.now() - startTime),
      })
    }

    // Fetch all searchable data in parallel
    const [clientsResult, engagementsResult, artifactsResult] = await Promise.all([
      // Fetch clients
      supabase
        .from('clients')
        .select('id, name, industry, primary_contact_name, primary_contact_email, notes')
        .order('name'),

      // Fetch engagements with client info
      supabase
        .from('engagements')
        .select(`
          id, name, pathway, status, notes,
          client:clients(id, name)
        `)
        .order('created_at', { ascending: false }),

      // Fetch artifacts with engagement and client info
      supabase
        .from('artifacts')
        .select(`
          id, name, template_id, status, content,
          engagement:engagements(
            id, name,
            client:clients(name)
          )
        `)
        .neq('status', 'archived')
        .order('updated_at', { ascending: false }),
    ])

    // Transform data to searchable items
    const searchIndex = new SearchIndex()
    const searchableItems = []

    // Add clients
    if (clientsResult.data && (!types || types.includes('client'))) {
      for (const client of clientsResult.data) {
        searchableItems.push(clientToSearchable(client))
      }
    }

    // Add engagements
    if (engagementsResult.data && (!types || types.includes('engagement'))) {
      for (const engagement of engagementsResult.data) {
        if (engagement.client) {
          searchableItems.push(engagementToSearchable(engagement as any))
        }
      }
    }

    // Add artifacts
    if (artifactsResult.data && (!types || types.includes('artifact'))) {
      for (const artifact of artifactsResult.data) {
        // Handle Supabase nested relation format (may be array or object)
        const engagement = Array.isArray(artifact.engagement)
          ? artifact.engagement[0]
          : artifact.engagement
        if (engagement) {
          const client = Array.isArray(engagement.client)
            ? engagement.client[0]
            : engagement.client
          if (client) {
            const transformedArtifact = {
              ...artifact,
              engagement: {
                ...engagement,
                client,
              },
            }
            searchableItems.push(artifactToSearchable(transformedArtifact as any))
          }
        }
      }
    }

    // Set items and perform search
    searchIndex.setItems(searchableItems)
    const results = searchIndex.search(query, { limit, types })

    // Calculate duration
    const durationMs = Math.round(performance.now() - startTime)

    return NextResponse.json({
      success: true,
      query,
      results,
      durationMs,
      // Include warning if over SLA
      ...(durationMs > 200 && { warning: 'Search exceeded 200ms SLA' }),
    })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
        durationMs: Math.round(performance.now() - startTime),
      },
      { status: 500 }
    )
  }
}

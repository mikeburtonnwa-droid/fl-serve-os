/**
 * Templates API Routes (F8.1, F8.2)
 *
 * GET - List and search templates
 * POST - Create new template
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =============================================================================
// Validation Schemas
// =============================================================================

const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  category: z.enum(['assessment', 'proposal', 'report', 'presentation', 'plan', 'checklist', 'other']),
  content: z.string().min(1),
  contentFormat: z.enum(['markdown', 'html', 'json']).default('markdown'),
  tags: z.array(z.string()).default([]),
  industry: z.string().optional(),
  useCase: z.string().optional(),
  isAnonymized: z.boolean().default(false),
  originalArtifactId: z.string().uuid().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
})

// =============================================================================
// GET - List Templates
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search') || undefined
    const category = searchParams.get('category') || undefined
    const source = searchParams.get('source') || undefined
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // Build query
    let query = supabase
      .from('templates')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .order('usage_count', { ascending: false })
      .order('rating', { ascending: false, nullsFirst: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    // Apply filters
    if (category) {
      query = query.eq('category', category)
    }

    if (source) {
      query = query.eq('source', source)
    }

    if (tags && tags.length > 0) {
      query = query.overlaps('tags', tags)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) throw error

    // Transform to preview format (truncate content)
    const templates = data.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      contentPreview: t.content.substring(0, 500),
      contentFormat: t.content_format,
      source: t.source,
      createdBy: t.created_by,
      createdByName: t.created_by_name,
      isAnonymized: t.is_anonymized,
      tags: t.tags,
      industry: t.industry,
      useCase: t.use_case,
      usageCount: t.usage_count,
      rating: t.rating ? parseFloat(t.rating) : undefined,
      ratingCount: t.rating_count,
      status: t.status,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }))

    return NextResponse.json({
      success: true,
      templates,
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > page * pageSize,
    })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST - Create Template
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validation = CreateTemplateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const {
      name,
      description,
      category,
      content,
      contentFormat,
      tags,
      industry,
      useCase,
      isAnonymized,
      originalArtifactId,
      status,
    } = validation.data

    // Create template
    const { data, error } = await supabase
      .from('templates')
      .insert({
        name,
        description,
        category,
        content,
        content_format: contentFormat,
        source: 'user',
        is_anonymized: isAnonymized,
        original_artifact_id: originalArtifactId,
        tags,
        industry,
        use_case: useCase,
        status,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      template: {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        content: data.content,
        contentFormat: data.content_format,
        source: data.source,
        isAnonymized: data.is_anonymized,
        tags: data.tags,
        industry: data.industry,
        useCase: data.use_case,
        usageCount: data.usage_count,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}

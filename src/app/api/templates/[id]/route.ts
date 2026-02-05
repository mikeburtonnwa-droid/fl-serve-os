/**
 * Template Detail API Routes (F8.2, F8.3)
 *
 * GET - Get template details
 * PATCH - Update template
 * DELETE - Delete template
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

const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(1000).optional(),
  category: z.enum(['assessment', 'proposal', 'report', 'presentation', 'plan', 'checklist', 'other']).optional(),
  content: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  industry: z.string().optional(),
  useCase: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
})

// =============================================================================
// GET - Get Template Details
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch template
    const { data: template, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Fetch related templates (same category, different template)
    const { data: related } = await supabase
      .from('templates')
      .select('id, name, description, category, tags, usage_count, rating')
      .eq('status', 'published')
      .eq('category', template.category)
      .neq('id', id)
      .order('usage_count', { ascending: false })
      .limit(5)

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        content: template.content,
        contentFormat: template.content_format,
        source: template.source,
        createdBy: template.created_by,
        createdByName: template.created_by_name,
        isAnonymized: template.is_anonymized,
        originalArtifactId: template.original_artifact_id,
        tags: template.tags,
        industry: template.industry,
        useCase: template.use_case,
        usageCount: template.usage_count,
        rating: template.rating ? parseFloat(template.rating) : undefined,
        ratingCount: template.rating_count,
        status: template.status,
        createdAt: template.created_at,
        updatedAt: template.updated_at,
      },
      relatedTemplates: (related || []).map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        tags: t.tags,
        usageCount: t.usage_count,
        rating: t.rating ? parseFloat(t.rating) : undefined,
      })),
    })
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}

// =============================================================================
// PATCH - Update Template
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Validate request body
    const validation = UpdateTemplateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (validation.data.name) updateData.name = validation.data.name
    if (validation.data.description) updateData.description = validation.data.description
    if (validation.data.category) updateData.category = validation.data.category
    if (validation.data.content) updateData.content = validation.data.content
    if (validation.data.tags) updateData.tags = validation.data.tags
    if (validation.data.industry !== undefined) updateData.industry = validation.data.industry
    if (validation.data.useCase !== undefined) updateData.use_case = validation.data.useCase
    if (validation.data.status) updateData.status = validation.data.status

    // Update template
    const { data, error } = await supabase
      .from('templates')
      .update(updateData)
      .eq('id', id)
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
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

// =============================================================================
// DELETE - Delete Template
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}

/**
 * Use Template API Route (F8.3)
 *
 * POST - Use template to create new artifact
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// =============================================================================
// Validation Schemas
// =============================================================================

const UseTemplateSchema = z.object({
  engagementId: z.string().uuid(),
  artifactName: z.string().min(1).max(200).optional(),
  customizations: z.record(z.string(), z.string()).optional(),
})

// =============================================================================
// POST - Use Template
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: templateId } = await params
    const body = await request.json()

    // Validate request body
    const validation = UseTemplateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { engagementId, artifactName, customizations } = validation.data

    // Fetch template
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Verify engagement exists
    const { data: engagement, error: engagementError } = await supabase
      .from('engagements')
      .select('id, name')
      .eq('id', engagementId)
      .single()

    if (engagementError || !engagement) {
      return NextResponse.json(
        { error: 'Engagement not found' },
        { status: 404 }
      )
    }

    // Process content with customizations
    let content = template.content
    if (customizations) {
      for (const [key, value] of Object.entries(customizations)) {
        const placeholder = `[${key}]`
        content = content.replaceAll(placeholder, value)
      }
    }

    // Create artifact from template
    const { data: artifact, error: artifactError } = await supabase
      .from('artifacts')
      .insert({
        engagement_id: engagementId,
        name: artifactName || `${template.name} (from template)`,
        type: template.category,
        content,
        status: 'draft',
        metadata: {
          fromTemplate: true,
          templateId: template.id,
          templateName: template.name,
        },
      })
      .select()
      .single()

    if (artifactError) throw artifactError

    // Record template usage
    const { error: usageError } = await supabase
      .from('template_usages')
      .insert({
        template_id: templateId,
        engagement_id: engagementId,
        artifact_id: artifact.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      })

    if (usageError) {
      console.warn('Failed to record template usage:', usageError)
      // Don't fail the request if usage recording fails
    }

    return NextResponse.json({
      success: true,
      artifact: {
        id: artifact.id,
        name: artifact.name,
        type: artifact.type,
        status: artifact.status,
        engagementId: artifact.engagement_id,
        createdAt: artifact.created_at,
      },
      message: `Created artifact "${artifact.name}" from template`,
    })
  } catch (error) {
    console.error('Error using template:', error)
    return NextResponse.json(
      { error: 'Failed to use template' },
      { status: 500 }
    )
  }
}

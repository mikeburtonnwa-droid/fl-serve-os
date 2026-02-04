/**
 * Batch Artifact Creation API (F2.3)
 *
 * Creates multiple artifacts from AI suggestions in a single request.
 * Supports:
 * - Sequential creation with progress tracking
 * - Partial failure handling (continues on error by default)
 * - Stop-on-error mode for critical operations
 * - Transaction-like behavior with rollback option
 *
 * User Stories: US-011, US-012
 * Test Cases: TC-101, TC-102
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { mapAISuggestionToTemplate, canCreateArtifact } from '@/lib/field-mapper'
import { TEMPLATE_METADATA, type TemplateId } from '@/lib/workflow'
import { z } from 'zod'

// =============================================================================
// Request Schema
// =============================================================================

const ArtifactRequestSchema = z.object({
  templateId: z.string(),
  suggestedContent: z.record(z.string(), z.unknown()),
  action: z.enum(['create', 'update']).default('create'),
  name: z.string().optional(),
})

const BatchRequestSchema = z.object({
  engagementId: z.string().uuid(),
  stationId: z.string().optional(),
  artifacts: z.array(ArtifactRequestSchema).min(1).max(10),
  options: z.object({
    stopOnError: z.boolean().default(false),
    rollbackOnError: z.boolean().default(false),
    skipValidation: z.boolean().default(false),
  }).optional(),
})

// =============================================================================
// Response Types
// =============================================================================

interface ArtifactResult {
  templateId: string
  success: boolean
  artifactId?: string
  artifactName?: string
  version?: number
  error?: string
  validationErrors?: string[]
  warnings?: string[]
}

interface BatchResponse {
  success: boolean
  totalRequested: number
  totalCreated: number
  totalFailed: number
  results: ArtifactResult[]
  rollbackPerformed?: boolean
}

// =============================================================================
// Helper Functions
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

async function logAuditEvent(
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>,
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details: Record<string, unknown>
) {
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    details,
  })
}

// =============================================================================
// POST Handler
// =============================================================================

export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json()
    const parseResult = BatchRequestSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          validationErrors: parseResult.error.issues.map((e: z.ZodIssue) => e.message)
        },
        { status: 400 }
      )
    }

    const { engagementId, stationId, artifacts, options } = parseResult.data
    const { stopOnError = false, rollbackOnError = false, skipValidation = false } = options || {}

    // Verify engagement exists and user has access
    const { data: engagement, error: engagementError } = await supabase
      .from('engagements')
      .select('id, name')
      .eq('id', engagementId)
      .single()

    if (engagementError || !engagement) {
      return NextResponse.json(
        { success: false, error: 'Engagement not found' },
        { status: 404 }
      )
    }

    // Process artifacts
    const results: ArtifactResult[] = []
    const createdIds: string[] = []
    let hasError = false

    for (const artifactRequest of artifacts) {
      const { templateId, suggestedContent, action, name } = artifactRequest
      const meta = TEMPLATE_METADATA[templateId as TemplateId]

      if (!meta) {
        const result: ArtifactResult = {
          templateId,
          success: false,
          error: `Template ${templateId} not found`,
        }
        results.push(result)
        hasError = true

        if (stopOnError) break
        continue
      }

      // Map AI suggestion to template fields
      const mappingResult = mapAISuggestionToTemplate(
        templateId as TemplateId,
        suggestedContent as Record<string, unknown>
      )

      // Validate mapping (unless skipValidation is true)
      if (!skipValidation) {
        const validation = canCreateArtifact(mappingResult)

        if (!validation.canCreate) {
          const result: ArtifactResult = {
            templateId,
            success: false,
            error: 'Validation failed',
            validationErrors: validation.blockers,
            warnings: validation.warnings,
          }
          results.push(result)
          hasError = true

          if (stopOnError) break
          continue
        }
      }

      // Check for existing artifact if update
      let version = 1
      if (action === 'update') {
        const { data: existing } = await supabase
          .from('artifacts')
          .select('version')
          .eq('engagement_id', engagementId)
          .eq('template_id', templateId)
          .order('version', { ascending: false })
          .limit(1)
          .single()

        if (existing) {
          version = existing.version + 1
        }
      }

      // Create the artifact
      const artifactName = name || (version > 1 ? `${meta.name} (v${version})` : meta.name)

      const { data: artifact, error: createError } = await supabase
        .from('artifacts')
        .insert({
          engagement_id: engagementId,
          template_id: templateId,
          name: artifactName,
          content: mappingResult.mappedContent,
          status: 'draft',
          sensitivity_tier: meta.tier,
          version,
          source_station: stationId || null,
        })
        .select('id, name, version')
        .single()

      if (createError || !artifact) {
        const result: ArtifactResult = {
          templateId,
          success: false,
          error: createError?.message || 'Failed to create artifact',
          warnings: mappingResult.warnings,
        }
        results.push(result)
        hasError = true

        if (stopOnError) break
        continue
      }

      // Success
      createdIds.push(artifact.id)
      results.push({
        templateId,
        success: true,
        artifactId: artifact.id,
        artifactName: artifact.name,
        version: artifact.version,
        warnings: mappingResult.warnings.length > 0 ? mappingResult.warnings : undefined,
      })

      // Log audit event
      await logAuditEvent(
        supabase,
        user.id,
        'batch_create_artifact',
        'artifact',
        artifact.id,
        {
          templateId,
          engagementId,
          stationId,
          version,
          action,
          hadWarnings: mappingResult.warnings.length > 0,
        }
      )
    }

    // Handle rollback if requested and there was an error
    let rollbackPerformed = false
    if (rollbackOnError && hasError && createdIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('artifacts')
        .delete()
        .in('id', createdIds)

      if (!deleteError) {
        rollbackPerformed = true
        // Update results to reflect rollback
        results.forEach(result => {
          if (result.success) {
            result.success = false
            result.error = 'Rolled back due to batch error'
          }
        })
      }
    }

    // Build response
    const response: BatchResponse = {
      success: !hasError,
      totalRequested: artifacts.length,
      totalCreated: rollbackPerformed ? 0 : createdIds.length,
      totalFailed: artifacts.length - (rollbackPerformed ? 0 : createdIds.length),
      results,
      rollbackPerformed: rollbackPerformed || undefined,
    }

    return NextResponse.json(response, {
      status: hasError ? 207 : 201, // 207 Multi-Status for partial success
    })

  } catch (error) {
    console.error('Batch artifact creation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

/**
 * Engagement Clone API Route (F9.1-F9.4)
 *
 * POST - Clone an engagement with selective artifact cloning
 * GET - Get clone preview/configuration
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { processArtifactForClone } from '@/lib/cloning'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =============================================================================
// Validation Schemas
// =============================================================================

const CloneConfigSchema = z.object({
  targetClientId: z.string().uuid(),
  newEngagementName: z.string().min(1).max(200),
  clearClientFields: z.boolean().default(true),
  fieldsToClear: z.array(z.string()).optional(),
  selectedArtifactIds: z.array(z.string().uuid()),
  includeVersionHistory: z.boolean().default(false),
  includeComments: z.boolean().default(false),
  preservePathway: z.boolean().default(true),
  cloneNotes: z.string().optional(),
})

// =============================================================================
// GET - Get Clone Preview
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: engagementId } = await params

    // Fetch engagement with artifacts
    const { data: engagement, error: engError } = await supabase
      .from('engagements')
      .select(`
        *,
        client:clients(id, name),
        artifacts(id, name, type, status, created_at, content)
      `)
      .eq('id', engagementId)
      .single()

    if (engError || !engagement) {
      return NextResponse.json(
        { error: 'Engagement not found' },
        { status: 404 }
      )
    }

    // Analyze artifacts for client-specific data
    const artifactsWithAnalysis = engagement.artifacts.map((artifact: {
      id: string
      name: string
      type: string
      status: string
      created_at: string
      content: string | Record<string, unknown>
    }) => {
      let hasClientData = false
      const clientDataFields: string[] = []

      // Try to parse content and analyze
      try {
        const content =
          typeof artifact.content === 'string'
            ? JSON.parse(artifact.content)
            : artifact.content

        // Check for common client-specific field patterns
        const clientPatterns = [
          /company/i,
          /client/i,
          /stakeholder/i,
          /contact/i,
          /budget/i,
          /testimonial/i,
        ]

        if (content && typeof content === 'object') {
          for (const key of Object.keys(content)) {
            if (clientPatterns.some((p) => p.test(key))) {
              hasClientData = true
              clientDataFields.push(key)
            }
          }
        }
      } catch {
        // Content not parseable, assume it might have client data
        hasClientData = true
      }

      return {
        id: artifact.id,
        name: artifact.name,
        type: artifact.type,
        status: artifact.status,
        createdAt: artifact.created_at,
        hasClientData,
        clientDataFields,
      }
    })

    // Check if this engagement was itself cloned
    const { data: cloneRecord } = await supabase
      .from('engagement_clones')
      .select('source_engagement_id, cloned_at')
      .eq('target_engagement_id', engagementId)
      .single()

    return NextResponse.json({
      success: true,
      engagement: {
        id: engagement.id,
        name: engagement.name,
        status: engagement.status,
        pathway: engagement.pathway,
        client: engagement.client,
        clonedFrom: cloneRecord
          ? {
              engagementId: cloneRecord.source_engagement_id,
              clonedAt: cloneRecord.cloned_at,
            }
          : null,
      },
      artifacts: artifactsWithAnalysis,
      defaultConfiguration: {
        clearClientFields: true,
        includeVersionHistory: false,
        includeComments: false,
        preservePathway: true,
      },
    })
  } catch (error) {
    console.error('Error getting clone preview:', error)
    return NextResponse.json(
      { error: 'Failed to get clone preview' },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST - Execute Clone
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sourceEngagementId } = await params
    const body = await request.json()

    // Validate request
    const validation = CloneConfigSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid configuration', details: validation.error.issues },
        { status: 400 }
      )
    }

    const config = validation.data

    // Fetch source engagement
    const { data: sourceEngagement, error: sourceError } = await supabase
      .from('engagements')
      .select('*, client:clients(id, name)')
      .eq('id', sourceEngagementId)
      .single()

    if (sourceError || !sourceEngagement) {
      return NextResponse.json(
        { error: 'Source engagement not found' },
        { status: 404 }
      )
    }

    // Verify target client exists
    const { data: targetClient, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', config.targetClientId)
      .single()

    if (clientError || !targetClient) {
      return NextResponse.json(
        { error: 'Target client not found' },
        { status: 404 }
      )
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Track cloning statistics
    let artifactsCloned = 0
    let artifactsSkipped = 0
    let fieldsCleared = 0
    let fieldsPreserved = 0
    const clearedFieldsList: string[] = []
    const preservedFieldsList: string[] = []
    const warnings: string[] = []

    // Create new engagement
    const { data: newEngagement, error: createError } = await supabase
      .from('engagements')
      .insert({
        name: config.newEngagementName,
        client_id: config.targetClientId,
        status: 'active',
        pathway: config.preservePathway ? sourceEngagement.pathway : null,
        created_by: user?.id,
        primary_consultant: user?.id,
        clone_metadata: {
          cloned_from: sourceEngagementId,
          cloned_at: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (createError || !newEngagement) {
      throw new Error(`Failed to create engagement: ${createError?.message}`)
    }

    // Clone selected artifacts
    if (config.selectedArtifactIds.length > 0) {
      // Fetch artifacts to clone
      const { data: artifactsToClone, error: artifactsError } = await supabase
        .from('artifacts')
        .select('*')
        .in('id', config.selectedArtifactIds)
        .eq('engagement_id', sourceEngagementId)

      if (artifactsError) {
        warnings.push(`Error fetching artifacts: ${artifactsError.message}`)
      } else if (artifactsToClone) {
        for (const artifact of artifactsToClone) {
          try {
            // Process artifact for cloning
            const { processedArtifact, clearedFields, preservedFields } =
              processArtifactForClone(
                {
                  id: artifact.id,
                  name: artifact.name,
                  type: artifact.type,
                  content: artifact.content,
                  metadata: artifact.metadata,
                },
                config.clearClientFields,
                config.fieldsToClear
              )

            // Create cloned artifact
            const { error: cloneArtifactError } = await supabase
              .from('artifacts')
              .insert({
                engagement_id: newEngagement.id,
                name: processedArtifact.name,
                type: processedArtifact.type,
                content:
                  typeof processedArtifact.content === 'object'
                    ? JSON.stringify(processedArtifact.content)
                    : processedArtifact.content,
                status: 'draft',
                metadata: processedArtifact.metadata,
                cloned_from_id: artifact.id,
                created_by: user?.id,
              })

            if (cloneArtifactError) {
              warnings.push(
                `Failed to clone artifact "${artifact.name}": ${cloneArtifactError.message}`
              )
              artifactsSkipped++
            } else {
              artifactsCloned++
              fieldsCleared += clearedFields.length
              fieldsPreserved += preservedFields.length
              clearedFieldsList.push(...clearedFields)
              preservedFieldsList.push(...preservedFields)
            }
          } catch (err) {
            warnings.push(
              `Error processing artifact "${artifact.name}": ${err}`
            )
            artifactsSkipped++
          }
        }
      }
    }

    // Record clone lineage
    const summary = {
      artifactsCloned,
      artifactsSkipped,
      fieldsCleared,
      fieldsPreserved,
      clearedFields: [...new Set(clearedFieldsList)],
      preservedFields: [...new Set(preservedFieldsList)],
      warnings,
    }

    const { data: lineageRecord, error: lineageError } = await supabase
      .from('engagement_clones')
      .insert({
        source_engagement_id: sourceEngagementId,
        target_engagement_id: newEngagement.id,
        cloned_by: user?.id,
        configuration: config,
        summary,
        notes: config.cloneNotes,
      })
      .select()
      .single()

    if (lineageError) {
      warnings.push(`Failed to record lineage: ${lineageError.message}`)
    }

    return NextResponse.json({
      success: true,
      newEngagementId: newEngagement.id,
      newEngagementName: newEngagement.name,
      sourceEngagementId,
      clonedAt: new Date().toISOString(),
      summary,
      lineageId: lineageRecord?.id,
    })
  } catch (error) {
    console.error('Error cloning engagement:', error)
    return NextResponse.json(
      { error: 'Failed to clone engagement' },
      { status: 500 }
    )
  }
}

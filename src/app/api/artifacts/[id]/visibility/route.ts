/**
 * Artifact Visibility API Route (F10.6)
 *
 * PATCH - Toggle artifact visibility for client portal
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// =============================================================================
// Validation Schema
// =============================================================================

const VisibilitySchema = z.object({
  isClientVisible: z.boolean(),
})

// =============================================================================
// PATCH - Toggle Visibility
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: artifactId } = await params
    const body = await request.json()

    // Validate request
    const validation = VisibilitySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { isClientVisible } = validation.data

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Fetch artifact to verify ownership and sensitivity
    const { data: artifact, error: artifactError } = await supabase
      .from('artifacts')
      .select(`
        id,
        name,
        type,
        engagement_id,
        client_visible,
        engagement:engagements(
          id,
          created_by,
          consultant_id
        )
      `)
      .eq('id', artifactId)
      .single()

    if (artifactError || !artifact) {
      return NextResponse.json(
        { error: 'Artifact not found' },
        { status: 404 }
      )
    }

    // Verify user has permission (is owner or consultant)
    const engagement = artifact.engagement as unknown as {
      id: string
      created_by: string
      consultant_id: string
    }

    if (
      engagement.created_by !== user?.id &&
      engagement.consultant_id !== user?.id
    ) {
      return NextResponse.json(
        { error: 'Not authorized to change visibility' },
        { status: 403 }
      )
    }

    // Update artifact visibility
    const { data: updatedArtifact, error: updateError } = await supabase
      .from('artifacts')
      .update({
        client_visible: isClientVisible,
      })
      .eq('id', artifactId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Update or create visibility record
    const visibilityData = {
      artifact_id: artifactId,
      is_client_visible: isClientVisible,
      updated_by: user?.id,
      updated_at: new Date().toISOString(),
      ...(isClientVisible
        ? { visible_since: new Date().toISOString(), hidden_since: null }
        : { hidden_since: new Date().toISOString() }),
    }

    await supabase
      .from('artifact_visibility')
      .upsert(visibilityData, { onConflict: 'artifact_id' })

    return NextResponse.json({
      success: true,
      artifact: {
        id: updatedArtifact.id,
        name: updatedArtifact.name,
        isClientVisible: updatedArtifact.client_visible,
      },
      message: isClientVisible
        ? 'Artifact is now visible to client'
        : 'Artifact is now hidden from client',
    })
  } catch (error) {
    console.error('Error updating visibility:', error)
    return NextResponse.json(
      { error: 'Failed to update visibility' },
      { status: 500 }
    )
  }
}

// =============================================================================
// GET - Get Visibility Status
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: artifactId } = await params

    // Fetch artifact visibility
    const { data: artifact, error } = await supabase
      .from('artifacts')
      .select('id, name, client_visible')
      .eq('id', artifactId)
      .single()

    if (error || !artifact) {
      return NextResponse.json(
        { error: 'Artifact not found' },
        { status: 404 }
      )
    }

    // Get visibility history
    const { data: visibilityRecord } = await supabase
      .from('artifact_visibility')
      .select('*')
      .eq('artifact_id', artifactId)
      .single()

    return NextResponse.json({
      success: true,
      visibility: {
        artifactId: artifact.id,
        isClientVisible: artifact.client_visible,
        visibleSince: visibilityRecord?.visible_since,
        hiddenSince: visibilityRecord?.hidden_since,
        lastUpdatedAt: visibilityRecord?.updated_at,
      },
    })
  } catch (error) {
    console.error('Error getting visibility:', error)
    return NextResponse.json(
      { error: 'Failed to get visibility' },
      { status: 500 }
    )
  }
}

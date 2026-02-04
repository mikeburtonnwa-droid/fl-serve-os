/**
 * Artifact Version Restore API (F5.4)
 *
 * Restores an artifact to a previous version.
 *
 * User Stories: US-021
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'

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
// POST - Restore Version
// =============================================================================

const RestoreSchema = z.object({
  versionNumber: z.number().int().min(1),
  restoreMode: z.enum(['full', 'selective']).default('full'),
  selectedFields: z.array(z.string()).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: artifactId } = await params
    const supabase = await createSupabaseClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const parseResult = RestoreSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parseResult.error.issues },
        { status: 400 }
      )
    }

    const { versionNumber, restoreMode, selectedFields } = parseResult.data

    // Fetch current artifact
    const { data: artifact, error: artifactError } = await supabase
      .from('artifacts')
      .select('id, name, content, version')
      .eq('id', artifactId)
      .single()

    if (artifactError || !artifact) {
      return NextResponse.json(
        { success: false, error: 'Artifact not found' },
        { status: 404 }
      )
    }

    // Fetch the version to restore
    const { data: versionData, error: versionError } = await supabase
      .from('artifact_versions')
      .select('*')
      .eq('artifact_id', artifactId)
      .eq('version_number', versionNumber)
      .single()

    if (versionError || !versionData) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 }
      )
    }

    // Determine new content based on restore mode
    let newContent: Record<string, unknown>
    let newName: string

    if (restoreMode === 'full') {
      // Full restore - replace everything
      newContent = versionData.content
      newName = versionData.name
    } else {
      // Selective restore - only restore selected fields
      newContent = { ...artifact.content }
      newName = artifact.name

      if (selectedFields && selectedFields.length > 0) {
        for (const field of selectedFields) {
          if (field === 'name') {
            newName = versionData.name
          } else if (field in versionData.content) {
            newContent[field] = versionData.content[field]
          }
        }
      }
    }

    // Update the artifact (this will trigger version creation via database trigger)
    const { data: updatedArtifact, error: updateError } = await supabase
      .from('artifacts')
      .update({
        name: newName,
        content: newContent,
        version: artifact.version + 1,
        last_edited_by: user.id,
        last_edited_at: new Date().toISOString(),
      })
      .eq('id', artifactId)
      .select('version')
      .single()

    if (updateError) {
      console.error('Restore error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to restore version' },
        { status: 500 }
      )
    }

    // Log the restore action
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'version_restore',
      entity_type: 'artifact',
      entity_id: artifactId,
      metadata: {
        restoredFromVersion: versionNumber,
        newVersion: updatedArtifact.version,
        restoreMode,
        selectedFields: selectedFields || [],
      },
    })

    return NextResponse.json({
      success: true,
      newVersion: updatedArtifact.version,
      restoredFromVersion: versionNumber,
      message: `Successfully restored to version ${versionNumber}`,
    })

  } catch (error) {
    console.error('Version restore error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to restore version' },
      { status: 500 }
    )
  }
}

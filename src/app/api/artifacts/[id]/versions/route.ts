/**
 * Artifact Versions API (F5.1, F5.2)
 *
 * Provides endpoints for:
 * - GET: Fetch version history for an artifact
 * - POST: Compare two versions
 *
 * User Stories: US-021, US-022
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { compareVersions } from '@/lib/versions/diff'
import type { ArtifactVersion, VersionDiff } from '@/lib/versions/types'

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
// GET - Fetch Version History
// =============================================================================

export async function GET(
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

    // Fetch the artifact to get current version
    const { data: artifact, error: artifactError } = await supabase
      .from('artifacts')
      .select('id, name, content, version, updated_at')
      .eq('id', artifactId)
      .single()

    if (artifactError || !artifact) {
      return NextResponse.json(
        { success: false, error: 'Artifact not found' },
        { status: 404 }
      )
    }

    // Fetch version history
    const { data: versions, error: versionsError } = await supabase
      .from('artifact_versions')
      .select(`
        id,
        artifact_id,
        version_number,
        content,
        name,
        change_summary,
        created_by,
        created_at
      `)
      .eq('artifact_id', artifactId)
      .order('version_number', { ascending: false })

    if (versionsError) {
      console.error('Error fetching versions:', versionsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch version history' },
        { status: 500 }
      )
    }

    // Add current version to the list
    const allVersions: ArtifactVersion[] = [
      {
        id: 'current',
        artifact_id: artifactId,
        version_number: artifact.version,
        content: artifact.content,
        name: artifact.name,
        change_summary: 'Current version',
        created_at: artifact.updated_at,
      },
      ...(versions || []),
    ]

    return NextResponse.json({
      success: true,
      versions: allVersions,
      total: allVersions.length,
      currentVersion: artifact.version,
    })

  } catch (error) {
    console.error('Version history error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch version history' },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST - Compare Versions
// =============================================================================

const CompareSchema = z.object({
  versionFrom: z.number().int().min(1),
  versionTo: z.number().int().min(1),
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
    const parseResult = CompareSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parseResult.error.issues },
        { status: 400 }
      )
    }

    const { versionFrom, versionTo } = parseResult.data

    // Fetch the artifact for current version
    const { data: artifact } = await supabase
      .from('artifacts')
      .select('id, name, content, version')
      .eq('id', artifactId)
      .single()

    if (!artifact) {
      return NextResponse.json(
        { success: false, error: 'Artifact not found' },
        { status: 404 }
      )
    }

    // Helper to get version data
    const getVersionData = async (versionNum: number): Promise<ArtifactVersion | null> => {
      if (versionNum === artifact.version) {
        return {
          id: 'current',
          artifact_id: artifactId,
          version_number: artifact.version,
          content: artifact.content,
          name: artifact.name,
          created_at: new Date().toISOString(),
        }
      }

      const { data } = await supabase
        .from('artifact_versions')
        .select('*')
        .eq('artifact_id', artifactId)
        .eq('version_number', versionNum)
        .single()

      return data
    }

    // Fetch both versions
    const [versionFromData, versionToData] = await Promise.all([
      getVersionData(versionFrom),
      getVersionData(versionTo),
    ])

    if (!versionFromData || !versionToData) {
      return NextResponse.json(
        { success: false, error: 'One or both versions not found' },
        { status: 404 }
      )
    }

    // Compute diff
    const diff: VersionDiff = compareVersions(
      versionFromData.content,
      versionToData.content,
      versionFromData.name,
      versionToData.name
    )

    diff.versionFrom = versionFrom
    diff.versionTo = versionTo

    return NextResponse.json({
      success: true,
      diff,
      versionFromData,
      versionToData,
    })

  } catch (error) {
    console.error('Version compare error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to compare versions' },
      { status: 500 }
    )
  }
}

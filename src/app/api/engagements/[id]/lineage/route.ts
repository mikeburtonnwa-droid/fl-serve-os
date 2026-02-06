/**
 * Engagement Lineage API Route (F9.4)
 *
 * GET - Get clone lineage tree for an engagement
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// =============================================================================
// GET - Get Lineage Tree
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: engagementId } = await params

    // Verify engagement exists
    const { data: engagement, error: engError } = await supabase
      .from('engagements')
      .select('id, name, clone_metadata')
      .eq('id', engagementId)
      .single()

    if (engError || !engagement) {
      return NextResponse.json(
        { error: 'Engagement not found' },
        { status: 404 }
      )
    }

    // Get parent (what this was cloned from)
    const { data: parentClone } = await supabase
      .from('engagement_clones')
      .select(`
        id,
        source_engagement_id,
        cloned_at,
        summary,
        source:engagements!engagement_clones_source_engagement_id_fkey(
          id,
          name,
          client:clients(id, name)
        )
      `)
      .eq('target_engagement_id', engagementId)
      .single()

    // Get children (what was cloned from this)
    const { data: childClones } = await supabase
      .from('engagement_clones')
      .select(`
        id,
        target_engagement_id,
        cloned_at,
        cloned_by,
        summary,
        target:engagements!engagement_clones_target_engagement_id_fkey(
          id,
          name,
          client:clients(id, name)
        )
      `)
      .eq('source_engagement_id', engagementId)
      .order('cloned_at', { ascending: false })

    // Build lineage tree
    interface LineageNode {
      engagementId: string
      engagementName: string
      clientName: string
      clonedAt: string | null
      relationship: 'parent' | 'self' | 'child'
      summary?: Record<string, unknown>
    }

    const lineageTree: LineageNode[] = []

    // Add parent if exists
    if (parentClone?.source) {
      const source = parentClone.source as unknown as {
        id: string
        name: string
        client: { id: string; name: string } | null
      }
      lineageTree.push({
        engagementId: source.id,
        engagementName: source.name,
        clientName: source.client?.name || 'Unknown',
        clonedAt: parentClone.cloned_at,
        relationship: 'parent',
        summary: parentClone.summary as Record<string, unknown>,
      })
    }

    // Add self
    const { data: selfClient } = await supabase
      .from('engagements')
      .select('client:clients(name)')
      .eq('id', engagementId)
      .single()

    const clientData = selfClient?.client as unknown as { name: string } | null

    lineageTree.push({
      engagementId: engagement.id,
      engagementName: engagement.name,
      clientName: clientData?.name || 'Unknown',
      clonedAt: null,
      relationship: 'self',
    })

    // Add children
    if (childClones) {
      for (const child of childClones) {
        const target = child.target as unknown as {
          id: string
          name: string
          client: { id: string; name: string } | null
        } | null
        if (target) {
          lineageTree.push({
            engagementId: target.id,
            engagementName: target.name,
            clientName: target.client?.name || 'Unknown',
            clonedAt: child.cloned_at,
            relationship: 'child',
            summary: child.summary as Record<string, unknown>,
          })
        }
      }
    }

    // Get statistics
    const stats = {
      isCloned: !!parentClone,
      cloneCount: childClones?.length || 0,
      totalInLineage: lineageTree.length,
    }

    return NextResponse.json({
      success: true,
      engagementId,
      lineage: lineageTree,
      stats,
    })
  } catch (error) {
    console.error('Error getting lineage:', error)
    return NextResponse.json(
      { error: 'Failed to get lineage' },
      { status: 500 }
    )
  }
}

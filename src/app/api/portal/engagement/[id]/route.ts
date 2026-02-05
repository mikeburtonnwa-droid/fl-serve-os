/**
 * Portal Engagement API Route (F10.3, F10.4)
 *
 * GET - Get engagement summary and visible artifacts for portal
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =============================================================================
// GET - Get Portal Engagement View
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: engagementId } = await params

    // Get session from header (in production, would use cookies/JWT)
    const sessionId = request.headers.get('x-portal-session')

    // Verify session if provided (optional for now)
    if (sessionId) {
      const { data: session } = await supabase
        .from('portal_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('engagement_id', engagementId)
        .eq('is_active', true)
        .single()

      if (session) {
        // Update last activity
        await supabase
          .from('portal_sessions')
          .update({ last_activity_at: new Date().toISOString() })
          .eq('id', sessionId)

        // Log activity
        await supabase.rpc('log_portal_activity', {
          p_engagement_id: engagementId,
          p_session_id: sessionId,
          p_client_email: session.client_email,
          p_action: 'view_dashboard',
        })
      }
    }

    // Fetch engagement with consultant info
    const { data: engagement, error: engError } = await supabase
      .from('engagements')
      .select(`
        id,
        name,
        status,
        pathway,
        created_at,
        updated_at,
        client:clients(id, name),
        primary_consultant
      `)
      .eq('id', engagementId)
      .single()

    if (engError || !engagement) {
      return NextResponse.json(
        { error: 'Engagement not found' },
        { status: 404 }
      )
    }

    // Get consultant info
    const { data: consultant } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('id', engagement.primary_consultant)
      .single()

    // Fetch only client-visible artifacts
    const { data: artifacts } = await supabase
      .from('artifacts')
      .select(`
        id,
        name,
        type,
        status,
        created_at,
        updated_at,
        client_visible
      `)
      .eq('engagement_id', engagementId)
      .eq('client_visible', true)
      .order('created_at', { ascending: false })

    // Get artifact counts
    const { data: allArtifacts } = await supabase
      .from('artifacts')
      .select('id, status, client_visible')
      .eq('engagement_id', engagementId)

    const stats = {
      totalArtifacts: allArtifacts?.length || 0,
      visibleArtifacts: artifacts?.length || 0,
      completedArtifacts:
        allArtifacts?.filter(
          (a) => a.status === 'approved' || a.status === 'final'
        ).length || 0,
    }

    // Generate milestones based on engagement status
    const milestones = generateMilestones(engagement)

    const client = engagement.client as unknown as { id: string; name: string } | null

    return NextResponse.json({
      success: true,
      engagement: {
        id: engagement.id,
        name: engagement.name,
        status: engagement.status,
        pathway: engagement.pathway,
        consultant: {
          name: consultant?.full_name || 'Consultant',
          email: consultant?.email || '',
        },
        client: {
          name: client?.name || 'Client',
        },
        createdAt: engagement.created_at,
        updatedAt: engagement.updated_at,
        stats,
        milestones,
      },
      artifacts: artifacts?.map((artifact) => ({
        id: artifact.id,
        name: artifact.name,
        type: artifact.type,
        status: artifact.status,
        createdAt: artifact.created_at,
        updatedAt: artifact.updated_at,
        canDownload: true, // All visible artifacts can be downloaded
      })),
    })
  } catch (error) {
    console.error('Error fetching portal engagement:', error)
    return NextResponse.json(
      { error: 'Failed to fetch engagement' },
      { status: 500 }
    )
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

interface Engagement {
  id: string
  name: string
  status: string
  pathway?: string
  created_at: string
  updated_at: string
}

function generateMilestones(engagement: Engagement) {
  const milestones = []
  const createdDate = new Date(engagement.created_at)

  // Phase 1: Discovery
  milestones.push({
    id: 'discovery',
    title: 'Discovery Phase',
    description: 'Initial assessment and requirements gathering',
    date: createdDate.toISOString(),
    status: 'completed' as const,
    type: 'phase' as const,
  })

  // Phase 2: Planning
  const planningDate = new Date(createdDate)
  planningDate.setDate(planningDate.getDate() + 7)
  milestones.push({
    id: 'planning',
    title: 'Planning Phase',
    description: 'Solution design and implementation planning',
    date: planningDate.toISOString(),
    status:
      engagement.status === 'active'
        ? ('completed' as const)
        : ('in_progress' as const),
    type: 'phase' as const,
  })

  // Phase 3: Implementation
  const implDate = new Date(planningDate)
  implDate.setDate(implDate.getDate() + 14)
  milestones.push({
    id: 'implementation',
    title: 'Implementation Phase',
    description: 'Building and deploying the AI solution',
    date: implDate.toISOString(),
    status:
      engagement.status === 'completed'
        ? ('completed' as const)
        : ('upcoming' as const),
    type: 'phase' as const,
  })

  // Phase 4: Handoff
  const handoffDate = new Date(implDate)
  handoffDate.setDate(handoffDate.getDate() + 7)
  milestones.push({
    id: 'handoff',
    title: 'Client Handoff',
    description: 'Training and knowledge transfer',
    date: handoffDate.toISOString(),
    status:
      engagement.status === 'completed'
        ? ('completed' as const)
        : ('upcoming' as const),
    type: 'deliverable' as const,
  })

  return milestones
}

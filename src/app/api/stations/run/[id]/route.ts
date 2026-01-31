import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET a specific station run
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: run, error } = await supabase
      .from('station_runs')
      .select(`
        *,
        engagement:engagements(
          id,
          name,
          pathway,
          client:clients(id, name, industry)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !run) {
      return NextResponse.json({ error: 'Station run not found' }, { status: 404 })
    }

    return NextResponse.json({ run })
  } catch (error) {
    console.error('Error fetching station run:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH to approve/reject a station run
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, comments } = body

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "approve" or "reject"' }, { status: 400 })
    }

    // Fetch the station run
    const { data: run, error: fetchError } = await supabase
      .from('station_runs')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !run) {
      return NextResponse.json({ error: 'Station run not found' }, { status: 404 })
    }

    if (run.status !== 'awaiting_approval') {
      return NextResponse.json(
        { error: 'Station run is not awaiting approval' },
        { status: 400 }
      )
    }

    // Update station run status
    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    const { error: updateError } = await supabase
      .from('station_runs')
      .update({
        status: newStatus,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update station run' }, { status: 500 })
    }

    // Create approval record
    const { error: approvalError } = await supabase
      .from('approvals')
      .insert({
        station_run_id: id,
        decision: action === 'approve' ? 'approved' : 'rejected',
        reviewer_id: user.id,
        comments: comments || null,
      })

    if (approvalError) {
      console.error('Failed to create approval record:', approvalError)
    }

    // Log audit event
    await logAuditEvent(supabase, {
      userId: user.id,
      action: action === 'approve' ? 'approve' : 'reject',
      entityType: 'station_run',
      entityId: id,
      details: {
        stationId: run.station_id,
        engagementId: run.engagement_id,
        comments,
      },
    })

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: `Station run ${action}d successfully`,
    })
  } catch (error) {
    console.error('Error updating station run:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

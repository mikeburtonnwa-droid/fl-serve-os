import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'
import { z } from 'zod'

const engagementUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  pathway: z.enum(['knowledge_spine', 'roi_audit', 'workflow_sprint']).optional(),
  status: z.enum(['intake', 'discovery', 'active', 'review', 'complete', 'on_hold']).optional(),
  intake_score: z.number().min(0).max(21).optional(),
  start_date: z.string().optional().nullable(),
  target_end_date: z.string().optional().nullable(),
  actual_end_date: z.string().optional().nullable(),
  notes: z.string().optional(),
})

// GET /api/engagements/[id] - Get a single engagement with related data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get engagement with client info
  const { data: engagement, error } = await supabase
    .from('engagements')
    .select(`
      *,
      client:clients(id, name, industry, primary_contact_name, primary_contact_email)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Engagement not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get related artifacts
  const { data: artifacts } = await supabase
    .from('artifacts')
    .select('id, name, template_id, status, sensitivity_tier, version, updated_at')
    .eq('engagement_id', id)
    .order('updated_at', { ascending: false })

  // Get related station runs
  const { data: stationRuns } = await supabase
    .from('station_runs')
    .select('id, station_id, status, created_at, requires_approval, approved_at')
    .eq('engagement_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get related decisions
  const { data: decisions } = await supabase
    .from('decisions')
    .select('id, decision_type, description, created_at')
    .eq('engagement_id', id)
    .order('created_at', { ascending: false })

  // Get related risks
  const { data: risks } = await supabase
    .from('risks')
    .select('id, description, severity, status, updated_at')
    .eq('engagement_id', id)
    .order('updated_at', { ascending: false })

  return NextResponse.json({
    engagement,
    artifacts: artifacts || [],
    stationRuns: stationRuns || [],
    decisions: decisions || [],
    risks: risks || [],
  })
}

// PATCH /api/engagements/[id] - Update an engagement
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const validation = engagementUpdateSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const { data: engagement, error } = await supabase
    .from('engagements')
    .update(validation.data)
    .eq('id', id)
    .select(`
      *,
      client:clients(id, name)
    `)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Engagement not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log the audit event
  await logAuditEvent({
    action: 'update',
    entityType: 'engagement',
    entityId: id,
    details: { changes: Object.keys(validation.data) },
  })

  return NextResponse.json({ engagement })
}

// DELETE /api/engagements/[id] - Delete an engagement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // First get the engagement name for audit log
  const { data: existingEngagement } = await supabase
    .from('engagements')
    .select('name')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('engagements')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log the audit event
  await logAuditEvent({
    action: 'delete',
    entityType: 'engagement',
    entityId: id,
    details: { name: existingEngagement?.name },
  })

  return NextResponse.json({ success: true })
}

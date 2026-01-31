import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'
import { z } from 'zod'

const engagementSchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  name: z.string().min(1, 'Engagement name is required'),
  pathway: z.enum(['knowledge_spine', 'roi_audit', 'workflow_sprint']),
  status: z.enum(['intake', 'discovery', 'active', 'review', 'complete', 'on_hold']).default('intake'),
  intake_score: z.number().min(0).max(21).optional(),
  start_date: z.string().optional(),
  target_end_date: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/engagements - List all engagements
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status')
  const pathway = searchParams.get('pathway')
  const clientId = searchParams.get('client_id')
  const search = searchParams.get('search')

  let query = supabase
    .from('engagements')
    .select(`
      *,
      client:clients(id, name)
    `)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  if (pathway) {
    query = query.eq('pathway', pathway)
  }

  if (clientId) {
    query = query.eq('client_id', clientId)
  }

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data: engagements, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ engagements })
}

// POST /api/engagements - Create a new engagement
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const validation = engagementSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.flatten() },
      { status: 400 }
    )
  }

  // Determine pathway from intake score if not provided
  let pathway = validation.data.pathway
  if (validation.data.intake_score !== undefined && !pathway) {
    const score = validation.data.intake_score
    if (score <= 7) pathway = 'knowledge_spine'
    else if (score <= 14) pathway = 'roi_audit'
    else pathway = 'workflow_sprint'
  }

  // First, ensure user exists in public.users table (trigger may have failed)
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  // If user doesn't exist in public.users, create them
  if (!existingUser) {
    const { error: userError } = await supabase.from('users').insert({
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      role: 'consultant',
    })
    if (userError) {
      console.error('Failed to create user profile:', userError)
    }
  }

  const { data: engagement, error } = await supabase
    .from('engagements')
    .insert({
      ...validation.data,
      pathway,
      created_by: user.id,
    })
    .select(`
      *,
      client:clients(id, name)
    `)
    .single()

  if (error) {
    console.error('Engagement creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log the audit event
  await logAuditEvent({
    action: 'create',
    entityType: 'engagement',
    entityId: engagement.id,
    details: {
      name: engagement.name,
      pathway: engagement.pathway,
      client_id: engagement.client_id,
    },
  })

  return NextResponse.json({ engagement }, { status: 201 })
}

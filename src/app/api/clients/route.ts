import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'
import { z } from 'zod'

const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  industry: z.string().optional(),
  size: z.string().optional(),
  status: z.enum(['active', 'inactive', 'prospect']).default('prospect'),
  primary_contact_name: z.string().optional(),
  primary_contact_email: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional(),
})

// GET /api/clients - List all clients
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
  const search = searchParams.get('search')

  let query = supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,primary_contact_name.ilike.%${search}%`)
  }

  const { data: clients, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ clients })
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const validation = clientSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.flatten() },
      { status: 400 }
    )
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

  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      ...validation.data,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Client creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log the audit event
  await logAuditEvent({
    action: 'create',
    entityType: 'client',
    entityId: client.id,
    details: { name: client.name },
  })

  return NextResponse.json({ client }, { status: 201 })
}

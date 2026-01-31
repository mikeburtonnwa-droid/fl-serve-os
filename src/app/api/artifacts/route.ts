import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'

// GET all artifacts (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const engagementId = searchParams.get('engagementId')
    const templateId = searchParams.get('templateId')
    const status = searchParams.get('status')

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('artifacts')
      .select(`
        *,
        engagement:engagements(id, name, client:clients(id, name))
      `)
      .order('updated_at', { ascending: false })

    if (engagementId) {
      query = query.eq('engagement_id', engagementId)
    }
    if (templateId) {
      query = query.eq('template_id', templateId)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data: artifacts, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ artifacts })
  } catch (error) {
    console.error('Error fetching artifacts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create new artifact
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { engagementId, templateId, name, content, sensitivityTier } = body

    // Validate required fields
    if (!engagementId || !templateId || !name || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: engagementId, templateId, name, content' },
        { status: 400 }
      )
    }

    // Verify engagement exists
    const { data: engagement, error: engError } = await supabase
      .from('engagements')
      .select('id')
      .eq('id', engagementId)
      .single()

    if (engError || !engagement) {
      return NextResponse.json({ error: 'Engagement not found' }, { status: 404 })
    }

    // Ensure user exists in users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingUser) {
      const { error: userError } = await supabase.from('users').insert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: 'consultant',
      })
      if (userError) {
        console.error('Error creating user:', userError)
      }
    }

    // Create artifact
    const { data: artifact, error: createError } = await supabase
      .from('artifacts')
      .insert({
        engagement_id: engagementId,
        template_id: templateId,
        name,
        content,
        sensitivity_tier: sensitivityTier || 'T1',
        status: 'draft',
        version: 1,
        created_by: user.id,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating artifact:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // Log audit event
    await logAuditEvent(supabase, {
      userId: user.id,
      action: 'create',
      entityType: 'artifact',
      entityId: artifact.id,
      details: {
        templateId,
        engagementId,
        name,
        sensitivityTier,
      },
    })

    return NextResponse.json({ artifact }, { status: 201 })
  } catch (error) {
    console.error('Error creating artifact:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

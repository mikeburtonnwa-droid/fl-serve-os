import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET a specific artifact
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: artifact, error } = await supabase
      .from('artifacts')
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

    if (error || !artifact) {
      return NextResponse.json({ error: 'Artifact not found' }, { status: 404 })
    }

    return NextResponse.json({ artifact })
  } catch (error) {
    console.error('Error fetching artifact:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH update an artifact
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, content, status, sensitivityTier } = body

    // Fetch current artifact
    const { data: currentArtifact, error: fetchError } = await supabase
      .from('artifacts')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentArtifact) {
      return NextResponse.json({ error: 'Artifact not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (name) updateData.name = name
    if (content) {
      updateData.content = content
      // Increment version if content changes
      updateData.version = currentArtifact.version + 1
    }
    if (status) updateData.status = status
    if (sensitivityTier) updateData.sensitivity_tier = sensitivityTier

    // Update artifact
    const { data: artifact, error: updateError } = await supabase
      .from('artifacts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Log audit event
    await logAuditEvent(supabase, {
      userId: user.id,
      action: 'update',
      entityType: 'artifact',
      entityId: id,
      details: {
        changes: Object.keys(updateData).filter(k => k !== 'updated_at'),
        newVersion: artifact.version,
      },
    })

    return NextResponse.json({ artifact })
  } catch (error) {
    console.error('Error updating artifact:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE an artifact
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Archive instead of delete (soft delete)
    const { error: updateError } = await supabase
      .from('artifacts')
      .update({ status: 'archived' })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Log audit event
    await logAuditEvent(supabase, {
      userId: user.id,
      action: 'delete',
      entityType: 'artifact',
      entityId: id,
      details: { archived: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting artifact:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

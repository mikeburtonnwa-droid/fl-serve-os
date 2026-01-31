import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runStation, getStationInfo, type StationInput, type ArtifactContent } from '@/lib/claude'
import { logAuditEvent } from '@/lib/audit'
import { validateStationPrerequisites, TEMPLATE_METADATA, type StationId, type TemplateId } from '@/lib/workflow'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { stationId, engagementId, additionalContext } = body

    // Validate station ID
    if (!['S-01', 'S-02', 'S-03'].includes(stationId)) {
      return NextResponse.json({ error: 'Invalid station ID' }, { status: 400 })
    }

    // Fetch engagement with client data
    const { data: engagement, error: engError } = await supabase
      .from('engagements')
      .select(`
        *,
        client:clients(id, name, industry)
      `)
      .eq('id', engagementId)
      .single()

    if (engError || !engagement) {
      return NextResponse.json({ error: 'Engagement not found' }, { status: 404 })
    }

    // Fetch ALL artifacts for this engagement
    const { data: artifacts, error: artifactsError } = await supabase
      .from('artifacts')
      .select('*')
      .eq('engagement_id', engagementId)
      .neq('status', 'archived')
      .order('created_at', { ascending: true })

    if (artifactsError) {
      console.error('Error fetching artifacts:', artifactsError)
    }

    // Fetch previous approved station runs for context
    const { data: previousRuns } = await supabase
      .from('station_runs')
      .select('station_id, output_data, status, created_at')
      .eq('engagement_id', engagementId)
      .in('status', ['complete', 'approved'])
      .order('created_at', { ascending: true })

    // Validate prerequisites (gatekeeper check)
    const existingArtifacts = (artifacts || []).map(a => ({
      template_id: a.template_id,
      status: a.status,
    }))
    const completedStations = (previousRuns || []).map(r => ({
      station_id: r.station_id,
      status: r.status,
    }))

    const validation = validateStationPrerequisites(
      stationId as StationId,
      existingArtifacts,
      completedStations
    )

    if (!validation.canRun) {
      // Build helpful error message
      const missingArtifactNames = validation.missingArtifacts.map(id =>
        `${TEMPLATE_METADATA[id]?.name || id} (${id})`
      ).join(', ')

      const missingStationNames = validation.missingStations.map(id => {
        const info = getStationInfo(id)
        return `${info?.name || id} (${id})`
      }).join(', ')

      let errorMessage = 'Cannot run station. Missing prerequisites:\n'
      if (validation.missingArtifacts.length > 0) {
        errorMessage += `- Required artifacts: ${missingArtifactNames}\n`
      }
      if (validation.missingStations.length > 0) {
        errorMessage += `- Required station outputs: ${missingStationNames}\n`
      }

      return NextResponse.json({
        error: errorMessage,
        missingArtifacts: validation.missingArtifacts,
        missingStations: validation.missingStations,
        canRun: false,
      }, { status: 400 })
    }

    // Transform artifacts to the format expected by claude.ts
    const artifactContents: ArtifactContent[] = (artifacts || []).map(a => ({
      templateId: a.template_id as TemplateId,
      templateName: TEMPLATE_METADATA[a.template_id as TemplateId]?.name || a.template_id,
      content: a.content as Record<string, unknown>,
      status: a.status,
      createdAt: a.created_at,
    }))

    // Build previous station outputs
    const previousStationOutputs = (previousRuns || []).map(run => ({
      stationId: run.station_id,
      output: run.output_data?.content || '',
      createdAt: run.created_at,
    }))

    // Get station info
    const stationInfo = getStationInfo(stationId as StationId)

    // Create station run record (status: running)
    const { data: stationRun, error: createError } = await supabase
      .from('station_runs')
      .insert({
        engagement_id: engagementId,
        station_id: stationId,
        status: 'running',
        input_data: {
          clientName: engagement.client?.name,
          clientIndustry: engagement.client?.industry,
          pathway: engagement.pathway,
          intakeScore: engagement.intake_score,
          artifactCount: artifactContents.length,
          artifactTypes: artifactContents.map(a => a.templateId),
          additionalContext,
        },
        model_used: 'claude-sonnet-4-20250514',
        tokens_in: 0,
        tokens_out: 0,
        duration_ms: 0,
        requires_approval: stationInfo?.requiresApproval || false,
        created_by: user.id,
      })
      .select()
      .single()

    if (createError || !stationRun) {
      return NextResponse.json({ error: 'Failed to create station run' }, { status: 500 })
    }

    // Prepare station input with artifacts
    const stationInput: StationInput = {
      engagementId,
      clientName: engagement.client?.name || 'Unknown Client',
      clientIndustry: engagement.client?.industry,
      pathway: engagement.pathway,
      intakeScore: engagement.intake_score || 0,
      intakeDetails: engagement.intake_responses as Record<string, number> | undefined,
      artifacts: artifactContents,
      previousStationOutputs,
      additionalContext,
    }

    // Run the station
    const result = await runStation(stationId as StationId, stationInput)

    // Update station run with results
    const finalStatus = result.success
      ? stationInfo?.requiresApproval
        ? 'awaiting_approval'
        : 'complete'
      : 'failed'

    const { error: updateError } = await supabase
      .from('station_runs')
      .update({
        status: finalStatus,
        output_data: result.success ? {
          content: result.content,
          suggestedArtifacts: result.suggestedArtifacts,
        } : null,
        tokens_in: result.tokensIn,
        tokens_out: result.tokensOut,
        duration_ms: result.durationMs,
        model_used: result.model,
        error_message: result.error || null,
      })
      .eq('id', stationRun.id)

    if (updateError) {
      console.error('Failed to update station run:', updateError)
    }

    // Log audit event
    await logAuditEvent(supabase, {
      userId: user.id,
      action: 'station_run',
      entityType: 'station_run',
      entityId: stationRun.id,
      details: {
        stationId,
        engagementId,
        success: result.success,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        durationMs: result.durationMs,
        artifactsIngested: artifactContents.length,
        suggestedArtifacts: result.suggestedArtifacts?.length || 0,
      },
    })

    // Update engagement status based on progress
    if (result.success) {
      let newStatus = engagement.status
      if (stationId === 'S-01' && engagement.status === 'intake') {
        newStatus = 'discovery'
      } else if (stationId === 'S-02' && ['intake', 'discovery'].includes(engagement.status)) {
        newStatus = 'active'
      } else if (stationId === 'S-03') {
        newStatus = 'review'
      }

      if (newStatus !== engagement.status) {
        await supabase
          .from('engagements')
          .update({ status: newStatus })
          .eq('id', engagementId)
      }
    }

    return NextResponse.json({
      success: result.success,
      runId: stationRun.id,
      stationId,
      status: finalStatus,
      content: result.content,
      suggestedArtifacts: result.suggestedArtifacts,
      tokensUsed: {
        input: result.tokensIn,
        output: result.tokensOut,
      },
      durationMs: result.durationMs,
      error: result.error,
      requiresApproval: stationInfo?.requiresApproval,
      warnings: validation.warnings,
    })
  } catch (error) {
    console.error('Station run error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch station run history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const engagementId = searchParams.get('engagementId')

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('station_runs')
      .select(`
        *,
        engagement:engagements(id, name, client:clients(name))
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (engagementId) {
      query = query.eq('engagement_id', engagementId)
    }

    const { data: runs, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ runs })
  } catch (error) {
    console.error('Error fetching station runs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

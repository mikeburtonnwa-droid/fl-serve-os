import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runStation, getStationInfo, type StationInput, type ArtifactContent } from '@/lib/claude'
import { logAuditEvent } from '@/lib/audit'
import {
  validateStationPrerequisites,
  TEMPLATE_METADATA,
  STATION_REQUIREMENTS,
  ARTIFACT_SCOPES,
  type StationId,
  type TemplateId,
  type ArtifactScope
} from '@/lib/workflow'

/**
 * Station Run API
 *
 * Handles both client-level (S-01) and engagement-level (S-02, S-03) station runs.
 *
 * For S-01 (Discovery Station):
 * - Requires: clientId
 * - Optional: engagementId (for context)
 * - Creates: client-level artifacts (TPL-02)
 *
 * For S-02, S-03:
 * - Requires: engagementId
 * - Fetches: client artifacts + engagement artifacts
 * - Creates: engagement-level artifacts
 */
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
    const { stationId, clientId, engagementId, additionalContext } = body

    // Validate station ID
    if (!['S-01', 'S-02', 'S-03'].includes(stationId)) {
      return NextResponse.json({ error: 'Invalid station ID' }, { status: 400 })
    }

    const stationConfig = STATION_REQUIREMENTS[stationId as StationId]
    const stationScope = stationConfig.scope

    // Validate required IDs based on station scope
    if (stationScope === 'client' && !clientId) {
      return NextResponse.json({
        error: 'clientId is required for client-level stations (S-01)',
      }, { status: 400 })
    }
    if (stationScope === 'engagement' && !engagementId) {
      return NextResponse.json({
        error: 'engagementId is required for engagement-level stations (S-02, S-03)',
      }, { status: 400 })
    }

    // Fetch client data
    let client: { id: string; name: string; industry?: string; intake_score?: number; intake_responses?: Record<string, number> } | null = null
    let engagement: { id: string; name: string; pathway: string; status: string; intake_score?: number; intake_responses?: Record<string, number>; client_id: string } | null = null

    if (clientId) {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, industry, intake_score, intake_responses')
        .eq('id', clientId)
        .single()

      if (error || !data) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
      client = data
    }

    if (engagementId) {
      const { data, error } = await supabase
        .from('engagements')
        .select('id, name, pathway, status, intake_score, intake_responses, client_id, client:clients(id, name, industry, intake_score, intake_responses)')
        .eq('id', engagementId)
        .single()

      if (error || !data) {
        return NextResponse.json({ error: 'Engagement not found' }, { status: 404 })
      }
      engagement = data
      // If client wasn't specified, get it from engagement
      if (!client && data.client) {
        client = data.client as typeof client
      }
    }

    if (!client) {
      return NextResponse.json({ error: 'Could not determine client' }, { status: 400 })
    }

    // Fetch client-level artifacts (TPL-01, TPL-02)
    const { data: clientArtifacts } = await supabase
      .from('artifacts')
      .select('*')
      .eq('client_id', client.id)
      .eq('scope', 'client')
      .neq('status', 'archived')
      .order('created_at', { ascending: true })

    // Fetch engagement-level artifacts if we have an engagement
    let engagementArtifacts: typeof clientArtifacts = []
    if (engagementId) {
      const { data } = await supabase
        .from('artifacts')
        .select('*')
        .eq('engagement_id', engagementId)
        .eq('scope', 'engagement')
        .neq('status', 'archived')
        .order('created_at', { ascending: true })
      engagementArtifacts = data || []
    }

    // Combine artifacts for validation and processing
    const allArtifacts = [...(clientArtifacts || []), ...(engagementArtifacts || [])]

    // Fetch previous station runs (both client and engagement level)
    const previousRunsQuery = supabase
      .from('station_runs')
      .select('station_id, output_data, status, created_at, scope')
      .in('status', ['complete', 'approved'])
      .order('created_at', { ascending: true })

    // For client-level check, look at client station runs
    // For engagement-level, look at both
    const { data: clientRuns } = await supabase
      .from('station_runs')
      .select('station_id, output_data, status, created_at, scope')
      .eq('client_id', client.id)
      .eq('scope', 'client')
      .in('status', ['complete', 'approved'])

    let engagementRuns: typeof clientRuns = []
    if (engagementId) {
      const { data } = await supabase
        .from('station_runs')
        .select('station_id, output_data, status, created_at, scope')
        .eq('engagement_id', engagementId)
        .in('status', ['complete', 'approved'])
      engagementRuns = data || []
    }

    const allRuns = [...(clientRuns || []), ...(engagementRuns || [])]

    // Validate prerequisites
    const existingArtifacts = allArtifacts.map(a => ({
      template_id: a.template_id,
      status: a.status,
      scope: a.scope as ArtifactScope,
    }))
    const completedStations = allRuns.map(r => ({
      station_id: r.station_id,
      status: r.status,
      scope: r.scope as ArtifactScope,
    }))

    const validation = validateStationPrerequisites(
      stationId as StationId,
      existingArtifacts,
      completedStations
    )

    if (!validation.canRun) {
      const missingArtifactNames = validation.missingArtifacts.map(id => {
        const meta = TEMPLATE_METADATA[id]
        const scope = ARTIFACT_SCOPES[id]
        return `${meta?.name || id} (${id}) [${scope}-level]`
      }).join(', ')

      const missingStationNames = validation.missingStations.map(id => {
        const info = getStationInfo(id)
        const scope = STATION_REQUIREMENTS[id].scope
        return `${info?.name || id} (${id}) [${scope}-level]`
      }).join(', ')

      let errorMessage = 'Cannot run station. Missing prerequisites:\n'
      if (validation.missingArtifacts.length > 0) {
        errorMessage += `- Required artifacts: ${missingArtifactNames}\n`
      }
      if (validation.missingStations.length > 0) {
        errorMessage += `- Required station outputs: ${missingStationNames}\n`
      }
      if (validation.warnings.length > 0) {
        errorMessage += `\nNotes:\n${validation.warnings.map(w => `- ${w}`).join('\n')}`
      }

      return NextResponse.json({
        error: errorMessage,
        missingArtifacts: validation.missingArtifacts,
        missingStations: validation.missingStations,
        canRun: false,
      }, { status: 400 })
    }

    // Transform artifacts to the format expected by claude.ts
    const artifactContents: ArtifactContent[] = allArtifacts.map(a => ({
      templateId: a.template_id as TemplateId,
      templateName: TEMPLATE_METADATA[a.template_id as TemplateId]?.name || a.template_id,
      content: a.content as Record<string, unknown>,
      status: a.status,
      createdAt: a.created_at,
    }))

    // Build previous station outputs
    const previousStationOutputs = allRuns.map(run => ({
      stationId: run.station_id,
      output: run.output_data?.content || '',
      createdAt: run.created_at,
    }))

    // Get station info
    const stationInfo = getStationInfo(stationId as StationId)

    // Create station run record
    // For client-level stations: store with client_id, scope='client'
    // For engagement-level stations: store with engagement_id, scope='engagement'
    const stationRunData: Record<string, unknown> = {
      station_id: stationId,
      status: 'running',
      scope: stationScope,
      input_data: {
        clientId: client.id,
        clientName: client.name,
        clientIndustry: client.industry,
        engagementId: engagement?.id,
        pathway: engagement?.pathway,
        intakeScore: client.intake_score || engagement?.intake_score,
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
    }

    // Set the appropriate foreign key based on scope
    if (stationScope === 'client') {
      stationRunData.client_id = client.id
      stationRunData.engagement_id = null
    } else {
      stationRunData.engagement_id = engagementId
      stationRunData.client_id = client.id  // Also store client_id for reference
    }

    const { data: stationRun, error: createError } = await supabase
      .from('station_runs')
      .insert(stationRunData)
      .select()
      .single()

    if (createError || !stationRun) {
      console.error('Failed to create station run:', createError)
      return NextResponse.json({ error: 'Failed to create station run' }, { status: 500 })
    }

    // Prepare station input
    const stationInput: StationInput = {
      engagementId: engagement?.id || '',
      clientName: client.name,
      clientIndustry: client.industry,
      pathway: engagement?.pathway || 'roi_audit',
      intakeScore: client.intake_score || engagement?.intake_score || 0,
      intakeDetails: (client.intake_responses || engagement?.intake_responses) as Record<string, number> | undefined,
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

    // Mark suggested artifacts with their scope
    const suggestedArtifactsWithScope = result.suggestedArtifacts?.map(sa => ({
      ...sa,
      scope: ARTIFACT_SCOPES[sa.templateId],
    }))

    const { error: updateError } = await supabase
      .from('station_runs')
      .update({
        status: finalStatus,
        output_data: result.success ? {
          content: result.content,
          suggestedArtifacts: suggestedArtifactsWithScope,
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
        scope: stationScope,
        clientId: client.id,
        engagementId: engagement?.id,
        success: result.success,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        durationMs: result.durationMs,
        artifactsIngested: artifactContents.length,
        suggestedArtifacts: result.suggestedArtifacts?.length || 0,
      },
    })

    // Update engagement status if applicable
    if (result.success && engagement) {
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
      scope: stationScope,
      status: finalStatus,
      content: result.content,
      suggestedArtifacts: suggestedArtifactsWithScope,
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
    const clientId = searchParams.get('clientId')
    const engagementId = searchParams.get('engagementId')

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('station_runs')
      .select(`
        *,
        client:clients(id, name),
        engagement:engagements(id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (clientId) {
      query = query.eq('client_id', clientId)
    }
    if (engagementId) {
      // For engagement, get both engagement-level runs AND client-level runs for context
      query = query.or(`engagement_id.eq.${engagementId},and(client_id.eq.${engagementId},scope.eq.client)`)
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

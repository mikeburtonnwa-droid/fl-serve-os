'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { useToast } from '@/components/ui/toast'
import { WorkflowRequirements } from '@/components/engagements/workflow-requirements'
import { ArtifactSuggestions } from '@/components/engagements/artifact-suggestions'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import {
  ArrowLeft,
  Building2,
  Calendar,
  FileText,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Play,
  Loader2,
  ChevronRight,
  Sparkles,
  Target,
  Zap,
  BookOpen,
  TrendingUp,
  Search,
  Lock,
  AlertCircle,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  STATION_REQUIREMENTS,
  TEMPLATE_METADATA,
  PATHWAY_WORKFLOWS,
  validateStationPrerequisites,
  getCurrentStage,
  type StationId,
  type TemplateId,
  type Pathway,
} from '@/lib/workflow'

interface Engagement {
  id: string
  name: string
  pathway: string
  status: string
  intake_score: number | null
  intake_responses: Record<string, number> | null
  start_date: string | null
  target_end_date: string | null
  notes: string | null
  created_at: string
  client: {
    id: string
    name: string
    industry: string | null
    primary_contact_name: string | null
    primary_contact_email: string | null
  }
}

interface StationRun {
  id: string
  station_id: string
  status: string
  output_data: {
    content: string
    suggestedArtifacts?: Array<{
      templateId: TemplateId
      suggestedContent: Record<string, unknown>
      action: 'create' | 'update'
    }>
  } | null
  created_at: string
  requires_approval: boolean
  tokens_in: number
  tokens_out: number
  duration_ms: number
  error_message?: string
}

interface Artifact {
  id: string
  name: string
  template_id: string
  status: string
  sensitivity_tier: string
  version: number
  updated_at: string
}

const pathwayLabels: Record<string, string> = {
  knowledge_spine: 'Knowledge Spine',
  roi_audit: 'ROI Audit',
  workflow_sprint: 'Workflow Sprint',
}

const pathwayIcons: Record<string, typeof BookOpen> = {
  knowledge_spine: BookOpen,
  roi_audit: TrendingUp,
  workflow_sprint: Zap,
}

const pathwayDescriptions: Record<string, string> = {
  knowledge_spine: 'Focus on building foundational AI knowledge and documentation frameworks.',
  roi_audit: 'Analyze current processes and identify high-value automation opportunities.',
  workflow_sprint: 'Rapid implementation of AI-powered workflow improvements.',
}

const statusColors: Record<string, 'default' | 'info' | 'success' | 'warning'> = {
  intake: 'info',
  discovery: 'info',
  active: 'success',
  review: 'warning',
  complete: 'default',
  on_hold: 'default',
}

export default function EngagementDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addToast } = useToast()
  const [engagement, setEngagement] = useState<Engagement | null>(null)
  const [stationRuns, setStationRuns] = useState<StationRun[]>([])
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [loading, setLoading] = useState(true)
  const [runningStation, setRunningStation] = useState<string | null>(null)
  const [selectedStationRun, setSelectedStationRun] = useState<StationRun | null>(null)
  const [showOutput, setShowOutput] = useState(false)
  const [gateError, setGateError] = useState<{
    message: string
    missingArtifacts: TemplateId[]
    missingStations: StationId[]
  } | null>(null)

  // Ref to prevent duplicate station runs (synchronous check before async state update)
  const runningStationsRef = useRef<Set<string>>(new Set())

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchData = async () => {
    const id = params.id as string

    // Fetch engagement with client
    const { data: engagementData, error: engError } = await supabase
      .from('engagements')
      .select(`
        *,
        client:clients(id, name, industry, primary_contact_name, primary_contact_email)
      `)
      .eq('id', id)
      .single()

    if (engError || !engagementData) {
      router.push('/dashboard/engagements')
      return
    }

    setEngagement(engagementData)

    // Fetch station runs
    const { data: runsData } = await supabase
      .from('station_runs')
      .select('*')
      .eq('engagement_id', id)
      .order('created_at', { ascending: false })

    setStationRuns(runsData || [])

    // Fetch artifacts
    const { data: artifactsData } = await supabase
      .from('artifacts')
      .select('*')
      .eq('engagement_id', id)
      .neq('status', 'archived')
      .order('updated_at', { ascending: false })

    setArtifacts(artifactsData || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [params.id])

  // Calculate workflow stage
  const stageInfo = useMemo(() => {
    if (!engagement) return null
    const existingArtifacts = artifacts.map((a) => ({
      template_id: a.template_id,
      status: a.status,
    }))
    return getCurrentStage(engagement.pathway as Pathway, existingArtifacts)
  }, [engagement, artifacts])

  // Validate stations
  const stationValidations = useMemo(() => {
    const existingArtifacts = artifacts.map((a) => ({
      template_id: a.template_id,
      status: a.status,
    }))
    const completedStations = stationRuns
      .filter((r) => ['complete', 'approved'].includes(r.status))
      .map((r) => ({
        station_id: r.station_id,
        status: r.status,
      }))

    return (['S-01', 'S-02', 'S-03'] as StationId[]).map((stationId) => ({
      stationId,
      validation: validateStationPrerequisites(stationId, existingArtifacts, completedStations),
    }))
  }, [artifacts, stationRuns])

  // Find the LATEST station run per station that has uncreated artifact suggestions
  // Only show the most recent run's suggestions to avoid confusion from duplicate runs
  const pendingArtifactSuggestions = useMemo(() => {
    const existingTemplateIds = new Set(artifacts.map(a => a.template_id))

    // Group runs by station_id and get only the latest successful run for each
    const latestRunsByStation = new Map<string, StationRun>()
    for (const run of stationRuns) {
      if (!['complete', 'approved'].includes(run.status)) continue
      if (!run.output_data?.suggestedArtifacts?.length) continue

      const existing = latestRunsByStation.get(run.station_id)
      if (!existing || new Date(run.created_at) > new Date(existing.created_at)) {
        latestRunsByStation.set(run.station_id, run)
      }
    }

    return Array.from(latestRunsByStation.values())
      .map(run => {
        const uncreated = (run.output_data?.suggestedArtifacts || []).filter(
          suggestion => !existingTemplateIds.has(suggestion.templateId)
        )
        return { run, uncreatedCount: uncreated.length }
      })
      .filter(item => item.uncreatedCount > 0)
  }, [artifacts, stationRuns])

  const runStation = async (stationId: StationId) => {
    if (!engagement) return

    // Synchronous check to prevent duplicate runs (before async state update)
    if (runningStationsRef.current.has(stationId)) {
      return
    }

    // Check validation first
    const validation = stationValidations.find((v) => v.stationId === stationId)
    if (validation && !validation.validation.canRun) {
      setGateError({
        message: `Cannot run ${stationId} - missing prerequisites`,
        missingArtifacts: validation.validation.missingArtifacts,
        missingStations: validation.validation.missingStations,
      })
      return
    }

    // Mark as running immediately (synchronous) to prevent duplicate clicks
    runningStationsRef.current.add(stationId)
    setRunningStation(stationId)
    setGateError(null)

    // Immediate visual feedback
    addToast({
      type: 'info',
      title: 'Starting Station',
      message: `Running ${stationId}...`,
    })

    try {
      const response = await fetch('/api/stations/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId,
          engagementId: engagement.id,
        }),
      })

      const result = await response.json()

      if (result.success) {
        addToast({
          type: 'success',
          title: `${stationId} Complete`,
          message: result.requiresApproval
            ? 'Output is awaiting approval'
            : 'Station run completed successfully',
        })

        // Refresh data
        await fetchData()

        // Show the output with suggested artifacts
        const newRun: StationRun = {
          id: result.runId,
          station_id: stationId,
          status: result.status,
          output_data: {
            content: result.content,
            suggestedArtifacts: result.suggestedArtifacts,
          },
          created_at: new Date().toISOString(),
          requires_approval: result.requiresApproval,
          tokens_in: result.tokensUsed.input,
          tokens_out: result.tokensUsed.output,
          duration_ms: result.durationMs,
        }
        setSelectedStationRun(newRun)
        setShowOutput(true)
      } else {
        // Handle gatekeeper error
        if (result.canRun === false) {
          setGateError({
            message: result.error,
            missingArtifacts: result.missingArtifacts || [],
            missingStations: result.missingStations || [],
          })
        } else {
          addToast({
            type: 'error',
            title: 'Station Failed',
            message: result.error || 'An error occurred',
          })
        }
      }
    } catch (error) {
      console.error('Station run error:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to run station. Please try again.',
      })
    } finally {
      runningStationsRef.current.delete(stationId)
      setRunningStation(null)
    }
  }

  const getStationStatus = (stationId: string) => {
    const runs = stationRuns.filter((r) => r.station_id === stationId)
    if (runs.length === 0) return 'not_run'
    const latestRun = runs[0]
    return latestRun.status
  }

  const approveStation = async (runId: string) => {
    const { error } = await supabase
      .from('station_runs')
      .update({ status: 'approved' })
      .eq('id', runId)

    if (!error) {
      addToast({
        type: 'success',
        title: 'Approved',
        message: 'Station output has been approved',
      })
      await fetchData()
      setShowOutput(false)
    }
  }

  const rejectStation = async (runId: string) => {
    const { error } = await supabase
      .from('station_runs')
      .update({ status: 'rejected' })
      .eq('id', runId)

    if (!error) {
      addToast({
        type: 'warning',
        title: 'Rejected',
        message: 'Station output has been rejected',
      })
      await fetchData()
      setShowOutput(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (!engagement) {
    return null
  }

  const PathwayIcon = pathwayIcons[engagement.pathway] || Target

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Engagements', href: '/dashboard/engagements' },
          { label: engagement.name },
        ]}
      />

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/engagements">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">{engagement.name}</h1>
              <Badge variant={statusColors[engagement.status] || 'default'}>
                {engagement.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Building2 className="h-4 w-4 text-slate-400" />
              <Link
                href={`/dashboard/clients/${engagement.client?.id}`}
                className="text-slate-500 hover:text-teal-600"
              >
                {engagement.client?.name}
              </Link>
              <span className="text-slate-300">|</span>
              <PathwayIcon className="h-4 w-4 text-teal-600" />
              <span className="text-sm font-medium text-teal-600">
                {pathwayLabels[engagement.pathway]}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-sm text-slate-500">
                Score: {engagement.intake_score}/21
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Artifact Suggestions Alert */}
      {pendingArtifactSuggestions.length > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-purple-900">
                  AI-Generated Artifacts Available
                </h4>
                <p className="text-sm text-purple-700 mt-1">
                  {pendingArtifactSuggestions.reduce((sum, item) => sum + item.uncreatedCount, 0)} artifact
                  {pendingArtifactSuggestions.reduce((sum, item) => sum + item.uncreatedCount, 0) !== 1 ? 's' : ''} suggested
                  from station runs. Click below to review and create them.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {pendingArtifactSuggestions.map(({ run, uncreatedCount }) => (
                    <Button
                      key={run.id}
                      variant="outline"
                      size="sm"
                      className="border-purple-300 text-purple-700 hover:bg-purple-100"
                      onClick={() => {
                        setSelectedStationRun(run)
                        setShowOutput(true)
                      }}
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {run.station_id}: {uncreatedCount} artifact{uncreatedCount !== 1 ? 's' : ''}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gatekeeper Error */}
      {gateError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-red-900">Prerequisites Not Met</h4>
                <p className="text-sm text-red-700 mt-1 whitespace-pre-line">{gateError.message}</p>

                {gateError.missingArtifacts.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-red-800 mb-2">Missing Artifacts:</p>
                    <div className="flex flex-wrap gap-2">
                      {gateError.missingArtifacts.map((templateId) => {
                        const meta = TEMPLATE_METADATA[templateId]
                        return (
                          <Link
                            key={templateId}
                            href={`/dashboard/artifacts/new?engagement=${engagement.id}&template=${templateId}`}
                          >
                            <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                              <FileText className="h-3 w-3 mr-1" />
                              Create {meta.name}
                            </Button>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {gateError.missingStations.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-red-800 mb-2">Required Stations:</p>
                    <div className="flex flex-wrap gap-2">
                      {gateError.missingStations.map((stationId) => {
                        const req = STATION_REQUIREMENTS[stationId]
                        return (
                          <Badge key={stationId} variant="destructive">
                            {stationId}: {req.name} (needs approval)
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-3 text-red-600"
                  onClick={() => setGateError(null)}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Dismiss
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Station Output Modal */}
      {showOutput && selectedStationRun && (
        <div className="space-y-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-blue-600" />
                  <CardTitle>{selectedStationRun.station_id} Output</CardTitle>
                  <Badge
                    variant={
                      selectedStationRun.status === 'complete'
                        ? 'success'
                        : selectedStationRun.status === 'awaiting_approval'
                        ? 'warning'
                        : selectedStationRun.status === 'failed'
                        ? 'destructive'
                        : 'default'
                    }
                  >
                    {selectedStationRun.status.replace('_', ' ')}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowOutput(false)}>
                  Close
                </Button>
              </div>
              <CardDescription>
                {selectedStationRun.tokens_in + selectedStationRun.tokens_out} tokens |{' '}
                {(selectedStationRun.duration_ms / 1000).toFixed(1)}s
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-lg p-4 max-h-96 overflow-y-auto">
                <MarkdownRenderer
                  content={selectedStationRun.output_data?.content || selectedStationRun.error_message}
                  collapsibleJson={true}
                  enableCopy={true}
                />
              </div>
              {selectedStationRun.requires_approval && selectedStationRun.status === 'awaiting_approval' && (
                <div className="mt-4 flex gap-2">
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => approveStation(selectedStationRun.id)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => rejectStation(selectedStationRun.id)}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Suggested Artifacts from Station Output */}
          {selectedStationRun.output_data?.suggestedArtifacts &&
            selectedStationRun.output_data.suggestedArtifacts.length > 0 && (
              <ArtifactSuggestions
                engagementId={engagement.id}
                stationId={selectedStationRun.station_id}
                suggestions={selectedStationRun.output_data.suggestedArtifacts}
                onArtifactCreated={fetchData}
              />
            )}
        </div>
      )}

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-100">
                <FileText className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{artifacts.length}</p>
                <p className="text-sm text-slate-500">Artifacts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Cpu className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{stationRuns.length}</p>
                <p className="text-sm text-slate-500">Station Runs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {stationRuns.filter((r) => r.status === 'awaiting_approval').length}
                </p>
                <p className="text-sm text-slate-500">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {stageInfo ? `${stageInfo.currentStage}/${PATHWAY_WORKFLOWS[engagement.pathway as Pathway]?.length || 5}` : '-'}
                </p>
                <p className="text-sm text-slate-500">Stage</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workflow Requirements - Shows artifact prerequisites */}
          <WorkflowRequirements
            pathway={engagement.pathway as Pathway}
            engagementId={engagement.id}
            artifacts={artifacts}
            stationRuns={stationRuns.filter((r) => ['complete', 'approved'].includes(r.status))}
            onStationSelect={(stationId) => runStation(stationId)}
          />

          {/* AI Stations - Quick run access */}
          <Card>
            <CardHeader>
              <CardTitle>AI Stations</CardTitle>
              <CardDescription>Run AI-powered analysis for this engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(['S-01', 'S-02', 'S-03'] as StationId[]).map((stationId) => {
                  const status = getStationStatus(stationId)
                  const latestRun = stationRuns.find((r) => r.station_id === stationId)
                  const req = STATION_REQUIREMENTS[stationId]
                  const validation = stationValidations.find((v) => v.stationId === stationId)
                  const canRun = validation?.validation.canRun ?? false

                  return (
                    <div
                      key={stationId}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        canRun
                          ? 'bg-teal-50 border-teal-200'
                          : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${canRun ? 'bg-teal-100' : 'bg-slate-200'}`}>
                          {canRun ? (
                            <Cpu className="h-4 w-4 text-teal-600" />
                          ) : (
                            <Lock className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-teal-600">{stationId}</span>
                            <span className="font-medium text-slate-900">{req.name}</span>
                          </div>
                          <p className="text-xs text-slate-500">{req.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              req.outputArtifacts.some((t) => TEMPLATE_METADATA[t].tier === 'T2')
                                ? 'warning'
                                : 'default'
                            }
                            size="sm"
                          >
                            {req.outputArtifacts.some((t) => TEMPLATE_METADATA[t].tier === 'T2') ? 'T2' : 'T1'}
                          </Badge>
                          {status !== 'not_run' && (
                            <Badge
                              variant={
                                ['complete', 'approved'].includes(status)
                                  ? 'success'
                                  : status === 'awaiting_approval'
                                  ? 'warning'
                                  : status === 'failed'
                                  ? 'destructive'
                                  : 'default'
                              }
                              size="sm"
                            >
                              {status.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {latestRun?.output_data && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedStationRun(latestRun)
                                setShowOutput(true)
                              }}
                            >
                              <Search className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => runStation(stationId)}
                            disabled={runningStation !== null || !canRun}
                            title={!canRun ? 'Missing prerequisites' : undefined}
                          >
                            {runningStation === stationId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Play className="h-3 w-3 mr-1" />
                                Run
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Station Runs */}
          <Card>
            <CardHeader>
              <CardTitle>Station Run History</CardTitle>
              <CardDescription>All AI station executions for this engagement</CardDescription>
            </CardHeader>
            <CardContent>
              {stationRuns.length > 0 ? (
                <div className="space-y-3">
                  {stationRuns.map((run) => (
                    <div
                      key={run.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100"
                      onClick={() => {
                        setSelectedStationRun(run)
                        setShowOutput(true)
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Cpu className="h-4 w-4 text-slate-400" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">{run.station_id}</span>
                            <Badge
                              variant={
                                ['complete', 'approved'].includes(run.status)
                                  ? 'success'
                                  : run.status === 'awaiting_approval'
                                  ? 'warning'
                                  : run.status === 'failed'
                                  ? 'destructive'
                                  : 'default'
                              }
                              size="sm"
                            >
                              {run.status.replace('_', ' ')}
                            </Badge>
                            {run.output_data?.suggestedArtifacts &&
                              run.output_data.suggestedArtifacts.length > 0 && (
                                <Badge variant="info" size="sm">
                                  {run.output_data.suggestedArtifacts.length} suggestions
                                </Badge>
                              )}
                          </div>
                          <p className="text-xs text-slate-500">
                            {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })} |{' '}
                            {run.tokens_in + run.tokens_out} tokens | {(run.duration_ms / 1000).toFixed(1)}s
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Cpu className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No station runs yet</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Create required artifacts, then run your first station
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Artifacts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Artifacts</CardTitle>
                <Link href={`/dashboard/artifacts/new?engagement=${engagement.id}`}>
                  <Button size="sm">
                    <FileText className="h-3 w-3 mr-1" />
                    New Artifact
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {artifacts.length > 0 ? (
                <div className="space-y-3">
                  {artifacts.map((artifact) => {
                    const meta = TEMPLATE_METADATA[artifact.template_id as TemplateId]
                    return (
                      <Link
                        key={artifact.id}
                        href={`/dashboard/artifacts/${artifact.id}`}
                        className="block"
                      >
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-slate-400" />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-slate-900">{artifact.name}</p>
                                <Badge variant="default" size="sm">
                                  {artifact.template_id}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-500">
                                {meta?.name || artifact.template_id} • {meta?.stage || 'Unknown'} stage
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                artifact.status === 'approved'
                                  ? 'success'
                                  : artifact.status === 'pending_review'
                                  ? 'warning'
                                  : 'default'
                              }
                              size="sm"
                            >
                              {artifact.status}
                            </Badge>
                            <Badge
                              variant={artifact.sensitivity_tier === 'T2' ? 'warning' : 'default'}
                              size="sm"
                            >
                              {artifact.sensitivity_tier}
                            </Badge>
                            <span className="text-xs text-slate-500">v{artifact.version}</span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No artifacts created yet</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Start by creating a Client Discovery Brief (TPL-01)
                  </p>
                  <Link
                    href={`/dashboard/artifacts/new?engagement=${engagement.id}&template=TPL-01`}
                    className="inline-block mt-3"
                  >
                    <Button size="sm">
                      <FileText className="h-3 w-3 mr-1" />
                      Create Discovery Brief
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client info */}
          <Card>
            <CardHeader>
              <CardTitle>Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{engagement.client?.name}</p>
                  {engagement.client?.industry && (
                    <p className="text-xs text-slate-500">{engagement.client.industry}</p>
                  )}
                </div>
                {engagement.client?.primary_contact_name && (
                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">Primary Contact</p>
                    <p className="text-sm text-slate-900">{engagement.client.primary_contact_name}</p>
                    {engagement.client.primary_contact_email && (
                      <a
                        href={`mailto:${engagement.client.primary_contact_email}`}
                        className="text-xs text-teal-600 hover:underline"
                      >
                        {engagement.client.primary_contact_email}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Engagement Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-slate-500">Intake Score</dt>
                  <dd className="text-sm font-medium text-slate-900">
                    {engagement.intake_score !== null ? `${engagement.intake_score}/21` : 'Not assessed'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Pathway</dt>
                  <dd className="text-sm font-medium text-slate-900">
                    {pathwayLabels[engagement.pathway]}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Current Stage</dt>
                  <dd className="text-sm font-medium text-slate-900">
                    {stageInfo?.stageName || 'Intake'}
                  </dd>
                </div>
                {engagement.start_date && (
                  <div>
                    <dt className="text-xs text-slate-500">Start Date</dt>
                    <dd className="text-sm font-medium text-slate-900">
                      {new Date(engagement.start_date).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                {engagement.target_end_date && (
                  <div>
                    <dt className="text-xs text-slate-500">Target End</dt>
                    <dd className="text-sm font-medium text-slate-900">
                      {new Date(engagement.target_end_date).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </dl>
              {engagement.notes && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <dt className="text-xs text-slate-500 mb-1">Notes</dt>
                  <dd className="text-sm text-slate-700">{engagement.notes}</dd>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workflow Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {stageInfo && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-600">Stage {stageInfo.currentStage}</span>
                      <span className="font-medium text-slate-900">{stageInfo.stageName}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-teal-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${(stageInfo.currentStage / (PATHWAY_WORKFLOWS[engagement.pathway as Pathway]?.length || 5)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500 uppercase">Completed Templates</p>
                    <div className="flex flex-wrap gap-1">
                      {stageInfo.completedArtifacts.map((templateId) => (
                        <Badge key={templateId} variant="success" size="sm">
                          {templateId}
                        </Badge>
                      ))}
                      {stageInfo.completedArtifacts.length === 0 && (
                        <span className="text-xs text-slate-400">None yet</span>
                      )}
                    </div>
                  </div>

                  {stageInfo.nextArtifacts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-500 uppercase">Next Up</p>
                      <div className="flex flex-wrap gap-1">
                        {stageInfo.nextArtifacts.map((templateId) => (
                          <Badge key={templateId} variant="default" size="sm">
                            {templateId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-full bg-teal-100">
                    <Calendar className="h-3 w-3 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Created</p>
                    <p className="text-sm text-slate-900">
                      {new Date(engagement.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {engagement.start_date && (
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-full bg-blue-100">
                      <Play className="h-3 w-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Started</p>
                      <p className="text-sm text-slate-900">
                        {new Date(engagement.start_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
                {engagement.target_end_date && (
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-full bg-amber-100">
                      <Clock className="h-3 w-3 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Target End</p>
                      <p className="text-sm text-slate-900">
                        {new Date(engagement.target_end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

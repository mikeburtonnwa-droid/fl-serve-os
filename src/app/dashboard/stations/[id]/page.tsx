'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Cpu,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Building2,
  Calendar,
  Zap,
  Copy,
  Check,
  MessageSquare,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface StationRun {
  id: string
  station_id: string
  status: string
  input_data: Record<string, unknown>
  output_data: { content: string } | null
  tokens_in: number
  tokens_out: number
  duration_ms: number
  model_used: string
  error_message: string | null
  requires_approval: boolean
  approved_by: string | null
  approved_at: string | null
  created_at: string
  engagement: {
    id: string
    name: string
    pathway: string
    client: { id: string; name: string; industry: string }
  }
}

interface Approval {
  id: string
  decision: string
  comments: string | null
  created_at: string
  reviewer: { full_name: string; email: string }
}

const stationNames: Record<string, string> = {
  'S-01': 'Discovery Station',
  'S-02': 'Scoping Station',
  'S-03': 'QA Station',
}

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  complete: { icon: CheckCircle2, color: 'text-green-600', label: 'Complete' },
  approved: { icon: CheckCircle2, color: 'text-green-600', label: 'Approved' },
  awaiting_approval: { icon: AlertCircle, color: 'text-amber-600', label: 'Awaiting Approval' },
  rejected: { icon: XCircle, color: 'text-red-600', label: 'Rejected' },
  failed: { icon: XCircle, color: 'text-red-600', label: 'Failed' },
  running: { icon: Clock, color: 'text-blue-600', label: 'Running' },
}

export default function StationRunDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [run, setRun] = useState<StationRun | null>(null)
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [comment, setComment] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchData = async () => {
    const id = params.id as string

    // Fetch station run
    const { data: runData, error: runError } = await supabase
      .from('station_runs')
      .select(`
        *,
        engagement:engagements(id, name, pathway, client:clients(id, name, industry))
      `)
      .eq('id', id)
      .single()

    if (runError || !runData) {
      router.push('/dashboard/stations')
      return
    }

    setRun(runData)

    // Fetch approvals
    const { data: approvalData } = await supabase
      .from('approvals')
      .select(`
        *,
        reviewer:users!approvals_reviewer_id_fkey(full_name, email)
      `)
      .eq('station_run_id', id)
      .order('created_at', { ascending: false })

    setApprovals(approvalData || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [params.id])

  const handleApproval = async (action: 'approve' | 'reject') => {
    if (!run) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/stations/run/${run.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comments: comment }),
      })

      if (response.ok) {
        await fetchData()
        setComment('')
      }
    } catch (error) {
      console.error('Approval action failed:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (run?.output_data?.content) {
      navigator.clipboard.writeText(run.output_data.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (!run) return null

  const status = statusConfig[run.status] || statusConfig.running
  const StatusIcon = status.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/stations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <Cpu className="h-6 w-6 text-teal-600" />
              <h1 className="text-2xl font-semibold text-slate-900">
                {run.station_id}: {stationNames[run.station_id]}
              </h1>
              <Badge
                variant={
                  run.status === 'approved' || run.status === 'complete'
                    ? 'success'
                    : run.status === 'awaiting_approval'
                    ? 'warning'
                    : run.status === 'failed' || run.status === 'rejected'
                    ? 'destructive'
                    : 'default'
                }
              >
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1 text-slate-500">
              <Building2 className="h-4 w-4" />
              <Link
                href={`/dashboard/engagements/${run.engagement?.id}`}
                className="hover:text-teal-600"
              >
                {run.engagement?.name}
              </Link>
              <span>•</span>
              <span>{run.engagement?.client?.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {run.tokens_in + run.tokens_out}
                </p>
                <p className="text-sm text-slate-500">Total Tokens</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-100">
                <Clock className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {(run.duration_ms / 1000).toFixed(1)}s
                </p>
                <p className="text-sm text-slate-500">Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Cpu className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 truncate">{run.model_used}</p>
                <p className="text-sm text-slate-500">Model</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {format(new Date(run.created_at), 'MMM d, yyyy')}
                </p>
                <p className="text-sm text-slate-500">
                  {format(new Date(run.created_at), 'h:mm a')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Output Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Station Output</CardTitle>
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {run.output_data?.content ? (
                <div className="bg-slate-50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono">
                    {run.output_data.content}
                  </pre>
                </div>
              ) : run.error_message ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800">Station Run Failed</p>
                      <p className="text-sm text-red-700 mt-1">{run.error_message}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">No output available</p>
              )}
            </CardContent>
          </Card>

          {/* Approval Action */}
          {run.status === 'awaiting_approval' && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-amber-800">Approval Required</CardTitle>
                <CardDescription className="text-amber-700">
                  This T2 output requires approval before it can be shared with the client.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Comments (optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add any comments about this approval decision..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleApproval('approve')}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleApproval('reject')}
                    disabled={actionLoading}
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Input Context */}
          <Card>
            <CardHeader>
              <CardTitle>Input Context</CardTitle>
            </CardHeader>
            <CardContent>
              {run.input_data ? (
                <dl className="space-y-3 text-sm">
                  {Object.entries(run.input_data).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}</dt>
                      <dd className="text-slate-900 font-medium">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-slate-500">No input data available</p>
              )}
            </CardContent>
          </Card>

          {/* Approval History */}
          <Card>
            <CardHeader>
              <CardTitle>Approval History</CardTitle>
            </CardHeader>
            <CardContent>
              {approvals.length > 0 ? (
                <div className="space-y-4">
                  {approvals.map((approval) => (
                    <div key={approval.id} className="border-l-2 border-slate-200 pl-4">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={approval.decision === 'approved' ? 'success' : 'destructive'}
                          size="sm"
                        >
                          {approval.decision}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {format(new Date(approval.created_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-900 mt-1">
                        {approval.reviewer?.full_name || approval.reviewer?.email}
                      </p>
                      {approval.comments && (
                        <p className="text-sm text-slate-600 mt-1 flex items-start gap-1">
                          <MessageSquare className="h-3 w-3 mt-0.5" />
                          {approval.comments}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No approval history</p>
              )}
            </CardContent>
          </Card>

          {/* Engagement Link */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/dashboard/engagements/${run.engagement?.id}`}
                className="block p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <p className="font-medium text-slate-900">{run.engagement?.name}</p>
                <p className="text-sm text-slate-500">{run.engagement?.client?.name}</p>
                <p className="text-xs text-teal-600 mt-1 capitalize">
                  {run.engagement?.pathway?.replace('_', ' ')}
                </p>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

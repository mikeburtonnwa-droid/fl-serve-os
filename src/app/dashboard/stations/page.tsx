'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Cpu,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
  ChevronRight,
  Filter,
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface StationRun {
  id: string
  station_id: string
  status: string
  tokens_in: number
  tokens_out: number
  duration_ms: number
  created_at: string
  requires_approval: boolean
  output_data: { content: string } | null
  engagement: {
    id: string
    name: string
    client: { id: string; name: string }
  }
}

// SERVE OS Lite stations configuration
const stations = [
  {
    id: 'S-01',
    name: 'Discovery Station',
    description: 'Analyzes client intake data, identifies AI readiness gaps, and generates preliminary recommendations',
    sensitivity: 'T1',
    requiresApproval: false,
  },
  {
    id: 'S-02',
    name: 'Scoping Station',
    description: 'Calculates effort estimates, generates SOW components, and drafts project timelines',
    sensitivity: 'T2',
    requiresApproval: true,
  },
  {
    id: 'S-03',
    name: 'QA Station',
    description: 'Reviews all T2 outputs before client delivery, checks for accuracy, completeness, and brand alignment',
    sensitivity: 'T2',
    requiresApproval: true,
  },
]

const statusIcons = {
  complete: CheckCircle,
  approved: CheckCircle,
  running: Clock,
  failed: XCircle,
  rejected: XCircle,
  awaiting_approval: AlertCircle,
}

const statusColors: Record<string, 'success' | 'info' | 'destructive' | 'warning' | 'default'> = {
  complete: 'success',
  approved: 'success',
  running: 'info',
  failed: 'destructive',
  rejected: 'destructive',
  awaiting_approval: 'warning',
}

export default function StationsPage() {
  const [runs, setRuns] = useState<StationRun[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchRuns = async () => {
      const { data, error } = await supabase
        .from('station_runs')
        .select(`
          *,
          engagement:engagements(id, name, client:clients(id, name))
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data) {
        setRuns(data)
      }
      setLoading(false)
    }

    fetchRuns()
  }, [])

  const filteredRuns = filter ? runs.filter((r) => r.station_id === filter) : runs
  const pendingApprovals = runs.filter((r) => r.status === 'awaiting_approval')

  // Calculate station stats
  const getStationStats = (stationId: string) => {
    const stationRuns = runs.filter((r) => r.station_id === stationId)
    return {
      total: stationRuns.length,
      successful: stationRuns.filter((r) => ['complete', 'approved'].includes(r.status)).length,
      pending: stationRuns.filter((r) => r.status === 'awaiting_approval').length,
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">AI Stations</h1>
          <p className="text-slate-500 mt-1">Controlled AI execution units for engagement workflows</p>
        </div>
        {pendingApprovals.length > 0 && (
          <Link href="/dashboard/approvals">
            <Button className="bg-amber-600 hover:bg-amber-700">
              <AlertCircle className="h-4 w-4 mr-2" />
              {pendingApprovals.length} Pending Approval{pendingApprovals.length > 1 ? 's' : ''}
            </Button>
          </Link>
        )}
      </div>

      {/* Station cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stations.map((station) => {
          const stats = getStationStats(station.id)
          return (
            <Card key={station.id} className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-teal-600" />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-50">
                      <Cpu className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{station.id}</CardTitle>
                      <CardDescription className="font-medium text-slate-900">
                        {station.name}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">{station.description}</p>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={station.sensitivity === 'T1' ? 'default' : 'warning'}>
                      {station.sensitivity}
                    </Badge>
                    {station.requiresApproval && <Badge variant="info">Approval Required</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-100">
                  <span>{stats.total} runs</span>
                  <span>{stats.successful} successful</span>
                  {stats.pending > 0 && (
                    <span className="text-amber-600 font-medium">{stats.pending} pending</span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent runs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Station Run History</CardTitle>
              <CardDescription>All AI station executions across engagements</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Stations</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id}: {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRuns.length > 0 ? (
            <div className="space-y-2">
              {filteredRuns.map((run) => {
                const StatusIcon = statusIcons[run.status as keyof typeof statusIcons] || Clock
                return (
                  <Link
                    key={run.id}
                    href={`/dashboard/stations/${run.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        <Cpu className="h-4 w-4 text-teal-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-teal-600">{run.station_id}</span>
                          <span className="text-sm font-medium text-slate-900">
                            {run.engagement?.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {run.engagement?.client?.name} •{' '}
                          {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs text-slate-500">
                        <div>{run.tokens_in + run.tokens_out} tokens</div>
                        <div>{(run.duration_ms / 1000).toFixed(1)}s</div>
                      </div>
                      <Badge variant={statusColors[run.status] || 'default'}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {run.status.replace('_', ' ')}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No station runs yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Runs will appear here when you execute stations from engagements
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Station guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Station Governance</CardTitle>
          <CardDescription>SERVE OS Lite control framework</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-slate-50">
              <h4 className="font-medium text-slate-900 mb-2">Sensitivity Tiers</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <Badge variant="default" className="mt-0.5">
                    T1
                  </Badge>
                  <span>Internal only - No client data exposed</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="warning" className="mt-0.5">
                    T2
                  </Badge>
                  <span>Client-facing - QA required, fully logged</span>
                </li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-slate-50">
              <h4 className="font-medium text-slate-900 mb-2">Human-in-the-Loop</h4>
              <p className="text-sm text-slate-600">
                T2 outputs require explicit approval before delivery. All station runs are logged
                for compliance and audit purposes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

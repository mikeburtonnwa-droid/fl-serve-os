'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Cpu,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Building2,
  ChevronRight,
  Filter,
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface PendingItem {
  id: string
  type: 'station_run' | 'artifact'
  name: string
  station_id?: string
  template_id?: string
  engagement_name: string
  engagement_id: string
  client_name: string
  created_at: string
  sensitivity_tier: string
}

interface ApprovalHistory {
  id: string
  decision: string
  created_at: string
  station_run_id: string | null
  artifact_id: string | null
  reviewer: { full_name: string }
  station_run?: { station_id: string; engagement: { name: string } }
  artifact?: { name: string; engagement: { name: string } }
}

const stationNames: Record<string, string> = {
  'S-01': 'Discovery Station',
  'S-02': 'Scoping Station',
  'S-03': 'QA Station',
}

export default function ApprovalsPage() {
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'station_run' | 'artifact'>('all')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchData = async () => {
      // Fetch pending station runs
      const { data: pendingRuns } = await supabase
        .from('station_runs')
        .select(`
          id,
          station_id,
          created_at,
          engagement:engagements(id, name, client:clients(name))
        `)
        .eq('status', 'awaiting_approval')
        .order('created_at', { ascending: false })

      // Fetch pending artifacts
      const { data: pendingArtifacts } = await supabase
        .from('artifacts')
        .select(`
          id,
          name,
          template_id,
          sensitivity_tier,
          created_at,
          engagement:engagements(id, name, client:clients(name))
        `)
        .eq('status', 'pending_review')
        .order('created_at', { ascending: false })

      // Combine and format pending items
      const items: PendingItem[] = []

      if (pendingRuns) {
        pendingRuns.forEach((run) => {
          const eng = run.engagement as unknown as { id: string; name: string; client: { name: string } }
          items.push({
            id: run.id,
            type: 'station_run',
            name: `${run.station_id}: ${stationNames[run.station_id] || run.station_id}`,
            station_id: run.station_id,
            engagement_name: eng?.name || '',
            engagement_id: eng?.id || '',
            client_name: eng?.client?.name || '',
            created_at: run.created_at,
            sensitivity_tier: 'T2',
          })
        })
      }

      if (pendingArtifacts) {
        pendingArtifacts.forEach((artifact) => {
          const eng = artifact.engagement as unknown as { id: string; name: string; client: { name: string } }
          items.push({
            id: artifact.id,
            type: 'artifact',
            name: artifact.name,
            template_id: artifact.template_id,
            engagement_name: eng?.name || '',
            engagement_id: eng?.id || '',
            client_name: eng?.client?.name || '',
            created_at: artifact.created_at,
            sensitivity_tier: artifact.sensitivity_tier,
          })
        })
      }

      // Sort by created_at
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setPendingItems(items)

      // Fetch approval history
      const { data: historyRaw } = await supabase
        .from('approvals')
        .select(`
          id,
          decision,
          created_at,
          station_run_id,
          artifact_id,
          reviewer:users!approvals_reviewer_id_fkey(full_name),
          station_run:station_runs(station_id, engagement:engagements(name)),
          artifact:artifacts(name, engagement:engagements(name))
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      // Transform nested relations (Supabase returns them as arrays)
      const transformedHistory: ApprovalHistory[] = (historyRaw || []).map((h) => {
        const reviewer = Array.isArray(h.reviewer) ? h.reviewer[0] : h.reviewer
        const stationRun = Array.isArray(h.station_run) ? h.station_run[0] : h.station_run
        const artifact = Array.isArray(h.artifact) ? h.artifact[0] : h.artifact

        // Also need to handle nested engagement
        const stationRunEngagement = stationRun?.engagement
          ? (Array.isArray(stationRun.engagement) ? stationRun.engagement[0] : stationRun.engagement)
          : undefined
        const artifactEngagement = artifact?.engagement
          ? (Array.isArray(artifact.engagement) ? artifact.engagement[0] : artifact.engagement)
          : undefined

        return {
          id: h.id,
          decision: h.decision,
          created_at: h.created_at,
          station_run_id: h.station_run_id,
          artifact_id: h.artifact_id,
          reviewer: reviewer || { full_name: 'Unknown' },
          station_run: stationRun ? {
            station_id: stationRun.station_id,
            engagement: stationRunEngagement || { name: '' }
          } : undefined,
          artifact: artifact ? {
            name: artifact.name,
            engagement: artifactEngagement || { name: '' }
          } : undefined,
        }
      })

      setApprovalHistory(transformedHistory)
      setLoading(false)
    }

    fetchData()
  }, [])

  const filteredItems = filter === 'all' ? pendingItems : pendingItems.filter((i) => i.type === filter)

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
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Approval Queue</h1>
        <p className="text-slate-500 mt-1">Review and approve T2 outputs before client delivery</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{pendingItems.length}</p>
                <p className="text-sm text-slate-500">Pending Approvals</p>
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
                <p className="text-2xl font-semibold text-slate-900">
                  {pendingItems.filter((i) => i.type === 'station_run').length}
                </p>
                <p className="text-sm text-slate-500">Station Runs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-100">
                <FileText className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {pendingItems.filter((i) => i.type === 'artifact').length}
                </p>
                <p className="text-sm text-slate-500">Artifacts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Review</CardTitle>
              <CardDescription>Items awaiting your approval</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Types</option>
                <option value="station_run">Station Runs</option>
                <option value="artifact">Artifacts</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredItems.length > 0 ? (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={
                    item.type === 'station_run'
                      ? `/dashboard/stations/${item.id}`
                      : `/dashboard/artifacts/${item.id}`
                  }
                  className="flex items-center justify-between p-4 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white border border-amber-200">
                      {item.type === 'station_run' ? (
                        <Cpu className="h-4 w-4 text-amber-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{item.name}</span>
                        <Badge variant="warning" size="sm">
                          {item.sensitivity_tier}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <Building2 className="h-3 w-3" />
                        <span>{item.client_name}</span>
                        <span>•</span>
                        <span>{item.engagement_name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                      Review
                    </Button>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-green-300 mx-auto mb-3" />
              <p className="text-lg font-medium text-slate-900">All caught up!</p>
              <p className="text-slate-500 mt-1">No items pending approval</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval history */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Approvals</CardTitle>
          <CardDescription>History of approval decisions</CardDescription>
        </CardHeader>
        <CardContent>
          {approvalHistory.length > 0 ? (
            <div className="space-y-3">
              {approvalHistory.map((approval) => {
                const isApproved = approval.decision === 'approved'
                const itemName = approval.station_run
                  ? `${approval.station_run.station_id}: ${stationNames[approval.station_run.station_id] || ''}`
                  : approval.artifact?.name || 'Unknown'
                const engagementName =
                  approval.station_run?.engagement?.name || approval.artifact?.engagement?.name || ''

                return (
                  <div
                    key={approval.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isApproved ? 'bg-green-100' : 'bg-red-100'
                        }`}
                      >
                        {isApproved ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{itemName}</p>
                        <p className="text-xs text-slate-500">{engagementName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm text-slate-900">{approval.reviewer?.full_name}</p>
                        <p className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(approval.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge variant={isApproved ? 'success' : 'destructive'} size="sm">
                        {approval.decision}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No approval history yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

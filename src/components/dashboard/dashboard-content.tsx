'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { OnboardingChecklist } from '@/components/guidance'
import {
  Users,
  Briefcase,
  FileText,
  Cpu,
  ArrowRight,
  Clock,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

const pathwayLabels: Record<string, string> = {
  knowledge_spine: 'Knowledge Spine',
  roi_audit: 'ROI Audit',
  workflow_sprint: 'Workflow Sprint',
}

const pathwayColors: Record<string, string> = {
  knowledge_spine: 'bg-blue-100 text-blue-700',
  roi_audit: 'bg-purple-100 text-purple-700',
  workflow_sprint: 'bg-green-100 text-green-700',
}

const stationLabels: Record<string, string> = {
  'S-01': 'Discovery',
  'S-02': 'Scoping',
  'S-03': 'QA',
}

interface DashboardContentProps {
  stats: {
    clients: number
    engagements: number
    stationRuns: number
    artifacts: number
    pendingStationRuns: number
    pendingArtifacts: number
    completedStations: number
    approvedArtifacts: number
    pathwayCounts: Record<string, number>
  }
  recentEngagements: Array<{
    id: string
    name: string
    pathway: string
    status: string
    client?: { name: string } | null
  }>
  pendingStationRuns: Array<{
    id: string
    station_id: string
    created_at: string
    engagement?: { name: string } | null
  }>
  pendingArtifacts: Array<{
    id: string
    name: string
    template_id: string
    created_at: string
    engagement?: { name: string } | null
  }>
  recentStationActivity: Array<{
    id: string
    station_id: string
    status: string
    created_at: string
    engagement?: { name?: string; client?: { name?: string } | null } | null
  }>
}

export function DashboardContent({
  stats,
  recentEngagements,
  pendingStationRuns,
  pendingArtifacts,
  recentStationActivity,
}: DashboardContentProps) {
  const totalPending = stats.pendingStationRuns + stats.pendingArtifacts

  const statCards = [
    { name: 'Active Clients', value: stats.clients, icon: Users, href: '/dashboard/clients', color: 'text-blue-600' },
    { name: 'Engagements', value: stats.engagements, icon: Briefcase, href: '/dashboard/engagements', color: 'text-teal-600' },
    { name: 'AI Station Runs', value: stats.stationRuns, icon: Cpu, href: '/dashboard/stations', color: 'text-purple-600' },
    { name: 'Artifacts', value: stats.artifacts, icon: FileText, href: '/dashboard/artifacts', color: 'text-amber-600' },
  ]

  return (
    <div className="space-y-6">
      {/* Onboarding Checklist */}
      <OnboardingChecklist />

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome to SERVE OS. Here&apos;s an overview of your operations.</p>
        </div>
        <div className="flex items-center gap-3">
          {totalPending > 0 && (
            <Link href="/dashboard/approvals">
              <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                <AlertCircle className="mr-2 h-4 w-4" />
                {totalPending} Pending Approval{totalPending !== 1 ? 's' : ''}
              </Button>
            </Link>
          )}
          <Link href="/dashboard/engagements/new">
            <Button className="bg-teal-600 hover:bg-teal-700">
              New Engagement
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.name} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {stat.name}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Secondary metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-amber-600">{totalPending}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              {stats.pendingStationRuns} stations · {stats.pendingArtifacts} artifacts
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Approved Items</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.completedStations + stats.approvedArtifacts}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              {stats.completedStations} stations · {stats.approvedArtifacts} artifacts
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pathway Distribution</p>
                <div className="flex items-center gap-2 mt-2">
                  {Object.entries(stats.pathwayCounts).map(([pathway, count]) => (
                    <span
                      key={pathway}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${pathwayColors[pathway] || 'bg-slate-100 text-slate-700'}`}
                    >
                      {count}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              Active engagement pathways
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Engagements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-teal-600" />
              Recent Engagements
            </CardTitle>
            <CardDescription>Your most recent client engagements</CardDescription>
          </CardHeader>
          <CardContent>
            {recentEngagements && recentEngagements.length > 0 ? (
              <div className="space-y-3">
                {recentEngagements.map((engagement) => (
                  <Link key={engagement.id} href={`/dashboard/engagements/${engagement.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div>
                        <p className="font-medium text-slate-900">{engagement.name}</p>
                        <p className="text-sm text-slate-500">{engagement.client?.name}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${pathwayColors[engagement.pathway] || 'bg-slate-100 text-slate-700'}`}>
                          {pathwayLabels[engagement.pathway] || engagement.pathway}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No engagements yet</p>
                <Link href="/dashboard/engagements/new">
                  <Button variant="outline" size="sm" className="mt-3">
                    Create your first engagement
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Approvals Queue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-600" />
                Approval Queue
              </CardTitle>
              <CardDescription>Items awaiting your review</CardDescription>
            </div>
            {totalPending > 0 && (
              <Link href="/dashboard/approvals">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {(pendingStationRuns && pendingStationRuns.length > 0) || (pendingArtifacts && pendingArtifacts.length > 0) ? (
              <div className="space-y-3">
                {pendingStationRuns?.map((run) => (
                  <Link key={run.id} href={`/dashboard/stations/${run.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg">
                          <Cpu className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {run.station_id}: {stationLabels[run.station_id]}
                          </p>
                          <p className="text-sm text-slate-500">{run.engagement?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">
                          {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                        </span>
                        <Button size="sm" className="bg-amber-600 hover:bg-amber-700">Review</Button>
                      </div>
                    </div>
                  </Link>
                ))}
                {pendingArtifacts?.map((artifact) => (
                  <Link key={artifact.id} href={`/dashboard/artifacts/${artifact.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg">
                          <FileText className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{artifact.name}</p>
                          <p className="text-sm text-slate-500">{artifact.engagement?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">
                          {formatDistanceToNow(new Date(artifact.created_at), { addSuffix: true })}
                        </span>
                        <Button size="sm" className="bg-amber-600 hover:bg-amber-700">Review</Button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-300 mx-auto mb-3" />
                <p className="text-slate-500">All caught up!</p>
                <p className="text-sm text-slate-400 mt-1">No pending approvals</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent AI Station Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
            Recent AI Station Activity
          </CardTitle>
          <CardDescription>Latest AI station runs across all engagements</CardDescription>
        </CardHeader>
        <CardContent>
          {recentStationActivity && recentStationActivity.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Station</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Engagement</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Time</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentStationActivity.map((run) => (
                    <tr key={run.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-purple-600" />
                          <span className="font-medium text-slate-900">
                            {run.station_id}: {stationLabels[run.station_id]}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm text-slate-900">{run.engagement?.name}</p>
                          <p className="text-xs text-slate-500">{run.engagement?.client?.name}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            run.status === 'approved' ? 'success' :
                            run.status === 'awaiting_approval' ? 'warning' :
                            run.status === 'rejected' ? 'destructive' : 'default'
                          }
                        >
                          {run.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500">
                        {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/dashboard/stations/${run.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Cpu className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No AI station activity yet</p>
              <p className="text-sm text-slate-400 mt-1">Run a station from an engagement to see activity here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Link href="/dashboard/clients/new">
              <div className="p-4 rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-colors cursor-pointer">
                <Users className="h-8 w-8 text-teal-600 mb-3" />
                <h3 className="font-medium text-slate-900">Add New Client</h3>
                <p className="text-sm text-slate-500 mt-1">Register a new client</p>
              </div>
            </Link>
            <Link href="/dashboard/engagements/new">
              <div className="p-4 rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-colors cursor-pointer">
                <Briefcase className="h-8 w-8 text-teal-600 mb-3" />
                <h3 className="font-medium text-slate-900">Start Engagement</h3>
                <p className="text-sm text-slate-500 mt-1">Begin intake assessment</p>
              </div>
            </Link>
            <Link href="/dashboard/stations">
              <div className="p-4 rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-colors cursor-pointer">
                <Cpu className="h-8 w-8 text-teal-600 mb-3" />
                <h3 className="font-medium text-slate-900">AI Stations</h3>
                <p className="text-sm text-slate-500 mt-1">View station history</p>
              </div>
            </Link>
            <Link href="/dashboard/approvals">
              <div className="p-4 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-colors cursor-pointer">
                <ShieldCheck className="h-8 w-8 text-amber-600 mb-3" />
                <h3 className="font-medium text-slate-900">Review Queue</h3>
                <p className="text-sm text-slate-500 mt-1">{totalPending} items pending</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

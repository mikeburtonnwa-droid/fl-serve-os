/**
 * Portal Analytics Component (F10.7)
 *
 * Dashboard showing client portal access analytics.
 *
 * User Stories: US-040
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  Eye,
  Clock,
  Users,
  FileText,
  Loader2,
  TrendingUp,
  Calendar,
  Globe,
} from 'lucide-react'

interface AnalyticsData {
  totalViews: number
  uniqueVisitors: number
  avgSessionDuration: number
  totalSessions: number
  topArtifacts: ArtifactView[]
  recentActivity: ActivityItem[]
  viewsByDay: DailyViews[]
  activeLinks: number
  expiredLinks: number
}

interface ArtifactView {
  artifactId: string
  artifactName: string
  viewCount: number
  lastViewed: string
}

interface ActivityItem {
  id: string
  action: string
  timestamp: string
  clientEmail?: string
  artifactName?: string
  metadata?: Record<string, string>
}

interface DailyViews {
  date: string
  views: number
}

interface PortalAnalyticsProps {
  engagementId: string
}

export function PortalAnalytics({ engagementId }: PortalAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/portal/analytics/${engagementId}?range=${dateRange}`
        )
        const data = await response.json()

        if (data.success) {
          setAnalytics(data.analytics)
        } else {
          setError(data.error)
        }
      } catch {
        setError('Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [engagementId, dateRange])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    )
  }

  if (error || !analytics) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-slate-500">
            {error || 'No analytics data available'}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Portal Analytics
        </h2>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                dateRange === range
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Eye}
          label="Total Views"
          value={analytics.totalViews}
          trend={analytics.totalViews > 0 ? 'up' : undefined}
        />
        <StatCard
          icon={Users}
          label="Unique Visitors"
          value={analytics.uniqueVisitors}
        />
        <StatCard
          icon={Clock}
          label="Avg Session"
          value={formatDuration(analytics.avgSessionDuration)}
          isText
        />
        <StatCard
          icon={Globe}
          label="Active Links"
          value={analytics.activeLinks}
          subtext={`${analytics.expiredLinks} expired`}
        />
      </div>

      {/* Views Chart (Simplified Bar Representation) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Views Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.viewsByDay.length > 0 ? (
            <ViewsChart data={analytics.viewsByDay} />
          ) : (
            <div className="text-center py-8 text-slate-500">
              No view data for this period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Artifacts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Top Viewed Artifacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topArtifacts.length > 0 ? (
              <div className="space-y-3">
                {analytics.topArtifacts.slice(0, 5).map((artifact, index) => (
                  <div
                    key={artifact.artifactId}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-slate-900">
                          {artifact.artifactName}
                        </div>
                        <div className="text-xs text-slate-500">
                          Last viewed {formatRelativeTime(artifact.lastViewed)}
                        </div>
                      </div>
                    </div>
                    <Badge variant="default" size="sm">
                      {artifact.viewCount} views
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-500 text-sm">
                No artifact views yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {analytics.recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-900">
                        {formatActivityAction(activity)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatRelativeTime(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-500 text-sm">
                No recent activity
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// =============================================================================
// Stat Card Sub-component
// =============================================================================

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: number | string
  trend?: 'up' | 'down'
  subtext?: string
  isText?: boolean
}

function StatCard({ icon: Icon, label, value, trend, subtext, isText }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Icon className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500">{label}</div>
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${isText ? 'text-base' : 'text-xl'}`}>
                {isText ? value : typeof value === 'number' ? value.toLocaleString() : value}
              </span>
              {trend === 'up' && (
                <TrendingUp className="h-4 w-4 text-green-500" />
              )}
            </div>
            {subtext && (
              <div className="text-xs text-slate-400">{subtext}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Views Chart Sub-component (Simple Bar Chart)
// =============================================================================

interface ViewsChartProps {
  data: DailyViews[]
}

function ViewsChart({ data }: ViewsChartProps) {
  const maxViews = Math.max(...data.map((d) => d.views), 1)

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1 h-32">
        {data.map((day, index) => (
          <div
            key={day.date}
            className="flex-1 flex flex-col items-center gap-1"
          >
            <div
              className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
              style={{
                height: `${(day.views / maxViews) * 100}%`,
                minHeight: day.views > 0 ? '4px' : '0',
              }}
              title={`${day.views} views`}
            />
            {index % Math.ceil(data.length / 7) === 0 && (
              <span className="text-xs text-slate-400 mt-1">
                {formatChartDate(day.date)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Utility Functions
// =============================================================================

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${Math.round(seconds / 3600)}h`
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatChartDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatActivityAction(activity: ActivityItem): string {
  const actions: Record<string, string> = {
    portal_access: 'Portal accessed',
    artifact_view: `Viewed "${activity.artifactName}"`,
    artifact_download: `Downloaded "${activity.artifactName}"`,
    session_start: 'Session started',
    session_end: 'Session ended',
  }

  return actions[activity.action] || activity.action
}

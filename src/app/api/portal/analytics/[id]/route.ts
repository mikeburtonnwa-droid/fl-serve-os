/**
 * Portal Analytics API Route (F10.7)
 *
 * GET - Get portal analytics for an engagement
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =============================================================================
// GET - Get Portal Analytics
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: engagementId } = await params
    const { searchParams } = new URL(request.url)
    const daysBack = parseInt(searchParams.get('days') || '30')

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)

    // Get summary stats using the RPC function
    const { data: summaryData } = await supabase.rpc('get_portal_analytics', {
      engagement_uuid: engagementId,
      days_back: daysBack,
    })

    const summary = summaryData?.[0] || {
      total_views: 0,
      unique_visitors: 0,
      artifact_views: 0,
      downloads: 0,
    }

    // Get views by day
    const { data: activityByDay } = await supabase
      .from('portal_activity_log')
      .select('created_at, client_email')
      .eq('engagement_id', engagementId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    // Group by day
    const viewsByDay: Record<string, { views: number; visitors: Set<string> }> = {}

    if (activityByDay) {
      for (const activity of activityByDay) {
        const day = activity.created_at.split('T')[0]
        if (!viewsByDay[day]) {
          viewsByDay[day] = { views: 0, visitors: new Set() }
        }
        viewsByDay[day].views++
        if (activity.client_email) {
          viewsByDay[day].visitors.add(activity.client_email)
        }
      }
    }

    // Convert to array
    const viewsByDayArray = Object.entries(viewsByDay)
      .map(([date, data]) => ({
        date,
        views: data.views,
        uniqueVisitors: data.visitors.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Get top artifacts
    const { data: artifactActivity } = await supabase
      .from('portal_activity_log')
      .select('artifact_id, action')
      .eq('engagement_id', engagementId)
      .in('action', ['view_artifact', 'download_artifact'])
      .not('artifact_id', 'is', null)
      .gte('created_at', startDate.toISOString())

    // Group by artifact
    const artifactStats: Record<string, { views: number; downloads: number }> = {}

    if (artifactActivity) {
      for (const activity of artifactActivity) {
        if (!activity.artifact_id) continue
        if (!artifactStats[activity.artifact_id]) {
          artifactStats[activity.artifact_id] = { views: 0, downloads: 0 }
        }
        if (activity.action === 'view_artifact') {
          artifactStats[activity.artifact_id].views++
        } else if (activity.action === 'download_artifact') {
          artifactStats[activity.artifact_id].downloads++
        }
      }
    }

    // Get artifact names
    const artifactIds = Object.keys(artifactStats)
    let topArtifacts: Array<{
      artifactId: string
      artifactName: string
      views: number
      downloads: number
    }> = []

    if (artifactIds.length > 0) {
      const { data: artifacts } = await supabase
        .from('artifacts')
        .select('id, name')
        .in('id', artifactIds)

      if (artifacts) {
        topArtifacts = artifacts
          .map((a) => ({
            artifactId: a.id,
            artifactName: a.name,
            views: artifactStats[a.id]?.views || 0,
            downloads: artifactStats[a.id]?.downloads || 0,
          }))
          .sort((a, b) => b.views + b.downloads - (a.views + a.downloads))
          .slice(0, 10)
      }
    }

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('portal_activity_log')
      .select('created_at, action, client_email, artifact_id, details')
      .eq('engagement_id', engagementId)
      .order('created_at', { ascending: false })
      .limit(20)

    const recentActivityFormatted =
      recentActivity?.map((activity) => ({
        timestamp: activity.created_at,
        action: activity.action as 'view' | 'download' | 'login',
        details: formatActivityDetails(activity),
        clientEmail: activity.client_email,
      })) || []

    return NextResponse.json({
      success: true,
      analytics: {
        engagementId,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        summary: {
          totalViews: summary.total_views,
          uniqueVisitors: summary.unique_visitors,
          avgSessionDuration: 0, // Would calculate from session data
          artifactsViewed: summary.artifact_views,
          downloadsCount: summary.downloads,
        },
        viewsByDay: viewsByDayArray,
        topArtifacts,
        recentActivity: recentActivityFormatted,
      },
    })
  } catch (error) {
    console.error('Error fetching portal analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatActivityDetails(activity: {
  action: string
  artifact_id?: string
  details?: Record<string, unknown>
}): string {
  switch (activity.action) {
    case 'login':
      return 'Logged into portal'
    case 'view_dashboard':
      return 'Viewed dashboard'
    case 'view_artifact':
      return `Viewed artifact`
    case 'download_artifact':
      return `Downloaded artifact`
    case 'logout':
      return 'Logged out'
    default:
      return activity.action
  }
}

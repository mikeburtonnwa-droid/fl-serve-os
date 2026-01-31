import { createClient } from '@/lib/supabase/server'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch all stats in parallel
  const [
    clientsResult,
    engagementsResult,
    stationRunsResult,
    artifactsResult,
    pendingStationRunsResult,
    pendingArtifactsResult,
    completedStationsResult,
    approvedArtifactsResult,
    pathwayDistribution,
  ] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('engagements').select('id', { count: 'exact', head: true }),
    supabase.from('station_runs').select('id', { count: 'exact', head: true }),
    supabase.from('artifacts').select('id', { count: 'exact', head: true }).neq('status', 'archived'),
    supabase.from('station_runs').select('id', { count: 'exact', head: true }).eq('status', 'awaiting_approval'),
    supabase.from('artifacts').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
    supabase.from('station_runs').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('artifacts').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('engagements').select('pathway'),
  ])

  // Calculate pathway counts
  const pathwayCounts = (pathwayDistribution.data || []).reduce((acc, e) => {
    acc[e.pathway] = (acc[e.pathway] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const stats = {
    clients: clientsResult.count || 0,
    engagements: engagementsResult.count || 0,
    stationRuns: stationRunsResult.count || 0,
    artifacts: artifactsResult.count || 0,
    pendingStationRuns: pendingStationRunsResult.count || 0,
    pendingArtifacts: pendingArtifactsResult.count || 0,
    completedStations: completedStationsResult.count || 0,
    approvedArtifacts: approvedArtifactsResult.count || 0,
    pathwayCounts,
  }

  // Fetch recent engagements
  const { data: recentEngagementsRaw } = await supabase
    .from('engagements')
    .select(`
      id,
      name,
      pathway,
      status,
      client:clients(name)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  // Transform the data to handle the nested client object
  const recentEngagements = recentEngagementsRaw?.map((e) => ({
    ...e,
    client: Array.isArray(e.client) ? e.client[0] : e.client,
  })) || []

  // Fetch pending station runs
  const { data: pendingStationRunsRaw } = await supabase
    .from('station_runs')
    .select(`
      id,
      station_id,
      created_at,
      engagement:engagements(name)
    `)
    .eq('status', 'awaiting_approval')
    .order('created_at', { ascending: false })
    .limit(3)

  const pendingStationRuns = pendingStationRunsRaw?.map((p) => ({
    ...p,
    engagement: Array.isArray(p.engagement) ? p.engagement[0] : p.engagement,
  })) || []

  // Fetch pending artifacts
  const { data: pendingArtifactsRaw } = await supabase
    .from('artifacts')
    .select(`
      id,
      name,
      template_id,
      created_at,
      engagement:engagements(name)
    `)
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false })
    .limit(3)

  const pendingArtifacts = pendingArtifactsRaw?.map((a) => ({
    ...a,
    engagement: Array.isArray(a.engagement) ? a.engagement[0] : a.engagement,
  })) || []

  // Fetch recent station activity
  const { data: recentStationActivityRaw } = await supabase
    .from('station_runs')
    .select(`
      id,
      station_id,
      status,
      created_at,
      engagement:engagements(name, client:clients(name))
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  const recentStationActivity = recentStationActivityRaw?.map((s) => {
    const engagement = Array.isArray(s.engagement) ? s.engagement[0] : s.engagement
    return {
      ...s,
      engagement: engagement ? {
        name: engagement.name,
        client: Array.isArray(engagement.client) ? engagement.client[0] : engagement.client,
      } : null,
    }
  }) || []

  return (
    <DashboardContent
      stats={stats}
      recentEngagements={recentEngagements}
      pendingStationRuns={pendingStationRuns}
      pendingArtifacts={pendingArtifacts}
      recentStationActivity={recentStationActivity}
    />
  )
}

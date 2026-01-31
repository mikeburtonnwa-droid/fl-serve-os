'use client'

import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/ui/search-input'
import { EmptyState } from '@/components/ui/empty-state'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Skeleton, CardSkeleton } from '@/components/ui/skeleton'
import { Briefcase, Plus, ArrowRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Engagement {
  id: string
  name: string
  pathway: string
  status: string
  intake_score: number | null
  start_date: string | null
  created_at: string
  client: { id: string; name: string } | null
}

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

const statusColors: Record<string, 'default' | 'info' | 'success' | 'warning' | 'destructive'> = {
  intake: 'info',
  discovery: 'info',
  active: 'success',
  review: 'warning',
  complete: 'default',
  on_hold: 'default',
}

export default function EngagementsPage() {
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [pathwayFilter, setPathwayFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchEngagements = async () => {
      const { data, error } = await supabase
        .from('engagements')
        .select(`
          *,
          client:clients(id, name)
        `)
        .order('created_at', { ascending: false })

      if (!error && data) {
        const transformed = data.map((e) => ({
          ...e,
          client: Array.isArray(e.client) ? e.client[0] : e.client,
        }))
        setEngagements(transformed)
      }
      setLoading(false)
    }

    fetchEngagements()
  }, [])

  const filteredEngagements = useMemo(() => {
    return engagements.filter((engagement) => {
      const matchesSearch = searchQuery === '' ||
        engagement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        engagement.client?.name.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesPathway = pathwayFilter === '' || engagement.pathway === pathwayFilter
      const matchesStatus = statusFilter === '' || engagement.status === statusFilter

      return matchesSearch && matchesPathway && matchesStatus
    })
  }, [engagements, searchQuery, pathwayFilter, statusFilter])

  // Calculate stats
  const stats = useMemo(() => {
    const byPathway = engagements.reduce((acc, e) => {
      acc[e.pathway] = (acc[e.pathway] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const active = engagements.filter((e) => ['intake', 'discovery', 'active'].includes(e.status)).length
    const complete = engagements.filter((e) => e.status === 'complete').length

    return { byPathway, active, complete, total: engagements.length }
  }, [engagements])

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Engagements' }]} />

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Engagements</h1>
          <p className="text-slate-500 mt-1">Track and manage your client engagements</p>
        </div>
        <Link href="/dashboard/engagements/new">
          <Button className="bg-teal-600 hover:bg-teal-700">
            <Plus className="mr-2 h-4 w-4" />
            New Engagement
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-100">
                <Briefcase className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{stats.total}</p>
                <p className="text-sm text-slate-500">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{stats.active}</p>
                <p className="text-sm text-slate-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">By Pathway</p>
                <div className="flex items-center gap-1.5 mt-2">
                  {Object.entries(stats.byPathway).map(([pathway, count]) => (
                    <span
                      key={pathway}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${pathwayColors[pathway] || 'bg-slate-100 text-slate-700'}`}
                      title={pathwayLabels[pathway]}
                    >
                      {count}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <Briefcase className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{stats.complete}</p>
                <p className="text-sm text-slate-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name or client..."
              className="flex-1 min-w-[200px]"
            />
            <select
              value={pathwayFilter}
              onChange={(e) => setPathwayFilter(e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Pathways</option>
              <option value="knowledge_spine">Knowledge Spine</option>
              <option value="roi_audit">ROI Audit</option>
              <option value="workflow_sprint">Workflow Sprint</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Statuses</option>
              <option value="intake">Intake</option>
              <option value="discovery">Discovery</option>
              <option value="active">Active</option>
              <option value="review">Review</option>
              <option value="complete">Complete</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Engagements grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredEngagements.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEngagements.map((engagement) => (
            <Link key={engagement.id} href={`/dashboard/engagements/${engagement.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg group-hover:text-teal-600 transition-colors">
                        {engagement.name}
                      </CardTitle>
                      <CardDescription>{engagement.client?.name}</CardDescription>
                    </div>
                    <Badge variant={statusColors[engagement.status] || 'default'}>
                      {engagement.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${pathwayColors[engagement.pathway] || 'bg-slate-100 text-slate-700'}`}>
                        {pathwayLabels[engagement.pathway] || engagement.pathway}
                      </span>
                      {engagement.intake_score !== null && (
                        <span className="text-xs text-slate-500">
                          Score: {engagement.intake_score}/21
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Started: {engagement.start_date
                          ? new Date(engagement.start_date).toLocaleDateString()
                          : 'Not set'}
                      </span>
                      <div className="flex items-center gap-1 text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>View</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : engagements.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Briefcase}
              title="No engagements yet"
              description="Start by creating a new client engagement to begin the intake process"
              action={{ label: 'New Engagement', href: '/dashboard/engagements/new' }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Briefcase}
              title="No matching engagements"
              description="Try adjusting your search or filter criteria"
              action={{
                label: 'Clear filters',
                onClick: () => {
                  setSearchQuery('')
                  setPathwayFilter('')
                  setStatusFilter('')
                },
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

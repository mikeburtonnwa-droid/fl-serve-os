'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Search, Eye, Plus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { TEMPLATES } from '@/lib/templates'
import { PDFExportButton, BatchExportPanel } from '@/components/artifacts/pdf-export-button'

interface Artifact {
  id: string
  name: string
  template_id: string
  sensitivity_tier: 'T1' | 'T2' | 'T3'
  status: 'draft' | 'pending_review' | 'approved' | 'archived'
  version: number
  updated_at: string
  engagement: {
    id: string
    name: string
    client: {
      id: string
      name: string
    }
  }
}

const statusColors = {
  draft: 'default',
  pending_review: 'warning',
  approved: 'success',
  archived: 'default',
} as const

export default function ArtifactsPage() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ template: '', status: '', search: '' })
  const [selectedArtifacts, setSelectedArtifacts] = useState<string[]>([])

  const toggleArtifactSelection = (id: string) => {
    setSelectedArtifacts((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedArtifacts.length === filteredArtifacts.length) {
      setSelectedArtifacts([])
    } else {
      setSelectedArtifacts(filteredArtifacts.map((a) => a.id))
    }
  }

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchArtifacts = async () => {
      const { data, error } = await supabase
        .from('artifacts')
        .select(`
          *,
          engagement:engagements(id, name, client:clients(id, name))
        `)
        .neq('status', 'archived')
        .order('updated_at', { ascending: false })

      if (!error && data) {
        setArtifacts(data)
      }
      setLoading(false)
    }

    fetchArtifacts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredArtifacts = artifacts.filter((a) => {
    if (filter.template && a.template_id !== filter.template) return false
    if (filter.status && a.status !== filter.status) return false
    if (filter.search) {
      const search = filter.search.toLowerCase()
      if (
        !a.name.toLowerCase().includes(search) &&
        !a.engagement?.name.toLowerCase().includes(search) &&
        !a.engagement?.client?.name.toLowerCase().includes(search)
      ) {
        return false
      }
    }
    return true
  })

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
          <h1 className="text-2xl font-semibold text-slate-900">Artifacts</h1>
          <p className="text-slate-500 mt-1">Manage engagement deliverables and documentation</p>
        </div>
        <Link href="/dashboard/artifacts/new">
          <Button className="bg-teal-600 hover:bg-teal-700">
            <Plus className="h-4 w-4 mr-2" />
            New Artifact
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search artifacts..."
                value={filter.search}
                onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <select
              value={filter.template}
              onChange={(e) => setFilter((f) => ({ ...f, template: e.target.value }))}
              className="h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Templates</option>
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code}: {t.name}
                </option>
              ))}
            </select>
            <select
              value={filter.status}
              onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
              className="h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending_review">Pending Review</option>
              <option value="approved">Approved</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Artifacts list */}
      <Card>
        <CardHeader>
          <CardTitle>All Artifacts</CardTitle>
          <CardDescription>{filteredArtifacts.length} artifacts</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredArtifacts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedArtifacts.length === filteredArtifacts.length && filteredArtifacts.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Artifact</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Engagement</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Sensitivity</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Version</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Updated</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArtifacts.map((artifact) => (
                    <tr key={artifact.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedArtifacts.includes(artifact.id)}
                          onChange={() => toggleArtifactSelection(artifact.id)}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-100">
                            <FileText className="h-4 w-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{artifact.name}</p>
                            <p className="text-xs text-slate-500">{artifact.template_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <Link
                            href={`/dashboard/engagements/${artifact.engagement?.id}`}
                            className="text-sm text-slate-900 hover:text-teal-600"
                          >
                            {artifact.engagement?.name}
                          </Link>
                          <p className="text-xs text-slate-500">{artifact.engagement?.client?.name}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={artifact.sensitivity_tier === 'T1' ? 'default' : 'warning'}>
                          {artifact.sensitivity_tier}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusColors[artifact.status]}>
                          {artifact.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">v{artifact.version}</td>
                      <td className="py-3 px-4 text-sm text-slate-500">
                        {formatDistanceToNow(new Date(artifact.updated_at), { addSuffix: true })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <PDFExportButton
                            artifactId={artifact.id}
                            artifactName={artifact.name}
                            variant="icon"
                          />
                          <Link href={`/dashboard/artifacts/${artifact.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No artifacts yet</h3>
              <p className="text-slate-500 mb-4">
                Create artifacts from templates to document your engagements
              </p>
              <Link href="/dashboard/artifacts/new">
                <Button className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Artifact
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Templates reference */}
      <Card>
        <CardHeader>
          <CardTitle>Available Templates</CardTitle>
          <CardDescription>SERVE OS document templates for standardized deliverables</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((template) => (
              <div key={template.code} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <FileText className="h-4 w-4 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-teal-600">{template.code}</p>
                    <Badge variant={template.sensitivityTier === 'T1' ? 'default' : 'warning'} size="sm">
                      {template.sensitivityTier}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-900 truncate">{template.name}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Batch Export Panel - shows when artifacts are selected */}
      <BatchExportPanel
        selectedArtifactIds={selectedArtifacts}
        onClearSelection={() => setSelectedArtifacts([])}
      />
    </div>
  )
}

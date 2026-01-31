'use client'

import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/ui/search-input'
import { EmptyState } from '@/components/ui/empty-state'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Skeleton, TableRowSkeleton } from '@/components/ui/skeleton'
import { Users, Plus, Edit, Trash2, Building2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Client {
  id: string
  name: string
  industry: string | null
  status: string
  size: string | null
  primary_contact_name: string | null
  primary_contact_email: string | null
  created_at: string
  engagementCount: number
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchClients = async () => {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          engagements:engagements(count)
        `)
        .order('created_at', { ascending: false })

      if (!error && data) {
        const clientsWithCounts = data.map((client) => ({
          ...client,
          engagementCount: client.engagements?.[0]?.count || 0,
        }))
        setClients(clientsWithCounts)
      }
      setLoading(false)
    }

    fetchClients()
  }, [])

  // Filter clients based on search and status
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch = searchQuery === '' ||
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.primary_contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.primary_contact_email?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === '' || client.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [clients, searchQuery, statusFilter])

  const handleDelete = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return
    }

    setDeleting(clientId)
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)

    if (!error) {
      setClients((prev) => prev.filter((c) => c.id !== clientId))
    }
    setDeleting(null)
  }

  const statusCounts = useMemo(() => {
    return clients.reduce((acc, client) => {
      acc[client.status] = (acc[client.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [clients])

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Clients' }]} />

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Clients</h1>
          <p className="text-slate-500 mt-1">Manage your client relationships and engagements</p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button className="bg-teal-600 hover:bg-teal-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </Link>
      </div>

      {/* Stats overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <Building2 className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{clients.length}</p>
                <p className="text-sm text-slate-500">Total Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{statusCounts['active'] || 0}</p>
                <p className="text-sm text-slate-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{statusCounts['prospect'] || 0}</p>
                <p className="text-sm text-slate-500">Prospects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <Users className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{statusCounts['inactive'] || 0}</p>
                <p className="text-sm text-slate-500">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search clients by name, industry, or contact..."
              className="flex-1"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="prospect">Prospect</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Clients list */}
      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>
            {loading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              `${filteredClients.length} client${filteredClients.length !== 1 ? 's' : ''} found`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Industry</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Engagements</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Contact</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Added</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRowSkeleton key={i} columns={7} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : filteredClients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Industry</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Engagements</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Contact</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Added</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div>
                          <Link
                            href={`/dashboard/clients/${client.id}`}
                            className="font-medium text-slate-900 hover:text-teal-600"
                          >
                            {client.name}
                          </Link>
                          {client.size && (
                            <p className="text-xs text-slate-500">{client.size}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{client.industry || '—'}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            client.status === 'active' ? 'success' :
                            client.status === 'prospect' ? 'info' : 'default'
                          }
                        >
                          {client.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{client.engagementCount}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm text-slate-900">
                            {client.primary_contact_name || '—'}
                          </p>
                          {client.primary_contact_email && (
                            <p className="text-xs text-slate-500">{client.primary_contact_email}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500">
                        {formatDistanceToNow(new Date(client.created_at), { addSuffix: true })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/dashboard/clients/${client.id}`}>
                            <button className="p-2 rounded-lg hover:bg-slate-100" title="Edit">
                              <Edit className="h-4 w-4 text-slate-400" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(client.id)}
                            disabled={deleting === client.id}
                            className="p-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
                            title="Delete"
                          >
                            {deleting === client.id ? (
                              <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : clients.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No clients yet"
              description="Get started by adding your first client to the system"
              action={{ label: 'Add Client', href: '/dashboard/clients/new' }}
            />
          ) : (
            <EmptyState
              icon={Users}
              title="No matching clients"
              description="Try adjusting your search or filter criteria"
              action={{
                label: 'Clear filters',
                onClick: () => {
                  setSearchQuery('')
                  setStatusFilter('')
                },
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

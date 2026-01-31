'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Settings,
  User,
  Shield,
  History,
  Loader2,
  FileText,
  Briefcase,
  Users,
  Cpu,
  RefreshCw
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface AuditLog {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  details: Record<string, unknown>
  created_at: string
  user?: {
    id: string
    full_name: string
    email: string
  }
}

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: string
}

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  approve: 'bg-emerald-100 text-emerald-700',
  reject: 'bg-amber-100 text-amber-700',
  run: 'bg-purple-100 text-purple-700',
}

const entityIcons: Record<string, typeof FileText> = {
  artifact: FileText,
  engagement: Briefcase,
  client: Users,
  station_run: Cpu,
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'audit'>('profile')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditFilter, setAuditFilter] = useState({ entityType: '', action: '' })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUserProfile({
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            role: profile.role,
          })
        }
      }
      setLoading(false)
    }

    fetchUserProfile()
  }, [])

  const fetchAuditLogs = async () => {
    setAuditLoading(true)
    try {
      const params = new URLSearchParams()
      if (auditFilter.entityType) params.append('entityType', auditFilter.entityType)
      if (auditFilter.action) params.append('action', auditFilter.action)
      params.append('limit', '100')

      const response = await fetch(`/api/audit?${params.toString()}`)
      const data = await response.json()

      if (data.logs) {
        setAuditLogs(data.logs)
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setAuditLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs()
    }
  }, [activeTab, auditFilter])

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
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account and view system activity</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'profile'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <User className="h-4 w-4" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'audit'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="h-4 w-4" />
          Audit Trail
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-teal-600" />
                Profile Information
              </CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Full Name</label>
                <p className="mt-1 text-lg text-slate-900">{userProfile?.full_name || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Email</label>
                <p className="mt-1 text-lg text-slate-900">{userProfile?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Role</label>
                <div className="mt-1">
                  <Badge variant="default" className="capitalize">
                    {userProfile?.role || 'consultant'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-teal-600" />
                Security
              </CardTitle>
              <CardDescription>Account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50">
                <h4 className="font-medium text-slate-900">Password</h4>
                <p className="text-sm text-slate-500 mt-1">
                  Managed through Supabase Auth
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50">
                <h4 className="font-medium text-slate-900">Two-Factor Authentication</h4>
                <p className="text-sm text-slate-500 mt-1">
                  Contact administrator to enable 2FA
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-teal-600" />
                System Information
              </CardTitle>
              <CardDescription>SERVE OS configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-slate-50">
                  <h4 className="text-sm font-medium text-slate-600">Version</h4>
                  <p className="mt-1 text-lg font-semibold text-slate-900">1.0.0</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50">
                  <h4 className="text-sm font-medium text-slate-600">AI Model</h4>
                  <p className="mt-1 text-lg font-semibold text-slate-900">Claude Sonnet</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50">
                  <h4 className="text-sm font-medium text-slate-600">Environment</h4>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Audit Trail Tab */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <select
                  value={auditFilter.entityType}
                  onChange={(e) => setAuditFilter((f) => ({ ...f, entityType: e.target.value }))}
                  className="h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">All Entity Types</option>
                  <option value="client">Clients</option>
                  <option value="engagement">Engagements</option>
                  <option value="artifact">Artifacts</option>
                  <option value="station_run">Station Runs</option>
                </select>
                <select
                  value={auditFilter.action}
                  onChange={(e) => setAuditFilter((f) => ({ ...f, action: e.target.value }))}
                  className="h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">All Actions</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                  <option value="approve">Approve</option>
                  <option value="reject">Reject</option>
                  <option value="run">Run</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAuditLogs}
                  disabled={auditLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${auditLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Audit Log List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-teal-600" />
                Activity Log
              </CardTitle>
              <CardDescription>
                {auditLogs.length} events recorded
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                </div>
              ) : auditLogs.length > 0 ? (
                <div className="space-y-3">
                  {auditLogs.map((log) => {
                    const Icon = entityIcons[log.entity_type] || FileText
                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                          <Icon className="h-5 w-5 text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                              actionColors[log.action] || 'bg-slate-100 text-slate-700'
                            }`}>
                              {log.action}
                            </span>
                            <span className="text-sm font-medium text-slate-900 capitalize">
                              {log.entity_type.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">
                            by {log.user?.full_name || log.user?.email || 'Unknown user'}
                          </p>
                          {log.details && Object.keys(log.details).length > 0 && (
                            <div className="mt-2 text-xs text-slate-400">
                              {JSON.stringify(log.details).substring(0, 100)}
                              {JSON.stringify(log.details).length > 100 && '...'}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No activity recorded yet</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Actions will appear here as you use the system
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

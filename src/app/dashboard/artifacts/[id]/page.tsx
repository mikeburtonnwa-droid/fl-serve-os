'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  FileText,
  Save,
  Edit3,
  X,
  Loader2,
  Building2,
  Calendar,
  History,
  CheckCircle2,
  Clock,
  Send,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { getTemplate, type Template, type TemplateField } from '@/lib/templates'
import { PDFExportButton } from '@/components/artifacts/pdf-export-button'

interface Artifact {
  id: string
  name: string
  template_id: string
  content: Record<string, unknown>
  sensitivity_tier: 'T1' | 'T2' | 'T3'
  status: string
  version: number
  created_at: string
  updated_at: string
  engagement: {
    id: string
    name: string
    pathway: string
    client: { id: string; name: string }
  }
}

const statusConfig: Record<string, { label: string; color: 'default' | 'success' | 'warning' | 'destructive' }> = {
  draft: { label: 'Draft', color: 'default' },
  pending_review: { label: 'Pending Review', color: 'warning' },
  approved: { label: 'Approved', color: 'success' },
  rejected: { label: 'Rejected', color: 'destructive' },
  archived: { label: 'Archived', color: 'default' },
}

export default function ArtifactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [artifact, setArtifact] = useState<Artifact | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editedContent, setEditedContent] = useState<Record<string, unknown>>({})
  const [editedName, setEditedName] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchData = async () => {
    const id = params.id as string

    const { data, error } = await supabase
      .from('artifacts')
      .select(`
        *,
        engagement:engagements(id, name, pathway, client:clients(id, name))
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      router.push('/dashboard/artifacts')
      return
    }

    setArtifact(data)
    setEditedContent(data.content || {})
    setEditedName(data.name)

    const tmpl = getTemplate(data.template_id)
    setTemplate(tmpl || null)

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const handleFieldChange = (fieldId: string, value: unknown) => {
    setEditedContent((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleSave = async () => {
    if (!artifact) return

    setSaving(true)
    try {
      const response = await fetch(`/api/artifacts/${artifact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editedName,
          content: editedContent,
        }),
      })

      if (response.ok) {
        await fetchData()
        setEditing(false)
      }
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitForReview = async () => {
    if (!artifact) return

    setSaving(true)
    try {
      const response = await fetch(`/api/artifacts/${artifact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'pending_review',
        }),
      })

      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Submit for review failed:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async () => {
    if (!artifact) return

    setSaving(true)
    try {
      const response = await fetch(`/api/artifacts/${artifact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
        }),
      })

      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Approval failed:', error)
    } finally {
      setSaving(false)
    }
  }

  const renderField = (field: TemplateField, readonly: boolean) => {
    const value = editing ? editedContent[field.id] : artifact?.content?.[field.id]

    if (readonly) {
      // Display mode
      if (field.type === 'checkbox') {
        return (
          <span className={value ? 'text-green-600' : 'text-slate-400'}>
            {value ? 'Yes' : 'No'}
          </span>
        )
      }
      if (field.type === 'multiselect' && Array.isArray(value)) {
        return (
          <div className="flex flex-wrap gap-1">
            {value.map((v) => (
              <Badge key={v} variant="default" size="sm">
                {v}
              </Badge>
            ))}
          </div>
        )
      }
      return (
        <p className="text-slate-900 whitespace-pre-wrap">
          {String(value || '-')}
        </p>
      )
    }

    // Edit mode
    switch (field.type) {
      case 'text':
        return (
          <Input
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        )
      case 'textarea':
      case 'rich_text':
        return (
          <textarea
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y"
          />
        )
      case 'number':
        return (
          <Input
            type="number"
            value={(value as number) || ''}
            onChange={(e) => handleFieldChange(field.id, parseFloat(e.target.value) || 0)}
            placeholder={field.placeholder}
          />
        )
      case 'select':
        return (
          <select
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
          >
            <option value="">Select an option...</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )
      case 'multiselect':
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => {
              const selected = Array.isArray(value) && value.includes(opt)
              return (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => {
                      const current = Array.isArray(value) ? value : []
                      if (e.target.checked) {
                        handleFieldChange(field.id, [...current, opt])
                      } else {
                        handleFieldChange(field.id, current.filter((v) => v !== opt))
                      }
                    }}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-slate-700">{opt}</span>
                </label>
              )
            })}
          </div>
        )
      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-slate-700">{field.helpText}</span>
          </label>
        )
      default:
        return (
          <Input
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        )
    }
  }

  // Group fields by section
  const groupedFields = template?.fields.reduce((acc, field) => {
    const section = field.section || 'General'
    if (!acc[section]) acc[section] = []
    acc[section].push(field)
    return acc
  }, {} as Record<string, TemplateField[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (!artifact) return null

  const status = statusConfig[artifact.status] || statusConfig.draft

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/artifacts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-teal-600" />
              {editing ? (
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-xl font-semibold h-auto py-1"
                />
              ) : (
                <h1 className="text-2xl font-semibold text-slate-900">{artifact.name}</h1>
              )}
              <Badge variant={status.color}>{status.label}</Badge>
              <Badge variant={artifact.sensitivity_tier === 'T1' ? 'default' : 'warning'}>
                {artifact.sensitivity_tier}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1 text-slate-500">
              <span className="text-xs text-teal-600 font-medium">{artifact.template_id}</span>
              <span>•</span>
              <Building2 className="h-4 w-4" />
              <Link
                href={`/dashboard/engagements/${artifact.engagement?.id}`}
                className="hover:text-teal-600"
              >
                {artifact.engagement?.name}
              </Link>
              <span>•</span>
              <span>{artifact.engagement?.client?.name}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              {/* PDF Export - available for all statuses */}
              <PDFExportButton
                artifactId={artifact.id}
                artifactName={artifact.name}
                variant="outline"
                showSettings={true}
              />

              {artifact.status === 'draft' && (
                <>
                  <Button variant="outline" onClick={() => setEditing(true)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  {artifact.sensitivity_tier !== 'T1' && (
                    <Button
                      onClick={handleSubmitForReview}
                      disabled={saving}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit for Review
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}
              {artifact.status === 'pending_review' && (
                <Button
                  onClick={handleApprove}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <History className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">v{artifact.version}</p>
                <p className="text-sm text-slate-500">Version</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-100">
                <Calendar className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {format(new Date(artifact.created_at), 'MMM d, yyyy')}
                </p>
                <p className="text-sm text-slate-500">Created</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {format(new Date(artifact.updated_at), 'MMM d, yyyy')}
                </p>
                <p className="text-sm text-slate-500">Last Updated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{template?.name || artifact.template_id}</p>
                <p className="text-sm text-slate-500">Template</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      {template && groupedFields ? (
        Object.entries(groupedFields).map(([section, fields]) => (
          <Card key={section}>
            <CardHeader>
              <CardTitle>{section}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderField(field, !editing)}
                  {field.helpText && field.type !== 'checkbox' && !editing && (
                    <p className="mt-1 text-xs text-slate-500">{field.helpText}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-50 rounded-lg p-4 text-sm overflow-auto">
              {JSON.stringify(artifact.content, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

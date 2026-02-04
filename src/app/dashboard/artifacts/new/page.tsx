'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Loader2, FileText, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { TEMPLATES, getTemplate, type Template, type TemplateField } from '@/lib/templates'

interface Engagement {
  id: string
  name: string
  pathway: string
  client: { id: string; name: string }
}

export default function NewArtifactPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const engagementId = searchParams.get('engagement')
  const templateId = searchParams.get('template')

  const [engagement, setEngagement] = useState<Engagement | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [artifactName, setArtifactName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchData = async () => {
      if (!engagementId) {
        setLoading(false)
        return
      }

      const { data: engData, error: engError } = await supabase
        .from('engagements')
        .select('id, name, pathway, client:clients(id, name)')
        .eq('id', engagementId)
        .single()

      if (!engError && engData) {
        // Handle the client data - Supabase returns it as an object when using single()
        const clientData = engData.client as unknown as { id: string; name: string } | null
        const formattedEngagement: Engagement = {
          id: engData.id,
          name: engData.name,
          pathway: engData.pathway,
          client: clientData || { id: '', name: '' },
        }
        setEngagement(formattedEngagement)

        if (templateId) {
          const template = getTemplate(templateId)
          if (template) {
            setSelectedTemplate(template)
            setArtifactName(`${template.name} - ${clientData?.name || 'New'}`)
          }
        }
      }

      setLoading(false)
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId, templateId])

  const handleFieldChange = (fieldId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTemplate || !engagement) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engagementId: engagement.id,
          templateId: selectedTemplate.id,
          name: artifactName,
          content: formData,
          sensitivityTier: selectedTemplate.sensitivityTier,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create artifact')
      }

      router.push(`/dashboard/engagements/${engagement.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const renderField = (field: TemplateField) => {
    const value = formData[field.id] || ''

    switch (field.type) {
      case 'text':
        return (
          <Input
            id={field.id}
            value={value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        )
      case 'textarea':
      case 'rich_text':
        return (
          <textarea
            id={field.id}
            value={value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y"
          />
        )
      case 'number':
        return (
          <Input
            id={field.id}
            type="number"
            value={value as number}
            onChange={(e) => handleFieldChange(field.id, parseFloat(e.target.value) || 0)}
            placeholder={field.placeholder}
            required={field.required}
          />
        )
      case 'date':
        return (
          <Input
            id={field.id}
            type="date"
            value={value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
          />
        )
      case 'select':
        return (
          <select
            id={field.id}
            value={value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
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
            id={field.id}
            value={value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        )
    }
  }

  // Group fields by section
  const groupedFields = selectedTemplate?.fields.reduce((acc, field) => {
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

  // Template selection view
  if (!selectedTemplate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={engagementId ? `/dashboard/engagements/${engagementId}` : '/dashboard/artifacts'}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Create New Artifact</h1>
            <p className="text-slate-500">Select a template to get started</p>
          </div>
        </div>

        {!engagement && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">No engagement selected</p>
                  <p className="text-sm text-amber-700">
                    Go to an engagement and click &quot;New Artifact&quot; to create an artifact for that engagement.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                engagement ? 'hover:border-teal-300' : 'opacity-50 cursor-not-allowed'
              }`}
              onClick={() => engagement && router.push(`?engagement=${engagementId}&template=${template.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-teal-600" />
                    <span className="text-xs font-medium text-teal-600">{template.code}</span>
                  </div>
                  <Badge variant={template.sensitivityTier === 'T1' ? 'default' : 'warning'} size="sm">
                    {template.sensitivityTier}
                  </Badge>
                </div>
                <CardTitle className="text-base">{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{template.fields.length} fields</span>
                  <span>•</span>
                  <span className="capitalize">{template.category}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Form view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/engagements/${engagementId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">
                {selectedTemplate.code}: {selectedTemplate.name}
              </h1>
              <Badge variant={selectedTemplate.sensitivityTier === 'T1' ? 'default' : 'warning'}>
                {selectedTemplate.sensitivityTier}
              </Badge>
            </div>
            <p className="text-slate-500">
              {engagement?.client?.name} • {engagement?.name}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Artifact Name */}
        <Card>
          <CardHeader>
            <CardTitle>Artifact Name</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={artifactName}
              onChange={(e) => setArtifactName(e.target.value)}
              placeholder="Enter a name for this artifact"
              required
            />
          </CardContent>
        </Card>

        {/* Template Fields by Section */}
        {groupedFields &&
          Object.entries(groupedFields).map(([section, fields]) => (
            <Card key={section}>
              <CardHeader>
                <CardTitle>{section}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field) => (
                  <div key={field.id}>
                    <label
                      htmlFor={field.id}
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderField(field)}
                    {field.helpText && field.type !== 'checkbox' && (
                      <p className="mt-1 text-xs text-slate-500">{field.helpText}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link href={`/dashboard/engagements/${engagementId}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Artifact
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

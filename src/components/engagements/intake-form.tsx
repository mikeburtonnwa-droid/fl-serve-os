'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
interface ClientOption {
  id: string
  name: string
}

interface IntakeFormProps {
  clients: ClientOption[]
}

// SERVE OS Lite Intake Assessment - 7 vectors from Client_Intake_Checklist
const intakeVectors = [
  {
    id: 'existing_docs',
    name: 'Existing Documentation',
    question: 'Does the client have existing process documentation or SOPs?',
    options: [
      { value: 0, label: 'No documentation exists' },
      { value: 1, label: 'Minimal/outdated documentation' },
      { value: 2, label: 'Partial documentation, some gaps' },
      { value: 3, label: 'Comprehensive, current documentation' },
    ],
  },
  {
    id: 'tech_maturity',
    name: 'Technology Maturity',
    question: 'What is the client\'s current technology stack maturity?',
    options: [
      { value: 0, label: 'Legacy systems, minimal integration' },
      { value: 1, label: 'Mix of legacy and modern, limited APIs' },
      { value: 2, label: 'Modern stack with some API capabilities' },
      { value: 3, label: 'Cloud-native, API-first architecture' },
    ],
  },
  {
    id: 'data_readiness',
    name: 'Data Readiness',
    question: 'How organized and accessible is the client\'s data?',
    options: [
      { value: 0, label: 'Siloed, inconsistent data across systems' },
      { value: 1, label: 'Some centralization, quality issues' },
      { value: 2, label: 'Mostly centralized, good quality' },
      { value: 3, label: 'Well-governed, high-quality data lake/warehouse' },
    ],
  },
  {
    id: 'change_readiness',
    name: 'Change Readiness',
    question: 'How receptive is the organization to process changes?',
    options: [
      { value: 0, label: 'Resistant to change, no executive buy-in' },
      { value: 1, label: 'Some resistance, limited sponsorship' },
      { value: 2, label: 'Generally receptive, executive interest' },
      { value: 3, label: 'Change-ready culture, strong executive sponsorship' },
    ],
  },
  {
    id: 'ai_experience',
    name: 'AI Experience',
    question: 'What is the client\'s experience with AI/automation?',
    options: [
      { value: 0, label: 'No AI/automation experience' },
      { value: 1, label: 'Basic automation (RPA, simple rules)' },
      { value: 2, label: 'Some ML/AI pilots or production use' },
      { value: 3, label: 'Mature AI practice with governance' },
    ],
  },
  {
    id: 'process_complexity',
    name: 'Process Complexity',
    question: 'How complex are the target workflows?',
    options: [
      { value: 0, label: 'Simple, linear processes' },
      { value: 1, label: 'Moderate complexity, some branching' },
      { value: 2, label: 'Complex, multi-department workflows' },
      { value: 3, label: 'Highly complex, regulatory requirements' },
    ],
  },
  {
    id: 'timeline_urgency',
    name: 'Timeline & Urgency',
    question: 'What is the client\'s timeline expectation?',
    options: [
      { value: 0, label: 'Exploratory, no fixed timeline' },
      { value: 1, label: 'Flexible, within 6 months' },
      { value: 2, label: 'Defined project, 3-6 months' },
      { value: 3, label: 'Urgent, results needed within 3 months' },
    ],
  },
]

function getPathwayFromScore(score: number): { pathway: string; label: string; description: string } {
  if (score <= 7) {
    return {
      pathway: 'knowledge_spine',
      label: 'Knowledge Spine',
      description: 'Focus on building foundational documentation and process mapping before AI implementation.',
    }
  } else if (score <= 14) {
    return {
      pathway: 'roi_audit',
      label: 'ROI Audit',
      description: 'Conduct thorough analysis of automation opportunities and build business case for AI investment.',
    }
  } else {
    return {
      pathway: 'workflow_sprint',
      label: 'Workflow Sprint',
      description: 'Ready for rapid AI workflow implementation with existing infrastructure and change readiness.',
    }
  }
}

export function IntakeForm({ clients }: IntakeFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(0) // 0 = basics, 1-7 = vectors, 8 = review
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    client_id: '',
    name: '',
    notes: '',
    start_date: new Date().toISOString().split('T')[0],
  })

  const [scores, setScores] = useState<Record<string, number>>({})

  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0)
  const pathwayInfo = getPathwayFromScore(totalScore)

  const handleBasicsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.client_id && formData.name) {
      setStep(1)
    }
  }

  const handleVectorSelect = (vectorId: string, value: number) => {
    setScores({ ...scores, [vectorId]: value })
    // Advance to next step (step 8 is the review screen)
    setStep(step + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/engagements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          intake_score: totalScore,
          pathway: pathwayInfo.pathway,
          status: 'intake',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create engagement')
      }

      router.push(`/dashboard/engagements/${data.engagement.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  // Step 0: Basic information
  if (step === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/engagements">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">New Engagement</h1>
            <p className="text-slate-500">Complete the intake assessment to determine the best pathway</p>
          </div>
        </div>

        <form onSubmit={handleBasicsSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Engagement Details</CardTitle>
              <CardDescription>Basic information about this engagement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Client <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {clients.length === 0 && (
                  <p className="text-sm text-amber-600">
                    No clients yet.{' '}
                    <Link href="/dashboard/clients/new" className="underline">
                      Create a client first
                    </Link>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Engagement Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Q1 2026 AI Implementation"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Start Date</label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Initial notes about this engagement..."
                  className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end mt-6">
            <Button type="submit" disabled={!formData.client_id || !formData.name}>
              Start Assessment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    )
  }

  // Steps 1-7: Intake vectors
  if (step >= 1 && step <= intakeVectors.length) {
    const currentVector = intakeVectors[step - 1]
    const progress = ((step - 1) / intakeVectors.length) * 100

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setStep(step - 1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                Assessment Progress
              </span>
              <span className="text-sm text-slate-500">
                {step} of {intakeVectors.length}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="text-sm font-medium text-teal-600 uppercase tracking-wide mb-1">
              {currentVector.name}
            </div>
            <CardTitle className="text-xl">{currentVector.question}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentVector.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleVectorSelect(currentVector.id, option.value)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    scores[currentVector.id] === option.value
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-900">{option.label}</span>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      {option.value} pts
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 8: Review and submit
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setStep(intakeVectors.length)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Assessment Complete</h1>
          <p className="text-slate-500">Review the results and create the engagement</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recommended Pathway</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 rounded-lg bg-teal-50 border border-teal-200">
            <CheckCircle2 className="h-8 w-8 text-teal-600 flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-teal-900">
                  {pathwayInfo.label}
                </span>
                <span className="text-sm font-medium text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                  Score: {totalScore}/21
                </span>
              </div>
              <p className="text-sm text-teal-700 mt-1">{pathwayInfo.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assessment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {intakeVectors.map((vector) => {
              const score = scores[vector.id] ?? 0
              const option = vector.options.find((o) => o.value === score)
              return (
                <div
                  key={vector.id}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{vector.name}</p>
                    <p className="text-xs text-slate-500">{option?.label}</p>
                  </div>
                  <span className="text-sm font-medium text-slate-600">{score}/3</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Engagement Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Client</dt>
              <dd className="text-sm font-medium text-slate-900">
                {clients.find((c) => c.id === formData.client_id)?.name}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Engagement Name</dt>
              <dd className="text-sm font-medium text-slate-900">{formData.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Start Date</dt>
              <dd className="text-sm font-medium text-slate-900">{formData.start_date}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep(0)}>
          Edit Details
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Engagement
        </Button>
      </div>
    </div>
  )
}

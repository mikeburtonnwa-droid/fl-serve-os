/**
 * Intake Assessment Page
 *
 * Conduct and manage intake assessments for engagements.
 *
 * User Stories: US-028, US-029, US-030
 */

'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react'
import { IntakeWizard } from '@/components/intake'
import type { IntakeAnswer } from '@/lib/intake'

interface IntakePageProps {
  params: Promise<{ id: string }>
}

interface AssessmentData {
  id?: string
  answers: IntakeAnswer[]
  status: 'in_progress' | 'completed' | 'reviewed'
  pathway_override?: string
  override_justification?: string
  override_at?: string
}

export default function IntakePage({ params }: IntakePageProps) {
  const { id: engagementId } = use(params)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [engagement, setEngagement] = useState<{ id: string; name: string } | null>(null)
  const [assessment, setAssessment] = useState<AssessmentData | null>(null)

  // Fetch assessment data
  const fetchData = useCallback(async () => {
    try {
      // Fetch engagement details
      const engResponse = await fetch(`/api/engagements/${engagementId}`)
      const engData = await engResponse.json()

      if (!engData.success) {
        throw new Error(engData.error || 'Failed to fetch engagement')
      }

      setEngagement({
        id: engData.engagement.id,
        name: engData.engagement.name,
      })

      // Fetch assessment
      const assessmentResponse = await fetch(`/api/engagements/${engagementId}/intake`)
      const assessmentData = await assessmentResponse.json()

      if (assessmentData.success && assessmentData.assessment) {
        setAssessment({
          id: assessmentData.assessment.id,
          answers: assessmentData.assessment.answers || [],
          status: assessmentData.assessment.status || 'in_progress',
          pathway_override: assessmentData.assessment.pathway_override,
          override_justification: assessmentData.assessment.override_justification,
          override_at: assessmentData.assessment.override_at,
        })
      } else {
        // No assessment yet, start fresh
        setAssessment({
          answers: [],
          status: 'in_progress',
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assessment')
    } finally {
      setLoading(false)
    }
  }, [engagementId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Save assessment
  const handleSave = async (answers: IntakeAnswer[], status: string) => {
    const response = await fetch(`/api/engagements/${engagementId}/intake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, status }),
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || 'Failed to save assessment')
    }

    setAssessment((prev) => ({
      ...prev!,
      id: data.assessment.id,
      answers,
      status: status as 'in_progress' | 'completed' | 'reviewed',
    }))
  }

  // Override pathway
  const handleOverride = async (pathway: string, justification: string) => {
    const response = await fetch(`/api/engagements/${engagementId}/intake`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathway, justification }),
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || 'Failed to override pathway')
    }

    setAssessment((prev) => ({
      ...prev!,
      pathway_override: pathway,
      override_justification: justification,
      override_at: new Date().toISOString(),
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <div>
                <p className="font-medium">Error loading assessment</p>
                <p className="text-sm text-red-500">{error}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const existingOverride = assessment?.pathway_override
    ? {
        pathway: assessment.pathway_override as 'accelerated' | 'standard' | 'extended',
        justification: assessment.override_justification || '',
        overrideAt: assessment.override_at || new Date().toISOString(),
      }
    : undefined

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/engagements/${engagementId}`)}
          className="gap-2 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {engagement?.name || 'Engagement'}
        </Button>
      </div>

      {/* Wizard */}
      {assessment && (
        <IntakeWizard
          engagementId={engagementId}
          initialAnswers={assessment.answers}
          initialStatus={assessment.status}
          existingOverride={existingOverride}
          onSave={handleSave}
          onOverride={handleOverride}
        />
      )}
    </div>
  )
}

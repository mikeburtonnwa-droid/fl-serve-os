/**
 * ROI Calculator Page (F6.1-F6.5)
 *
 * Interactive ROI modeling for engagements.
 *
 * User Stories: US-024, US-025, US-026, US-027
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calculator, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { ROICalculator } from '@/components/roi'

interface Engagement {
  id: string
  name: string
  pathway: string
  client: {
    id: string
    name: string
  }
}

export default function ROICalculatorPage() {
  const params = useParams()
  const router = useRouter()
  const [engagement, setEngagement] = useState<Engagement | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchEngagement = async () => {
      const { data, error } = await supabase
        .from('engagements')
        .select(
          `
          id,
          name,
          pathway,
          client:clients(id, name)
        `
        )
        .eq('id', params.id)
        .single()

      if (error || !data) {
        router.push('/dashboard/engagements')
        return
      }

      // Handle the nested client relationship
      const clientData = Array.isArray(data.client) ? data.client[0] : data.client
      setEngagement({
        id: data.id,
        name: data.name,
        pathway: data.pathway,
        client: {
          id: clientData?.id || '',
          name: clientData?.name || '',
        },
      })
      setLoading(false)
    }

    fetchEngagement()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!engagement) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/engagements/${engagement.id}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Engagement
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Calculator className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                ROI Calculator
              </h1>
              <p className="text-slate-500">
                {engagement.client.name} • {engagement.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Calculator */}
      <ROICalculator engagementId={engagement.id} />
    </div>
  )
}

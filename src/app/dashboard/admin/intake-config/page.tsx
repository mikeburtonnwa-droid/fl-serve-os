/**
 * Admin Intake Configuration Page (F7.4)
 *
 * Configure question and category weights for intake assessments.
 *
 * User Stories: US-030
 */

'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { WeightConfiguration } from '@/components/intake'

export default function IntakeConfigPage() {
  const router = useRouter()

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/admin')}
          className="gap-2 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Button>
      </div>

      <WeightConfiguration />
    </div>
  )
}

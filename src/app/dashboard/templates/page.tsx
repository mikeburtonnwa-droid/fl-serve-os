/**
 * Template Library Page (F8.1)
 *
 * Browse and use example templates.
 *
 * User Stories: US-031, US-032
 */

'use client'

import { useRouter } from 'next/navigation'
import { TemplateLibrary } from '@/components/templates'

export default function TemplatesPage() {
  const router = useRouter()

  const handleArtifactCreated = (artifactId: string) => {
    // Navigate to the new artifact
    router.push(`/dashboard/artifacts/${artifactId}`)
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <TemplateLibrary onArtifactCreated={handleArtifactCreated} />
    </div>
  )
}

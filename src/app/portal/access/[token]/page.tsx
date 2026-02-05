/**
 * Portal Access Page (F10.2)
 *
 * Client-facing portal page accessed via magic link token.
 *
 * User Stories: US-037
 */

import { Suspense } from 'react'
import { PortalContent } from './portal-content'
import { Loader2 } from 'lucide-react'

interface PortalAccessPageProps {
  params: Promise<{ token: string }>
}

export default async function PortalAccessPage({ params }: PortalAccessPageProps) {
  const { token } = await params

  return (
    <div className="min-h-screen bg-slate-50">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-slate-600">Loading your portal...</p>
            </div>
          </div>
        }
      >
        <PortalContent token={token} />
      </Suspense>
    </div>
  )
}

export const metadata = {
  title: 'Client Portal | SERVE OS',
  description: 'Access your engagement details and deliverables',
}

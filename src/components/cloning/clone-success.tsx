/**
 * Clone Success Component (F9.1)
 *
 * Displays clone success message with summary and navigation options.
 *
 * User Stories: US-033
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  X,
} from 'lucide-react'
import Link from 'next/link'
import type { CloneResult } from '@/lib/cloning'

interface CloneSuccessProps {
  result: CloneResult
  onClose: () => void
}

export function CloneSuccess({ result, onClose }: CloneSuccessProps) {
  const { summary } = result

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Engagement Cloned!</CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Successfully created &quot;{result.newEngagementName}&quot;
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-700">
                {summary.artifactsCloned}
              </div>
              <div className="text-sm text-green-600">Artifacts Cloned</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-700">
                {summary.fieldsCleared}
              </div>
              <div className="text-sm text-blue-600">Fields Cleared</div>
            </div>
          </div>

          {/* Detailed Summary */}
          <div className="space-y-3">
            {summary.artifactsSkipped > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Artifacts skipped</span>
                <Badge variant="warning">{summary.artifactsSkipped}</Badge>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Fields preserved</span>
              <Badge variant="default">{summary.fieldsPreserved}</Badge>
            </div>
          </div>

          {/* Cleared Fields List */}
          {summary.clearedFields.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-800 mb-2">
                <AlertTriangle className="h-4 w-4" />
                Client fields cleared:
              </div>
              <div className="flex flex-wrap gap-1">
                {summary.clearedFields.slice(0, 10).map((field) => (
                  <Badge key={field} variant="default" size="sm">
                    {field}
                  </Badge>
                ))}
                {summary.clearedFields.length > 10 && (
                  <Badge variant="default" size="sm">
                    +{summary.clearedFields.length - 10} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Warnings */}
          {summary.warnings.length > 0 && (
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="text-sm font-medium text-red-800 mb-2">
                Warnings:
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                {summary.warnings.map((warning, i) => (
                  <li key={i}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Link href={`/dashboard/engagements/${result.newEngagementId}`} className="flex-1">
              <Button className="w-full">
                Go to Engagement
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

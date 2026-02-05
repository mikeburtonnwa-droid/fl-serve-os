/**
 * Artifact Selector Component for Clone Wizard (F9.2)
 *
 * Allows selective inclusion of artifacts in the clone.
 *
 * User Stories: US-033
 */

'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { CloneableArtifact } from '@/lib/cloning'

interface ArtifactSelectorProps {
  artifacts: CloneableArtifact[]
  onSelectionChange: (artifacts: CloneableArtifact[]) => void
}

export function ArtifactSelector({
  artifacts,
  onSelectionChange,
}: ArtifactSelectorProps) {
  const [expandedArtifact, setExpandedArtifact] = useState<string | null>(null)

  const selectedCount = artifacts.filter((a) => a.selected).length
  const hasClientDataCount = artifacts.filter((a) => a.hasClientData).length

  const toggleArtifact = (artifactId: string) => {
    const updated = artifacts.map((a) =>
      a.id === artifactId ? { ...a, selected: !a.selected } : a
    )
    onSelectionChange(updated)
  }

  const selectAll = () => {
    const updated = artifacts.map((a) => ({ ...a, selected: true }))
    onSelectionChange(updated)
  }

  const selectNone = () => {
    const updated = artifacts.map((a) => ({ ...a, selected: false }))
    onSelectionChange(updated)
  }

  const selectWithoutClientData = () => {
    const updated = artifacts.map((a) => ({
      ...a,
      selected: !a.hasClientData,
    }))
    onSelectionChange(updated)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
      draft: 'default',
      review: 'warning',
      approved: 'success',
      final: 'info',
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          {selectedCount} of {artifacts.length} artifacts selected
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="ghost" size="sm" onClick={selectNone}>
            Select None
          </Button>
          {hasClientDataCount > 0 && (
            <Button variant="outline" size="sm" onClick={selectWithoutClientData}>
              Exclude Client Data
            </Button>
          )}
        </div>
      </div>

      {/* Warning Banner */}
      {hasClientDataCount > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {hasClientDataCount} artifact(s) contain client-specific data
            </p>
            <p className="text-sm text-amber-700">
              These fields will be cleared when cloning if &quot;Clear client fields&quot; is enabled.
            </p>
          </div>
        </div>
      )}

      {/* Artifact List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {artifacts.map((artifact) => (
          <Card
            key={artifact.id}
            className={`transition-all ${
              artifact.selected
                ? 'border-blue-300 bg-blue-50/50'
                : 'hover:border-slate-300'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => toggleArtifact(artifact.id)}
                  className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    artifact.selected
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-slate-300 hover:border-blue-400'
                  }`}
                >
                  {artifact.selected && <Check className="h-3 w-3 text-white" />}
                </button>

                {/* Artifact Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-900 truncate">
                      {artifact.name}
                    </span>
                    {getStatusBadge(artifact.status)}
                    {artifact.hasClientData && (
                      <Badge variant="warning" size="sm">
                        Client Data
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm text-slate-500 mt-1">
                    Type: {artifact.type} • Created:{' '}
                    {new Date(artifact.createdAt).toLocaleDateString()}
                  </div>

                  {/* Client Data Fields (Expandable) */}
                  {artifact.hasClientData &&
                    artifact.clientDataFields &&
                    artifact.clientDataFields.length > 0 && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedArtifact(
                              expandedArtifact === artifact.id ? null : artifact.id
                            )
                          }
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          {expandedArtifact === artifact.id ? (
                            <>
                              <ChevronUp className="h-4 w-4" />
                              Hide fields
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" />
                              Show {artifact.clientDataFields.length} client fields
                            </>
                          )}
                        </button>

                        {expandedArtifact === artifact.id && (
                          <div className="mt-2 p-2 bg-amber-50 rounded text-sm">
                            <p className="text-amber-800 font-medium mb-1">
                              Fields containing client data:
                            </p>
                            <ul className="list-disc list-inside text-amber-700">
                              {artifact.clientDataFields.map((field) => (
                                <li key={field}>{field}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {artifacts.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          No artifacts available to clone.
        </div>
      )}
    </div>
  )
}

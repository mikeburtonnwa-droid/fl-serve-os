/**
 * Lineage Tree Component (F9.4)
 *
 * Visualizes clone relationships between engagements.
 *
 * User Stories: US-033
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  GitBranch,
  ArrowUp,
  ArrowDown,
  Building,
  Calendar,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'

interface LineageNode {
  engagementId: string
  engagementName: string
  clientName: string
  clonedAt: string | null
  relationship: 'parent' | 'self' | 'child'
  summary?: {
    artifactsCloned?: number
    fieldsCleared?: number
  }
}

interface LineageStats {
  isCloned: boolean
  cloneCount: number
  totalInLineage: number
}

interface LineageTreeProps {
  engagementId: string
  compact?: boolean
}

export function LineageTree({ engagementId, compact = false }: LineageTreeProps) {
  const [lineage, setLineage] = useState<LineageNode[]>([])
  const [stats, setStats] = useState<LineageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLineage = async () => {
      try {
        const response = await fetch(`/api/engagements/${engagementId}/lineage`)
        const data = await response.json()

        if (data.success) {
          setLineage(data.lineage)
          setStats(data.stats)
        } else {
          setError(data.error)
        }
      } catch {
        setError('Failed to load lineage')
      } finally {
        setLoading(false)
      }
    }

    fetchLineage()
  }, [engagementId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-red-500 py-2">{error}</div>
    )
  }

  // No lineage (not cloned and no clones)
  if (!stats?.isCloned && stats?.cloneCount === 0) {
    if (compact) return null
    return (
      <div className="text-sm text-slate-500 py-2">
        No clone relationships for this engagement.
      </div>
    )
  }

  const parentNode = lineage.find((n) => n.relationship === 'parent')
  const selfNode = lineage.find((n) => n.relationship === 'self')
  const childNodes = lineage.filter((n) => n.relationship === 'child')

  // Compact view for engagement detail page
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <GitBranch className="h-4 w-4 text-slate-400" />
        {stats?.isCloned && (
          <Badge variant="info" size="sm">
            Cloned
          </Badge>
        )}
        {stats?.cloneCount && stats.cloneCount > 0 && (
          <Badge variant="default" size="sm">
            {stats.cloneCount} clone(s)
          </Badge>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="h-5 w-5" />
            Clone Lineage
          </CardTitle>
          <Badge variant="default">
            {stats?.totalInLineage} in lineage
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Parent (if cloned from) */}
        {parentNode && (
          <div className="relative">
            <div className="flex items-center gap-2 mb-2 text-sm text-slate-500">
              <ArrowUp className="h-4 w-4" />
              Cloned from
            </div>
            <LineageNodeCard node={parentNode} currentId={engagementId} />
            <div className="absolute left-6 top-full h-4 w-px bg-slate-200" />
          </div>
        )}

        {/* Self */}
        {selfNode && (
          <div className="relative">
            {parentNode && (
              <div className="absolute left-6 bottom-full h-4 w-px bg-slate-200" />
            )}
            <LineageNodeCard node={selfNode} currentId={engagementId} isCurrent />
            {childNodes.length > 0 && (
              <div className="absolute left-6 top-full h-4 w-px bg-slate-200" />
            )}
          </div>
        )}

        {/* Children (cloned to) */}
        {childNodes.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm text-slate-500">
              <ArrowDown className="h-4 w-4" />
              Cloned to ({childNodes.length})
            </div>
            <div className="space-y-2">
              {childNodes.map((node) => (
                <LineageNodeCard
                  key={node.engagementId}
                  node={node}
                  currentId={engagementId}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Lineage Node Card Sub-component
// =============================================================================

interface LineageNodeCardProps {
  node: LineageNode
  currentId: string
  isCurrent?: boolean
}

function LineageNodeCard({ node, currentId, isCurrent }: LineageNodeCardProps) {
  const isClickable = node.engagementId !== currentId

  const content = (
    <div
      className={`p-3 rounded-lg border ${
        isCurrent
          ? 'border-blue-300 bg-blue-50'
          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      } ${isClickable ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium text-slate-900">{node.engagementName}</div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
            <Building className="h-3.5 w-3.5" />
            {node.clientName}
          </div>
          {node.clonedAt && (
            <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(node.clonedAt).toLocaleDateString()}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isCurrent && (
            <Badge variant="info" size="sm">
              Current
            </Badge>
          )}
          {node.summary?.artifactsCloned !== undefined && (
            <Badge variant="default" size="sm">
              {node.summary.artifactsCloned} artifacts
            </Badge>
          )}
          {isClickable && <ExternalLink className="h-4 w-4 text-slate-400" />}
        </div>
      </div>
    </div>
  )

  if (isClickable) {
    return (
      <Link href={`/dashboard/engagements/${node.engagementId}`}>{content}</Link>
    )
  }

  return content
}

// =============================================================================
// Compact Lineage Badge (for lists)
// =============================================================================

interface LineageBadgeProps {
  isCloned?: boolean
  cloneCount?: number
}

export function LineageBadge({ isCloned, cloneCount }: LineageBadgeProps) {
  if (!isCloned && !cloneCount) return null

  return (
    <div className="flex items-center gap-1">
      <GitBranch className="h-3.5 w-3.5 text-slate-400" />
      {isCloned && (
        <Badge variant="info" size="sm">
          Clone
        </Badge>
      )}
      {cloneCount && cloneCount > 0 && (
        <Badge variant="default" size="sm">
          {cloneCount}
        </Badge>
      )}
    </div>
  )
}

/**
 * Template Card Component
 *
 * Displays template preview in the library grid.
 *
 * User Stories: US-031
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileText,
  ClipboardCheck,
  BarChart,
  Presentation,
  Calendar,
  ListChecks,
  File,
  Star,
  Eye,
  Copy,
} from 'lucide-react'
import type { TemplateCategory } from '@/lib/template-library'

interface TemplateCardProps {
  id: string
  name: string
  description: string
  category: TemplateCategory
  tags: string[]
  usageCount: number
  rating?: number
  ratingCount?: number
  source: 'system' | 'user' | 'community'
  onView: (id: string) => void
  onUse: (id: string) => void
}

export function TemplateCard({
  id,
  name,
  description,
  category,
  tags,
  usageCount,
  rating,
  ratingCount,
  source,
  onView,
  onUse,
}: TemplateCardProps) {
  const getCategoryIcon = () => {
    const icons: Record<TemplateCategory, typeof FileText> = {
      assessment: ClipboardCheck,
      proposal: FileText,
      report: BarChart,
      presentation: Presentation,
      plan: Calendar,
      checklist: ListChecks,
      other: File,
    }
    const Icon = icons[category]
    return <Icon className="h-5 w-5" />
  }

  const getCategoryColor = () => {
    const colors: Record<TemplateCategory, string> = {
      assessment: 'bg-blue-100 text-blue-700',
      proposal: 'bg-purple-100 text-purple-700',
      report: 'bg-green-100 text-green-700',
      presentation: 'bg-orange-100 text-orange-700',
      plan: 'bg-cyan-100 text-cyan-700',
      checklist: 'bg-amber-100 text-amber-700',
      other: 'bg-slate-100 text-slate-700',
    }
    return colors[category]
  }

  const getSourceBadge = () => {
    if (source === 'system') {
      return (
        <Badge variant="info" size="sm">
          Official
        </Badge>
      )
    }
    if (source === 'community') {
      return (
        <Badge variant="success" size="sm">
          Community
        </Badge>
      )
    }
    return null
  }

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${getCategoryColor()}`}>
            {getCategoryIcon()}
          </div>
          {getSourceBadge()}
        </div>
        <CardTitle className="text-base mt-3 line-clamp-1">{name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600 line-clamp-2">{description}</p>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="default" size="sm" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="default" size="sm" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Copy className="h-3.5 w-3.5" />
              {usageCount}
            </span>
            {rating !== undefined && (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {rating.toFixed(1)}
                {ratingCount !== undefined && (
                  <span className="text-slate-400">({ratingCount})</span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onView(id)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={() => onUse(id)}
          >
            <Copy className="h-4 w-4 mr-1" />
            Use
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

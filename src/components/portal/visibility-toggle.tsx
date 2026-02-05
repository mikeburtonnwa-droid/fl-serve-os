/**
 * Visibility Toggle Component (F10.6)
 *
 * Toggle for controlling artifact visibility in client portal.
 *
 * User Stories: US-039
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
} from 'lucide-react'

interface VisibilityToggleProps {
  artifactId: string
  initialVisible: boolean
  onVisibilityChange?: (isVisible: boolean) => void
  disabled?: boolean
  showLabel?: boolean
}

export function VisibilityToggle({
  artifactId,
  initialVisible,
  onVisibilityChange,
  disabled = false,
  showLabel = true,
}: VisibilityToggleProps) {
  const [isVisible, setIsVisible] = useState(initialVisible)
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleToggle = async () => {
    // Show confirmation when making visible
    if (!isVisible && !showConfirm) {
      setShowConfirm(true)
      return
    }

    setLoading(true)
    setShowConfirm(false)

    try {
      const response = await fetch(`/api/artifacts/${artifactId}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isClientVisible: !isVisible }),
      })

      const data = await response.json()

      if (data.success) {
        setIsVisible(!isVisible)
        onVisibilityChange?.(!isVisible)
      }
    } catch (error) {
      console.error('Failed to update visibility:', error)
    } finally {
      setLoading(false)
    }
  }

  const cancelConfirm = () => {
    setShowConfirm(false)
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-sm text-amber-600">
          <AlertTriangle className="h-4 w-4" />
          Make visible to client?
        </div>
        <Button variant="ghost" size="sm" onClick={cancelConfirm}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={handleToggle}>
          Confirm
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className="text-sm text-slate-600">
          {isVisible ? 'Visible to client' : 'Hidden from client'}
        </span>
      )}

      <Button
        variant={isVisible ? 'outline' : 'ghost'}
        size="sm"
        onClick={handleToggle}
        disabled={disabled || loading}
        className={isVisible ? 'border-green-300 text-green-700 hover:bg-green-50' : ''}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isVisible ? (
          <>
            <Eye className="h-4 w-4 mr-1" />
            Visible
          </>
        ) : (
          <>
            <EyeOff className="h-4 w-4 mr-1" />
            Hidden
          </>
        )}
      </Button>
    </div>
  )
}

// =============================================================================
// Visibility Badge (for lists)
// =============================================================================

interface VisibilityBadgeProps {
  isVisible: boolean
}

export function VisibilityBadge({ isVisible }: VisibilityBadgeProps) {
  return (
    <Badge
      variant={isVisible ? 'success' : 'default'}
      size="sm"
      className="gap-1"
    >
      {isVisible ? (
        <>
          <Eye className="h-3 w-3" />
          Client Visible
        </>
      ) : (
        <>
          <EyeOff className="h-3 w-3" />
          Internal Only
        </>
      )}
    </Badge>
  )
}

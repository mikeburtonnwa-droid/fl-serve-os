'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  X,
  Sparkles,
  GraduationCap,
  Rocket,
  PartyPopper,
} from 'lucide-react'
import { WorkflowGuidance } from './workflow-guidance'

interface ChecklistItem {
  id: string
  title: string
  description: string
  tutorialId?: string
  action?: () => void
  href?: string
}

const ONBOARDING_ITEMS: ChecklistItem[] = [
  {
    id: 'view-framework',
    title: 'Learn the SERVE Framework',
    description: 'Understand the five phases of our methodology',
    tutorialId: 'getting-started',
  },
  {
    id: 'explore-pathways',
    title: 'Explore Service Pathways',
    description: 'Understand Knowledge Spine, ROI Audit, and Workflow Sprint',
    tutorialId: 'pathway-deep-dive',
  },
  {
    id: 'create-client',
    title: 'Create your first client',
    description: 'Add a client record to the system',
    href: '/dashboard/clients/new',
  },
  {
    id: 'start-engagement',
    title: 'Start an engagement',
    description: 'Complete the intake assessment and begin the workflow',
    href: '/dashboard/engagements/new',
  },
  {
    id: 'run-station',
    title: 'Run an AI Station',
    description: 'Execute your first AI-powered analysis',
  },
  {
    id: 'review-artifact',
    title: 'Review an artifact',
    description: 'Understand the artifact creation and review process',
  },
]

interface OnboardingChecklistProps {
  onDismiss?: () => void
  compact?: boolean
}

export function OnboardingChecklist({ onDismiss, compact = false }: OnboardingChecklistProps) {
  const [completedItems, setCompletedItems] = useState<string[]>([])
  const [isGuidanceOpen, setIsGuidanceOpen] = useState(false)
  const [activeTutorialId, setActiveTutorialId] = useState<string | undefined>()
  const [isDismissed, setIsDismissed] = useState(false)

  // Load state from localStorage
  useEffect(() => {
    const savedCompleted = localStorage.getItem('serve-os-onboarding-completed')
    const savedDismissed = localStorage.getItem('serve-os-onboarding-dismissed')

    if (savedCompleted) {
      setCompletedItems(JSON.parse(savedCompleted))
    }
    if (savedDismissed === 'true') {
      setIsDismissed(true)
    }
  }, [])

  const toggleItem = (itemId: string) => {
    const updated = completedItems.includes(itemId)
      ? completedItems.filter((id) => id !== itemId)
      : [...completedItems, itemId]

    setCompletedItems(updated)
    localStorage.setItem('serve-os-onboarding-completed', JSON.stringify(updated))
  }

  const handleItemClick = (item: ChecklistItem) => {
    if (item.tutorialId) {
      setActiveTutorialId(item.tutorialId)
      setIsGuidanceOpen(true)
    } else if (item.href) {
      // eslint-disable-next-line react-hooks/immutability
      window.location.href = item.href
    } else if (item.action) {
      item.action()
    }

    // Mark as complete when clicked
    if (!completedItems.includes(item.id)) {
      toggleItem(item.id)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('serve-os-onboarding-dismissed', 'true')
    onDismiss?.()
  }

  const progress = (completedItems.length / ONBOARDING_ITEMS.length) * 100
  const isComplete = completedItems.length === ONBOARDING_ITEMS.length

  if (isDismissed && !isComplete) {
    return null
  }

  if (compact) {
    return (
      <>
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border border-teal-200">
          <div className="p-2 bg-teal-100 rounded-lg">
            <GraduationCap className="h-4 w-4 text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900">
              Getting Started
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-200 rounded-full h-1.5 max-w-[100px]">
                <div
                  className="bg-teal-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-slate-500">
                {completedItems.length}/{ONBOARDING_ITEMS.length}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setIsGuidanceOpen(true)}
            className="bg-teal-600 hover:bg-teal-700"
          >
            Continue
          </Button>
        </div>

        <WorkflowGuidance
          isOpen={isGuidanceOpen}
          onClose={() => setIsGuidanceOpen(false)}
          initialTab="tutorials"
          initialTutorialId={activeTutorialId}
        />
      </>
    )
  }

  return (
    <>
      <Card className={isComplete ? 'bg-gradient-to-br from-green-50 to-teal-50 border-green-200' : 'bg-gradient-to-br from-teal-50 to-blue-50 border-teal-200'}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isComplete ? 'bg-green-100' : 'bg-teal-100'}`}>
                {isComplete ? (
                  <PartyPopper className="h-5 w-5 text-green-600" />
                ) : (
                  <Rocket className="h-5 w-5 text-teal-600" />
                )}
              </div>
              <div>
                <CardTitle className={isComplete ? 'text-green-900' : 'text-teal-900'}>
                  {isComplete ? 'Onboarding Complete!' : 'Getting Started with SERVE OS'}
                </CardTitle>
                <CardDescription className={isComplete ? 'text-green-600' : 'text-teal-600'}>
                  {isComplete
                    ? "You've completed all onboarding tasks. Great job!"
                    : `Complete these steps to master the workflow (${completedItems.length}/${ONBOARDING_ITEMS.length})`}
                </CardDescription>
              </div>
            </div>
            {!isComplete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className={`w-full rounded-full h-2 ${isComplete ? 'bg-green-200' : 'bg-slate-200'}`}>
              <div
                className={`h-2 rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-teal-600'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardHeader>

        {!isComplete && (
          <CardContent>
            <div className="space-y-2">
              {ONBOARDING_ITEMS.map((item) => {
                const isItemComplete = completedItems.includes(item.id)

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      isItemComplete
                        ? 'bg-white/60 text-slate-500'
                        : 'bg-white hover:bg-white/80 hover:shadow-sm'
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleItem(item.id)
                      }}
                      className="flex-shrink-0"
                    >
                      {isItemComplete ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300 hover:text-teal-500" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          isItemComplete ? 'line-through' : 'text-slate-900'
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{item.description}</p>
                    </div>
                    {!isItemComplete && (
                      <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsGuidanceOpen(true)}
              >
                <GraduationCap className="h-4 w-4 mr-1" />
                View Tutorials
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const allIds = ONBOARDING_ITEMS.map((i) => i.id)
                  setCompletedItems(allIds)
                  localStorage.setItem('serve-os-onboarding-completed', JSON.stringify(allIds))
                }}
                className="text-slate-500"
              >
                Skip all
              </Button>
            </div>
          </CardContent>
        )}

        {isComplete && (
          <CardContent>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCompletedItems([])
                  localStorage.setItem('serve-os-onboarding-completed', JSON.stringify([]))
                }}
              >
                Restart Onboarding
              </Button>
              <Button
                size="sm"
                onClick={() => setIsGuidanceOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Explore More
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <WorkflowGuidance
        isOpen={isGuidanceOpen}
        onClose={() => setIsGuidanceOpen(false)}
        initialTab="tutorials"
        initialTutorialId={activeTutorialId}
      />
    </>
  )
}

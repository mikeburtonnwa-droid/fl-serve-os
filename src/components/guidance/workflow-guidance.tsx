'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  X,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  Sparkles,
  GraduationCap,
  Play,
  ArrowRight,
  Target,
  Zap,
  TrendingUp,
  FileText,
  Cpu,
  HelpCircle,
} from 'lucide-react'
import {
  SERVE_FRAMEWORK,
  TUTORIALS,
  PATHWAY_GUIDANCE,
  QUICK_REFERENCE,
  type Tutorial,
} from '@/lib/guidance-content'

interface WorkflowGuidanceProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'tutorials' | 'framework' | 'pathways' | 'reference'
  initialTutorialId?: string
}

export function WorkflowGuidance({
  isOpen,
  onClose,
  initialTab = 'tutorials',
  initialTutorialId,
}: WorkflowGuidanceProps) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])

  useEffect(() => {
    if (initialTutorialId) {
      const tutorial = TUTORIALS.find((t) => t.id === initialTutorialId)
      if (tutorial) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveTutorial(tutorial)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveTab('tutorials')
      }
    }
  }, [initialTutorialId])

  // Load completed steps from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('serve-os-completed-steps')
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCompletedSteps(JSON.parse(saved))
    }
  }, [])

  const markStepComplete = (stepId: string) => {
    const updated = [...completedSteps, stepId]
    setCompletedSteps(updated)
    localStorage.setItem('serve-os-completed-steps', JSON.stringify(updated))
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'tutorials', label: 'Tutorials', icon: GraduationCap },
    { id: 'framework', label: 'SERVE Framework', icon: Sparkles },
    { id: 'pathways', label: 'Pathways', icon: Target },
    { id: 'reference', label: 'Quick Reference', icon: BookOpen },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-teal-600 to-teal-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <HelpCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Workflow Guidance</h2>
              <p className="text-sm text-teal-100">Learn the SERVE OS methodology</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as typeof activeTab)
                  setActiveTutorial(null)
                }}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'tutorials' && !activeTutorial && (
            <TutorialsList
              tutorials={TUTORIALS}
              completedSteps={completedSteps}
              onSelect={setActiveTutorial}
            />
          )}

          {activeTab === 'tutorials' && activeTutorial && (
            <TutorialViewer
              tutorial={activeTutorial}
              currentStepIndex={currentStepIndex}
              completedSteps={completedSteps}
              onStepChange={setCurrentStepIndex}
              onMarkComplete={markStepComplete}
              onBack={() => setActiveTutorial(null)}
            />
          )}

          {activeTab === 'framework' && <FrameworkContent />}

          {activeTab === 'pathways' && <PathwaysContent />}

          {activeTab === 'reference' && <ReferenceContent />}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// TUTORIALS LIST
// =============================================================================

function TutorialsList({
  tutorials,
  completedSteps,
  onSelect,
}: {
  tutorials: Tutorial[]
  completedSteps: string[]
  onSelect: (tutorial: Tutorial) => void
}) {
  return (
    <div className="p-6 space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Interactive Tutorials</h3>
        <p className="text-sm text-slate-500 mt-1">
          Step-by-step guides to help you master SERVE OS
        </p>
      </div>

      {tutorials.map((tutorial) => {
        const completedCount = tutorial.steps.filter((s) =>
          completedSteps.includes(`${tutorial.id}-${s.id}`)
        ).length
        const progress = (completedCount / tutorial.steps.length) * 100

        return (
          <Card
            key={tutorial.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onSelect(tutorial)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-900">{tutorial.title}</h4>
                    {completedCount === tutorial.steps.length && (
                      <Badge variant="success" size="sm">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Complete
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{tutorial.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                    <span>⏱️ {tutorial.estimatedTime}</span>
                    <span>👤 {tutorial.targetAudience}</span>
                    <span>📚 {tutorial.steps.length} steps</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20">
                    <div className="text-xs text-slate-500 text-right mb-1">
                      {completedCount}/{tutorial.steps.length}
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div
                        className="bg-teal-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// =============================================================================
// TUTORIAL VIEWER
// =============================================================================

function TutorialViewer({
  tutorial,
  currentStepIndex,
  completedSteps,
  onStepChange,
  onMarkComplete,
  onBack,
}: {
  tutorial: Tutorial
  currentStepIndex: number
  completedSteps: string[]
  onStepChange: (index: number) => void
  onMarkComplete: (stepId: string) => void
  onBack: () => void
}) {
  const currentStep = tutorial.steps[currentStepIndex]
  const stepId = `${tutorial.id}-${currentStep.id}`
  const isComplete = completedSteps.includes(stepId)

  const goToNext = () => {
    if (!isComplete) {
      onMarkComplete(stepId)
    }
    if (currentStepIndex < tutorial.steps.length - 1) {
      onStepChange(currentStepIndex + 1)
    }
  }

  const goToPrev = () => {
    if (currentStepIndex > 0) {
      onStepChange(currentStepIndex - 1)
    }
  }

  return (
    <div className="flex h-full">
      {/* Step Sidebar */}
      <div className="w-64 border-r border-slate-200 bg-slate-50 p-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" />
          All Tutorials
        </Button>
        <h4 className="font-medium text-slate-900 mb-3">{tutorial.title}</h4>
        <div className="space-y-1">
          {tutorial.steps.map((step, index) => {
            const isStepComplete = completedSteps.includes(`${tutorial.id}-${step.id}`)
            const isCurrent = index === currentStepIndex

            return (
              <button
                key={step.id}
                onClick={() => onStepChange(index)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                  isCurrent
                    ? 'bg-teal-100 text-teal-700'
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                {isStepComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-300 flex-shrink-0" />
                )}
                <span className="truncate">{step.title}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="default">
              Step {currentStepIndex + 1} of {tutorial.steps.length}
            </Badge>
            {isComplete && (
              <Badge variant="success">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">{currentStep.title}</h3>
          <p className="text-sm text-slate-500 mb-6">{currentStep.description}</p>

          <div className="prose prose-slate max-w-none">
            <div className="whitespace-pre-line text-slate-700">{currentStep.content.trim()}</div>
          </div>

          {currentStep.actionItems && currentStep.actionItems.length > 0 && (
            <div className="mt-6 bg-teal-50 rounded-lg p-4 border border-teal-200">
              <h5 className="font-medium text-teal-900 mb-3 flex items-center gap-2">
                <Play className="h-4 w-4" />
                Action Items
              </h5>
              <ul className="space-y-2">
                {currentStep.actionItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-teal-700">
                    <ArrowRight className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <Button
            variant="outline"
            onClick={goToPrev}
            disabled={currentStepIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {tutorial.steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStepIndex
                    ? 'bg-teal-600'
                    : completedSteps.includes(`${tutorial.id}-${tutorial.steps[index].id}`)
                    ? 'bg-green-500'
                    : 'bg-slate-300'
                }`}
              />
            ))}
          </div>

          {currentStepIndex < tutorial.steps.length - 1 ? (
            <Button onClick={goToNext} className="bg-teal-600 hover:bg-teal-700">
              {isComplete ? 'Next' : 'Mark Complete & Next'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (!isComplete) onMarkComplete(stepId)
                onBack()
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Finish Tutorial
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// FRAMEWORK CONTENT
// =============================================================================

function FrameworkContent() {
  return (
    <div className="p-6 space-y-8">
      {/* Overview */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-teal-100 rounded-lg">
            <Sparkles className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900">{SERVE_FRAMEWORK.name}</h3>
            <p className="text-sm text-teal-600 font-medium">{SERVE_FRAMEWORK.tagline}</p>
          </div>
        </div>
        <p className="text-slate-600 whitespace-pre-line">{SERVE_FRAMEWORK.description.trim()}</p>
      </div>

      {/* Value Proposition */}
      <Card className="bg-gradient-to-br from-teal-50 to-white border-teal-200">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-teal-900 mb-2">Value Proposition</h4>
          <p className="text-teal-800 whitespace-pre-line">
            {SERVE_FRAMEWORK.valueProposition.trim()}
          </p>
        </CardContent>
      </Card>

      {/* SERVE Phases */}
      <div>
        <h4 className="font-semibold text-slate-900 mb-4">The Five Phases</h4>
        <div className="space-y-4">
          {SERVE_FRAMEWORK.phases.map((phase, index) => (
            <Card key={phase.letter}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-teal-100 text-teal-700 font-bold text-lg flex-shrink-0">
                    {phase.letter}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-slate-900">{phase.name}</h5>
                    <p className="text-sm text-slate-500 mt-1">{phase.description}</p>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase mb-1">
                          Key Activities
                        </p>
                        <ul className="text-sm text-slate-600 space-y-1">
                          {phase.keyActivities.map((activity, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-teal-500">•</span>
                              {activity}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-slate-500 uppercase mb-1">Outcome</p>
                        <p className="text-sm text-slate-700">{phase.outcome}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// PATHWAYS CONTENT
// =============================================================================

function PathwaysContent() {
  const [selectedPathway, setSelectedPathway] = useState<string | null>(null)

  const pathwayIcons = {
    knowledge_spine: BookOpen,
    roi_audit: TrendingUp,
    workflow_sprint: Zap,
  }

  const pathwayColors = {
    knowledge_spine: 'bg-blue-100 text-blue-700 border-blue-200',
    roi_audit: 'bg-amber-100 text-amber-700 border-amber-200',
    workflow_sprint: 'bg-green-100 text-green-700 border-green-200',
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Service Pathways</h3>
        <p className="text-sm text-slate-500 mt-1">
          Three tailored approaches based on client AI readiness
        </p>
      </div>

      {/* Pathway Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(PATHWAY_GUIDANCE).map(([key, pathway]) => {
          const Icon = pathwayIcons[key as keyof typeof pathwayIcons]
          const colorClass = pathwayColors[key as keyof typeof pathwayColors]

          return (
            <Card
              key={key}
              className={`cursor-pointer transition-all ${
                selectedPathway === key ? 'ring-2 ring-teal-500 shadow-lg' : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedPathway(selectedPathway === key ? null : key)}
            >
              <CardContent className="pt-6">
                <div className={`inline-flex p-2 rounded-lg mb-3 ${colorClass.split(' ').slice(0, 2).join(' ')}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="font-semibold text-slate-900">{pathway.name}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="default" size="sm">
                    Score: {pathway.scoreRange}
                  </Badge>
                  <Badge variant="default" size="sm">
                    {pathway.duration}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 mt-3 line-clamp-2">
                  {pathway.targetClient}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Selected Pathway Details */}
      {selectedPathway && PATHWAY_GUIDANCE[selectedPathway as keyof typeof PATHWAY_GUIDANCE] && (
        <Card className="bg-slate-50">
          <CardContent className="pt-6 space-y-6">
            {(() => {
              const pathway = PATHWAY_GUIDANCE[selectedPathway as keyof typeof PATHWAY_GUIDANCE]
              return (
                <>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">{pathway.name}</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-line">
                      {pathway.description.trim()}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h5 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4 text-teal-600" />
                        Jobs to Be Done
                      </h5>
                      <ul className="text-sm text-slate-600 space-y-1.5">
                        {pathway.jobsToBeDone.map((job, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                            {job}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-teal-600" />
                        Key Deliverables
                      </h5>
                      <ul className="text-sm text-slate-600 space-y-1.5">
                        {pathway.keyDeliverables.map((d, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-teal-500">•</span>
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h5 className="font-medium text-green-900 mb-2">💡 Tips</h5>
                      <ul className="text-sm text-green-700 space-y-1">
                        {pathway.tips.map((tip, i) => (
                          <li key={i}>• {tip}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <h5 className="font-medium text-red-900 mb-2">⚠️ Common Pitfalls</h5>
                      <ul className="text-sm text-red-700 space-y-1">
                        {pathway.commonPitfalls.map((pitfall, i) => (
                          <li key={i}>• {pitfall}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              )
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// =============================================================================
// REFERENCE CONTENT
// =============================================================================

function ReferenceContent() {
  const [expandedSection, setExpandedSection] = useState<string>('templates')

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Quick Reference</h3>
        <p className="text-sm text-slate-500 mt-1">
          Fast access to key information and definitions
        </p>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'templates', label: 'Templates', icon: FileText },
          { id: 'stations', label: 'Stations', icon: Cpu },
          { id: 'statuses', label: 'Statuses', icon: Circle },
          { id: 'shortcuts', label: 'Shortcuts', icon: Zap },
        ].map((section) => {
          const Icon = section.icon
          return (
            <Button
              key={section.id}
              variant={expandedSection === section.id ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setExpandedSection(section.id)}
              className={expandedSection === section.id ? 'bg-teal-600 hover:bg-teal-700' : ''}
            >
              <Icon className="h-3 w-3 mr-1" />
              {section.label}
            </Button>
          )
        })}
      </div>

      {/* Templates */}
      {expandedSection === 'templates' && (
        <Card>
          <CardHeader>
            <CardTitle>Artifact Templates</CardTitle>
            <CardDescription>All templates in the SERVE OS workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-medium text-slate-600">ID</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-600">Name</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-600">Stage</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-600">Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {QUICK_REFERENCE.templateQuickRef.map((template) => (
                    <tr key={template.id} className="border-b border-slate-100">
                      <td className="py-2 px-3 font-mono text-teal-600">{template.id}</td>
                      <td className="py-2 px-3">{template.name}</td>
                      <td className="py-2 px-3 text-slate-500">{template.stage}</td>
                      <td className="py-2 px-3">
                        <Badge
                          variant={template.tier === 'T2' ? 'warning' : 'default'}
                          size="sm"
                        >
                          {template.tier}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stations */}
      {expandedSection === 'stations' && (
        <Card>
          <CardHeader>
            <CardTitle>AI Stations</CardTitle>
            <CardDescription>Automated analysis and generation engines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {QUICK_REFERENCE.stationQuickRef.map((station) => (
                <div
                  key={station.id}
                  className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg"
                >
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <Cpu className="h-5 w-5 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-teal-600">{station.id}</span>
                      <span className="font-medium text-slate-900">{station.name}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                      <span>
                        <span className="font-medium">Inputs:</span> {station.inputs}
                      </span>
                      <span>→</span>
                      <span>
                        <span className="font-medium">Outputs:</span> {station.outputs}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statuses */}
      {expandedSection === 'statuses' && (
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(QUICK_REFERENCE.statusDefinitions).map(([category, statuses]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="capitalize">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  {Object.entries(statuses).map(([status, description]) => (
                    <div key={status}>
                      <dt className="text-sm font-medium text-slate-900 capitalize">
                        {status.replace('_', ' ')}
                      </dt>
                      <dd className="text-xs text-slate-500">{description}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Shortcuts */}
      {expandedSection === 'shortcuts' && (
        <Card>
          <CardHeader>
            <CardTitle>Keyboard Shortcuts</CardTitle>
            <CardDescription>Navigate faster with keyboard commands</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              {QUICK_REFERENCE.keyboardShortcuts.map((shortcut) => (
                <div
                  key={shortcut.key}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <span className="text-sm text-slate-600">{shortcut.action}</span>
                  <kbd className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-slate-700">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

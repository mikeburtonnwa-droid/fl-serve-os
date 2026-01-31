'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { HelpCircle, BookOpen, GraduationCap, Sparkles, Target } from 'lucide-react'
import { WorkflowGuidance } from './workflow-guidance'

interface HelpButtonProps {
  variant?: 'primary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  className?: string
  initialTab?: 'tutorials' | 'framework' | 'pathways' | 'reference'
  label?: string
}

export function HelpButton({
  variant = 'ghost',
  size = 'icon',
  className = '',
  initialTab = 'tutorials',
  label,
}: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className={className}
        title="Open Workflow Guidance"
      >
        <HelpCircle className={size === 'icon' ? 'h-5 w-5' : 'h-4 w-4'} />
        {label && <span className="ml-2">{label}</span>}
      </Button>

      <WorkflowGuidance
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialTab={initialTab}
      />
    </>
  )
}

// Quick access buttons for specific sections
interface QuickHelpButtonProps {
  className?: string
}

export function FrameworkHelpButton({ className }: QuickHelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <Sparkles className="h-4 w-4 mr-1" />
        SERVE Framework
      </Button>
      <WorkflowGuidance
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialTab="framework"
      />
    </>
  )
}

export function PathwaysHelpButton({ className }: QuickHelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <Target className="h-4 w-4 mr-1" />
        Pathways
      </Button>
      <WorkflowGuidance
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialTab="pathways"
      />
    </>
  )
}

export function TutorialsHelpButton({ className }: QuickHelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <GraduationCap className="h-4 w-4 mr-1" />
        Tutorials
      </Button>
      <WorkflowGuidance
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialTab="tutorials"
      />
    </>
  )
}

export function ReferenceHelpButton({ className }: QuickHelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <BookOpen className="h-4 w-4 mr-1" />
        Reference
      </Button>
      <WorkflowGuidance
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialTab="reference"
      />
    </>
  )
}

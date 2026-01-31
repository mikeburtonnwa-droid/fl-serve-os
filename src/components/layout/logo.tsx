'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const sizes = {
    sm: { container: 'h-8', icon: 'text-lg', text: 'text-lg' },
    md: { container: 'h-10', icon: 'text-xl', text: 'text-xl' },
    lg: { container: 'h-12', icon: 'text-2xl', text: 'text-2xl' },
  }

  return (
    <Link href="/dashboard" className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-lg bg-teal-600 text-white font-bold aspect-square',
          sizes[size].container,
          sizes[size].icon
        )}
      >
        {'<fl>'}
      </div>
      {showText && (
        <span className={cn('font-semibold text-slate-900', sizes[size].text)}>
          SERVE OS
        </span>
      )}
    </Link>
  )
}

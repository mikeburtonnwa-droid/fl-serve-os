/**
 * Magic Link Generation and Validation (F10.1)
 *
 * Handles secure token generation for client portal access.
 *
 * User Stories: US-035, US-036
 */

import { randomBytes, createHash } from 'crypto'
import { PORTAL_CONFIG } from './types'

// =============================================================================
// Token Generation
// =============================================================================

/**
 * Generates a cryptographically secure magic link token
 */
export function generateMagicToken(): string {
  return randomBytes(PORTAL_CONFIG.tokenLength / 2).toString('hex')
}

/**
 * Hashes a token for secure storage
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Generates the full portal URL with the magic token
 */
export function generatePortalUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${base}/portal/access/${token}`
}

// =============================================================================
// Expiration Calculation
// =============================================================================

/**
 * Calculates expiration date for a magic link
 */
export function calculateExpirationDate(days?: number): Date {
  const expirationDays = Math.min(
    days || PORTAL_CONFIG.defaultExpirationDays,
    PORTAL_CONFIG.maxExpirationDays
  )

  const expirationDate = new Date()
  expirationDate.setDate(expirationDate.getDate() + expirationDays)
  return expirationDate
}

/**
 * Checks if a date has expired
 */
export function isExpired(expirationDate: string | Date): boolean {
  const expiry = new Date(expirationDate)
  return expiry < new Date()
}

/**
 * Gets days until expiration
 */
export function getDaysUntilExpiration(expirationDate: string | Date): number {
  const expiry = new Date(expirationDate)
  const now = new Date()
  const diffTime = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates token format (should be hex string of correct length)
 */
export function isValidTokenFormat(token: string): boolean {
  const hexRegex = new RegExp(`^[0-9a-f]{${PORTAL_CONFIG.tokenLength}}$`, 'i')
  return hexRegex.test(token)
}

// =============================================================================
// Session Calculations
// =============================================================================

/**
 * Calculates session expiration date
 */
export function calculateSessionExpiration(): Date {
  const expirationDate = new Date()
  expirationDate.setDate(
    expirationDate.getDate() + PORTAL_CONFIG.sessionDurationDays
  )
  return expirationDate
}

/**
 * Generates a session ID
 */
export function generateSessionId(): string {
  return randomBytes(32).toString('hex')
}

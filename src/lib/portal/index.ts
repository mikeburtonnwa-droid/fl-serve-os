/**
 * Client Portal Module Exports (E10)
 */

// Types
export * from './types'

// Magic Link Functions
export {
  generateMagicToken,
  hashToken,
  generatePortalUrl,
  calculateExpirationDate,
  isExpired,
  getDaysUntilExpiration,
  isValidEmail,
  isValidTokenFormat,
  calculateSessionExpiration,
  generateSessionId,
} from './magic-link'

// Email Templates
export {
  generateMagicLinkEmail,
  generateExpiringLinkEmail,
  generateNewArtifactEmail,
} from './email-templates'

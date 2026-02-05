/**
 * Client Portal Type Definitions (F10.1-F10.8)
 *
 * Types for the client portal system including magic link authentication,
 * session management, and client-facing views.
 *
 * User Stories: US-035, US-036, US-037, US-038, US-039
 */

// =============================================================================
// Magic Link Types (F10.1)
// =============================================================================

/**
 * Magic link record for client portal access
 */
export interface MagicLink {
  id: string
  token: string
  engagementId: string
  clientEmail: string
  clientName?: string
  createdBy: string
  createdAt: string
  expiresAt: string
  usedAt?: string
  isRevoked: boolean
  accessCount: number
  lastAccessAt?: string
}

/**
 * Magic link creation request
 */
export interface CreateMagicLinkRequest {
  engagementId: string
  clientEmail: string
  clientName?: string
  expirationDays?: number // Default 7 days
  sendEmail?: boolean
}

/**
 * Magic link validation result
 */
export interface MagicLinkValidation {
  isValid: boolean
  reason?: 'expired' | 'revoked' | 'not_found' | 'already_used'
  link?: MagicLink
  engagement?: {
    id: string
    name: string
    clientName: string
    status: string
  }
}

// =============================================================================
// Portal Session Types (F10.2)
// =============================================================================

/**
 * Portal session for authenticated client access
 */
export interface PortalSession {
  id: string
  magicLinkId: string
  engagementId: string
  clientEmail: string
  clientName?: string
  createdAt: string
  expiresAt: string
  lastActivityAt: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Session cookie data
 */
export interface PortalSessionCookie {
  sessionId: string
  engagementId: string
  clientEmail: string
  expiresAt: string
}

// =============================================================================
// Portal View Types (F10.3, F10.4)
// =============================================================================

/**
 * Client-visible engagement summary
 */
export interface PortalEngagementSummary {
  id: string
  name: string
  status: string
  pathway?: string
  consultant: {
    name: string
    email: string
    phone?: string
  }
  client: {
    name: string
  }
  createdAt: string
  updatedAt: string
  stats: {
    totalArtifacts: number
    visibleArtifacts: number
    completedArtifacts: number
  }
  milestones: PortalMilestone[]
}

/**
 * Client-visible artifact
 */
export interface PortalArtifact {
  id: string
  name: string
  type: string
  status: string
  description?: string
  createdAt: string
  updatedAt: string
  canDownload: boolean
  downloadUrl?: string
}

/**
 * Engagement milestone for timeline (F10.5)
 */
export interface PortalMilestone {
  id: string
  title: string
  description?: string
  date: string
  status: 'completed' | 'in_progress' | 'upcoming'
  type: 'phase' | 'deliverable' | 'meeting' | 'review'
}

// =============================================================================
// Visibility Control Types (F10.6)
// =============================================================================

/**
 * Artifact visibility settings
 */
export interface ArtifactVisibility {
  artifactId: string
  isClientVisible: boolean
  visibleSince?: string
  hiddenSince?: string
  lastUpdatedBy: string
  lastUpdatedAt: string
}

/**
 * Visibility change request
 */
export interface VisibilityChangeRequest {
  artifactId: string
  isClientVisible: boolean
}

// =============================================================================
// Portal Analytics Types (F10.7)
// =============================================================================

/**
 * Portal access analytics
 */
export interface PortalAnalytics {
  engagementId: string
  period: {
    start: string
    end: string
  }
  summary: {
    totalViews: number
    uniqueVisitors: number
    avgSessionDuration: number // in seconds
    artifactsViewed: number
    downloadsCount: number
  }
  viewsByDay: Array<{
    date: string
    views: number
    uniqueVisitors: number
  }>
  topArtifacts: Array<{
    artifactId: string
    artifactName: string
    views: number
    downloads: number
  }>
  recentActivity: Array<{
    timestamp: string
    action: 'view' | 'download' | 'login'
    details: string
    clientEmail?: string
  }>
}

/**
 * Portal activity log entry
 */
export interface PortalActivityLog {
  id: string
  engagementId: string
  sessionId?: string
  clientEmail?: string
  action: 'login' | 'view_dashboard' | 'view_artifact' | 'download_artifact' | 'logout'
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

// =============================================================================
// Email Template Types (F10.8)
// =============================================================================

/**
 * Magic link email template data
 */
export interface MagicLinkEmailData {
  clientName: string
  clientEmail: string
  engagementName: string
  consultantName: string
  consultantEmail: string
  portalUrl: string
  expirationDate: string
  companyName?: string
}

/**
 * Email template types
 */
export type PortalEmailTemplate =
  | 'magic_link_initial'
  | 'magic_link_reminder'
  | 'magic_link_expiring'
  | 'new_artifact_available'
  | 'engagement_update'

// =============================================================================
// Configuration
// =============================================================================

/**
 * Portal configuration
 */
export const PORTAL_CONFIG = {
  // Magic link settings
  defaultExpirationDays: 7,
  maxExpirationDays: 30,
  tokenLength: 64,

  // Session settings
  sessionDurationDays: 7,
  maxSessionsPerLink: 10,

  // Visibility rules
  onlyT2ArtifactsVisible: true, // Only T2 (client-safe) artifacts can be made visible
  requireApprovalForVisibility: false, // Whether artifacts need approval before being visible
}

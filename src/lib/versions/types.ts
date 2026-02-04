/**
 * Version Control Types (F5.1)
 *
 * Type definitions for artifact version history and concurrent editing.
 *
 * User Stories: US-021, US-022, US-023
 */

// =============================================================================
// Version History Types
// =============================================================================

export interface ArtifactVersion {
  id: string
  artifact_id: string
  version_number: number
  content: Record<string, unknown>
  name: string
  change_summary?: string
  created_by?: string
  created_at: string
  // Populated via join
  creator?: {
    email: string
    full_name?: string
  }
}

export interface VersionHistoryResponse {
  success: boolean
  versions: ArtifactVersion[]
  total: number
  currentVersion: number
}

// =============================================================================
// Version Diff Types (F5.3)
// =============================================================================

export type DiffType = 'added' | 'removed' | 'modified' | 'unchanged'

export interface FieldDiff {
  fieldId: string
  fieldLabel: string
  type: DiffType
  oldValue: unknown
  newValue: unknown
  // For text fields, word-level diff
  textDiff?: Array<{
    type: 'added' | 'removed' | 'unchanged'
    value: string
  }>
}

export interface VersionDiff {
  versionFrom: number
  versionTo: number
  nameChanged: boolean
  nameDiff?: {
    oldName: string
    newName: string
  }
  fieldChanges: FieldDiff[]
  totalChanges: number
  addedFields: number
  removedFields: number
  modifiedFields: number
}

export interface VersionCompareRequest {
  artifactId: string
  versionFrom: number
  versionTo: number
}

export interface VersionCompareResponse {
  success: boolean
  diff: VersionDiff
  versionFromData: ArtifactVersion
  versionToData: ArtifactVersion
}

// =============================================================================
// Version Restore Types (F5.4)
// =============================================================================

export interface VersionRestoreRequest {
  artifactId: string
  versionNumber: number
  restoreMode: 'full' | 'selective'
  selectedFields?: string[] // For selective restore
}

export interface VersionRestoreResponse {
  success: boolean
  newVersion: number
  restoredFromVersion: number
  message: string
}

// =============================================================================
// Concurrent Edit Types (F5.5)
// =============================================================================

export interface EditLock {
  artifactId: string
  lockedBy: string
  lockedAt: string
  lockOwnerEmail?: string
}

export interface AcquireLockRequest {
  artifactId: string
  lockTimeoutMinutes?: number
}

export interface AcquireLockResponse {
  success: boolean
  locked: boolean
  lockInfo?: EditLock
}

export interface ReleaseLockRequest {
  artifactId: string
}

export interface ReleaseLockResponse {
  success: boolean
}

export interface ConflictCheckRequest {
  artifactId: string
  expectedVersion: number
  lastKnownUpdatedAt: string
}

export interface ConflictInfo {
  hasConflict: boolean
  currentVersion: number
  lastEditorId?: string
  lastEditorEmail?: string
  lastEditedAt?: string
}

export interface ConflictCheckResponse {
  success: boolean
  conflict: ConflictInfo
}

export type ConflictResolution = 'overwrite' | 'merge' | 'cancel'

export interface ResolveConflictRequest {
  artifactId: string
  resolution: ConflictResolution
  mergedContent?: Record<string, unknown> // For merge resolution
}

// =============================================================================
// UI State Types
// =============================================================================

export interface VersionHistoryState {
  isOpen: boolean
  loading: boolean
  versions: ArtifactVersion[]
  selectedVersions: [number | null, number | null] // For comparison
  error: string | null
}

export interface EditLockState {
  hasLock: boolean
  lockInfo: EditLock | null
  conflictDetected: boolean
  conflictInfo: ConflictInfo | null
}

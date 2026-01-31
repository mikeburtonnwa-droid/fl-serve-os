import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AuditAction } from '@/types/database'

interface AuditLogParams {
  userId?: string
  action: AuditAction
  entityType: string
  entityId: string
  details?: Record<string, unknown>
}

// Overload for when supabase client is provided
export async function logAuditEvent(
  supabase: SupabaseClient,
  params: AuditLogParams
): Promise<void>

// Overload for standalone use (creates its own client)
export async function logAuditEvent(params: AuditLogParams): Promise<void>

// Implementation
export async function logAuditEvent(
  supabaseOrParams: SupabaseClient | AuditLogParams,
  maybeParams?: AuditLogParams
): Promise<void> {
  let supabase: SupabaseClient
  let params: AuditLogParams

  // Check if first arg is a SupabaseClient (has 'auth' property)
  if (maybeParams && typeof (supabaseOrParams as SupabaseClient).auth !== 'undefined') {
    // Called with supabase client as first arg
    supabase = supabaseOrParams as SupabaseClient
    params = maybeParams
  } else {
    // Called with just params, create client
    supabase = await createClient()
    params = supabaseOrParams as AuditLogParams
  }

  // Get user if not provided
  let userId = params.userId
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('Audit log failed: No authenticated user')
      return
    }
    userId = user.id
  }

  const { error } = await supabase.from('audit_log').insert({
    user_id: userId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    details: params.details || {},
  })

  if (error) {
    console.error('Audit log failed:', error)
  }
}

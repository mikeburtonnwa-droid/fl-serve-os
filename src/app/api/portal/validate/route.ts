/**
 * Portal Token Validation API Route (F10.1, F10.2)
 *
 * POST - Validate a magic link token and create session
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import {
  hashToken,
  isValidTokenFormat,
  calculateSessionExpiration,
} from '@/lib/portal'

// =============================================================================
// Validation Schema
// =============================================================================

const ValidateTokenSchema = z.object({
  token: z.string().min(1),
})

// =============================================================================
// POST - Validate Token and Create Session
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Validate request
    const validation = ValidateTokenSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { token } = validation.data

    // Validate token format
    if (!isValidTokenFormat(token)) {
      return NextResponse.json(
        {
          success: false,
          isValid: false,
          reason: 'invalid_format',
        },
        { status: 400 }
      )
    }

    // Hash the token for lookup
    const tokenHash = hashToken(token)

    // Find the magic link
    const { data: magicLink, error: linkError } = await supabase
      .from('portal_magic_links')
      .select(`
        *,
        engagement:engagements(
          id,
          name,
          status,
          pathway,
          client:clients(id, name)
        )
      `)
      .eq('token_hash', tokenHash)
      .single()

    if (linkError || !magicLink) {
      return NextResponse.json({
        success: false,
        isValid: false,
        reason: 'not_found',
      })
    }

    // Check if revoked
    if (magicLink.is_revoked) {
      return NextResponse.json({
        success: false,
        isValid: false,
        reason: 'revoked',
      })
    }

    // Check if expired
    if (new Date(magicLink.expires_at) < new Date()) {
      return NextResponse.json({
        success: false,
        isValid: false,
        reason: 'expired',
      })
    }

    // Get client info from request headers
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      null
    const userAgent = request.headers.get('user-agent') || null

    // Create or update session
    const sessionExpires = calculateSessionExpiration()

    const { data: session, error: sessionError } = await supabase
      .from('portal_sessions')
      .insert({
        magic_link_id: magicLink.id,
        engagement_id: magicLink.engagement_id,
        client_email: magicLink.client_email,
        client_name: magicLink.client_name,
        expires_at: sessionExpires.toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Failed to create session:', sessionError)
      // Continue anyway - session is nice to have
    }

    // Update magic link usage stats
    await supabase
      .from('portal_magic_links')
      .update({
        used_at: magicLink.used_at || new Date().toISOString(),
        access_count: (magicLink.access_count || 0) + 1,
        last_access_at: new Date().toISOString(),
      })
      .eq('id', magicLink.id)

    // Log the login activity
    await supabase.rpc('log_portal_activity', {
      p_engagement_id: magicLink.engagement_id,
      p_session_id: session?.id || null,
      p_client_email: magicLink.client_email,
      p_action: 'login',
      p_details: { source: 'magic_link' },
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
    })

    // Prepare engagement data
    const engagement = magicLink.engagement as {
      id: string
      name: string
      status: string
      pathway: string
      client: { id: string; name: string } | null
    }

    return NextResponse.json({
      success: true,
      isValid: true,
      session: session
        ? {
            id: session.id,
            expiresAt: session.expires_at,
          }
        : null,
      engagement: {
        id: engagement.id,
        name: engagement.name,
        status: engagement.status,
        clientName: engagement.client?.name || 'Client',
      },
      client: {
        email: magicLink.client_email,
        name: magicLink.client_name,
      },
    })
  } catch (error) {
    console.error('Error validating token:', error)
    return NextResponse.json(
      { error: 'Failed to validate token' },
      { status: 500 }
    )
  }
}

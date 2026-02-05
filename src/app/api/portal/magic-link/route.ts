/**
 * Magic Link API Route (F10.1, F10.8)
 *
 * POST - Create a new magic link for client portal access
 * GET - List magic links for an engagement
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import {
  generateMagicToken,
  hashToken,
  generatePortalUrl,
  calculateExpirationDate,
  generateMagicLinkEmail,
} from '@/lib/portal'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =============================================================================
// Validation Schemas
// =============================================================================

const CreateMagicLinkSchema = z.object({
  engagementId: z.string().uuid(),
  clientEmail: z.string().email(),
  clientName: z.string().min(1).max(100).optional(),
  expirationDays: z.number().min(1).max(30).optional(),
  sendEmail: z.boolean().optional().default(true),
})

// =============================================================================
// POST - Create Magic Link
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request
    const validation = CreateMagicLinkSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { engagementId, clientEmail, clientName, expirationDays, sendEmail } =
      validation.data

    // Verify engagement exists and get details
    const { data: engagement, error: engError } = await supabase
      .from('engagements')
      .select(`
        id,
        name,
        status,
        client:clients(id, name),
        created_by,
        primary_consultant
      `)
      .eq('id', engagementId)
      .single()

    if (engError || !engagement) {
      return NextResponse.json(
        { error: 'Engagement not found' },
        { status: 404 }
      )
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Get user profile for consultant info
    const { data: userProfile } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', user?.id)
      .single()

    // Generate token and hash
    const token = generateMagicToken()
    const tokenHash = hashToken(token)
    const expiresAt = calculateExpirationDate(expirationDays)

    // Create magic link record
    const { data: magicLink, error: createError } = await supabase
      .from('portal_magic_links')
      .insert({
        token_hash: tokenHash,
        engagement_id: engagementId,
        client_email: clientEmail,
        client_name: clientName,
        created_by: user?.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (createError) {
      throw new Error(`Failed to create magic link: ${createError.message}`)
    }

    // Generate portal URL
    const portalUrl = generatePortalUrl(token)

    // Send email if requested
    let emailSent = false
    if (sendEmail) {
      try {
        const client = engagement.client as unknown as { id: string; name: string } | null
        const emailData = generateMagicLinkEmail({
          clientName: clientName || 'Valued Client',
          clientEmail,
          engagementName: engagement.name,
          consultantName: userProfile?.full_name || 'Your Consultant',
          consultantEmail: userProfile?.email || '',
          portalUrl,
          expirationDate: expiresAt.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          companyName: client?.name,
        })

        // In production, send via email service (SendGrid, Resend, etc.)
        // For now, log the email content
        console.log('Would send email:', {
          to: clientEmail,
          subject: emailData.subject,
        })

        emailSent = true // Mark as sent (simulated)
      } catch (emailError) {
        console.error('Failed to send email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      magicLink: {
        id: magicLink.id,
        clientEmail,
        clientName,
        expiresAt: expiresAt.toISOString(),
        portalUrl,
      },
      emailSent,
    })
  } catch (error) {
    console.error('Error creating magic link:', error)
    return NextResponse.json(
      { error: 'Failed to create magic link' },
      { status: 500 }
    )
  }
}

// =============================================================================
// GET - List Magic Links for Engagement
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const engagementId = searchParams.get('engagementId')

    if (!engagementId) {
      return NextResponse.json(
        { error: 'engagementId is required' },
        { status: 400 }
      )
    }

    // Fetch magic links for engagement
    const { data: magicLinks, error } = await supabase
      .from('portal_magic_links')
      .select('*')
      .eq('engagement_id', engagementId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      magicLinks: magicLinks.map((link) => ({
        id: link.id,
        clientEmail: link.client_email,
        clientName: link.client_name,
        createdAt: link.created_at,
        expiresAt: link.expires_at,
        usedAt: link.used_at,
        isRevoked: link.is_revoked,
        accessCount: link.access_count,
        lastAccessAt: link.last_access_at,
        isExpired: new Date(link.expires_at) < new Date(),
      })),
    })
  } catch (error) {
    console.error('Error fetching magic links:', error)
    return NextResponse.json(
      { error: 'Failed to fetch magic links' },
      { status: 500 }
    )
  }
}

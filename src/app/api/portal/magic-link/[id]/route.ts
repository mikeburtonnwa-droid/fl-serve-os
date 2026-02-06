/**
 * Magic Link Management API Route (F10.1)
 *
 * PATCH - Revoke a magic link
 * DELETE - Delete a magic link
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// =============================================================================
// PATCH - Revoke Magic Link
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: linkId } = await params
    const body = await request.json()

    const { isRevoked } = body

    if (typeof isRevoked !== 'boolean') {
      return NextResponse.json(
        { error: 'isRevoked boolean is required' },
        { status: 400 }
      )
    }

    // Update magic link
    const { data: magicLink, error } = await supabase
      .from('portal_magic_links')
      .update({
        is_revoked: isRevoked,
      })
      .eq('id', linkId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Magic link not found' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      magicLink: {
        id: magicLink.id,
        isRevoked: magicLink.is_revoked,
      },
      message: isRevoked ? 'Magic link revoked' : 'Magic link restored',
    })
  } catch (error) {
    console.error('Error updating magic link:', error)
    return NextResponse.json(
      { error: 'Failed to update magic link' },
      { status: 500 }
    )
  }
}

// =============================================================================
// DELETE - Delete Magic Link
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: linkId } = await params

    // Delete magic link
    const { error } = await supabase
      .from('portal_magic_links')
      .delete()
      .eq('id', linkId)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Magic link deleted',
    })
  } catch (error) {
    console.error('Error deleting magic link:', error)
    return NextResponse.json(
      { error: 'Failed to delete magic link' },
      { status: 500 }
    )
  }
}

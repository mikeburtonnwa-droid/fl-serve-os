/**
 * ROI Scenarios API (F6.3)
 *
 * Endpoints for managing ROI scenarios per engagement.
 *
 * User Stories: US-026
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { calculateROI } from '@/lib/roi'
import type { ROIInputs } from '@/lib/roi'

// =============================================================================
// Validation Schemas
// =============================================================================

const roiInputsSchema = z.object({
  hoursPerWeek: z.number().min(1).max(168),
  hourlyRate: z.number().min(0),
  employeeCount: z.number().min(1),
  automationLevel: z.number().min(0).max(100),
  implementationCost: z.number().min(0),
  monthlyMaintenanceCost: z.number().min(0),
  rampUpMonths: z.number().min(1).max(24),
  projectionMonths: z.number().min(12).max(120),
})

const createScenarioSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  inputs: roiInputsSchema,
  isRecommended: z.boolean().optional(),
})

// =============================================================================
// Helper: Create Supabase Client
// =============================================================================

async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}

// =============================================================================
// GET: List scenarios for an engagement
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: engagementId } = await params
    const supabase = await createClient()

    // Get user session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch scenarios for this engagement
    const { data: scenarios, error } = await supabase
      .from('roi_scenarios')
      .select('*')
      .eq('engagement_id', engagementId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching scenarios:', error)
      return NextResponse.json(
        { error: 'Failed to fetch scenarios' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      scenarios: scenarios || [],
    })
  } catch (error) {
    console.error('Error in GET /api/engagements/[id]/scenarios:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST: Create a new scenario
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: engagementId } = await params
    const supabase = await createClient()

    // Get user session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = createScenarioSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { name, description, inputs, isRecommended } = validation.data

    // Calculate results
    const results = calculateROI(inputs as ROIInputs)

    // Check scenario count
    const { count } = await supabase
      .from('roi_scenarios')
      .select('*', { count: 'exact', head: true })
      .eq('engagement_id', engagementId)

    if (count !== null && count >= 5) {
      return NextResponse.json(
        { error: 'Maximum of 5 scenarios allowed per engagement' },
        { status: 400 }
      )
    }

    // Create the scenario
    const { data: scenario, error } = await supabase
      .from('roi_scenarios')
      .insert({
        engagement_id: engagementId,
        name,
        description,
        inputs,
        results,
        is_recommended: isRecommended || false,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating scenario:', error)

      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A scenario with this name already exists' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create scenario' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      scenario,
    })
  } catch (error) {
    console.error('Error in POST /api/engagements/[id]/scenarios:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =============================================================================
// DELETE: Delete a scenario
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: engagementId } = await params
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const scenarioId = searchParams.get('scenarioId')

    if (!scenarioId) {
      return NextResponse.json(
        { error: 'Scenario ID is required' },
        { status: 400 }
      )
    }

    // Get user session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete the scenario
    const { error } = await supabase
      .from('roi_scenarios')
      .delete()
      .eq('id', scenarioId)
      .eq('engagement_id', engagementId)

    if (error) {
      console.error('Error deleting scenario:', error)
      return NextResponse.json(
        { error: 'Failed to delete scenario' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/engagements/[id]/scenarios:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =============================================================================
// PATCH: Update a scenario
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: engagementId } = await params
    const supabase = await createClient()

    // Get user session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { scenarioId, name, description, inputs, isRecommended } = body

    if (!scenarioId) {
      return NextResponse.json(
        { error: 'Scenario ID is required' },
        { status: 400 }
      )
    }

    // Build update object
    const updates: Record<string, unknown> = {}

    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (isRecommended !== undefined) updates.is_recommended = isRecommended

    if (inputs !== undefined) {
      const inputValidation = roiInputsSchema.safeParse(inputs)
      if (!inputValidation.success) {
        return NextResponse.json(
          { error: 'Invalid inputs', details: inputValidation.error.issues },
          { status: 400 }
        )
      }
      updates.inputs = inputs
      updates.results = calculateROI(inputs as ROIInputs)
    }

    // Update the scenario
    const { data: scenario, error } = await supabase
      .from('roi_scenarios')
      .update(updates)
      .eq('id', scenarioId)
      .eq('engagement_id', engagementId)
      .select()
      .single()

    if (error) {
      console.error('Error updating scenario:', error)
      return NextResponse.json(
        { error: 'Failed to update scenario' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      scenario,
    })
  } catch (error) {
    console.error('Error in PATCH /api/engagements/[id]/scenarios:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

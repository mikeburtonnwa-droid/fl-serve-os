/**
 * Intake Assessment API Routes (F7.1-F7.3)
 *
 * GET - Fetch assessment for engagement
 * POST - Create or update assessment
 * PATCH - Override pathway with justification
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import {
  calculateAssessmentScore,
  INTAKE_QUESTIONS,
  FOLLOW_UP_QUESTIONS,
} from '@/lib/intake'

// =============================================================================
// Validation Schemas
// =============================================================================

const AnswerSchema = z.object({
  questionId: z.string(),
  value: z.union([z.string(), z.array(z.string()), z.number()]),
  notes: z.string().optional(),
})

const UpdateAssessmentSchema = z.object({
  answers: z.array(AnswerSchema),
  status: z.enum(['in_progress', 'completed', 'reviewed']).optional(),
})

const PathwayOverrideSchema = z.object({
  pathway: z.enum(['accelerated', 'standard', 'extended']),
  justification: z.string().min(10, 'Justification must be at least 10 characters'),
})

// =============================================================================
// GET - Fetch Assessment
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: engagementId } = await params

    // Verify engagement exists
    const { data: engagement, error: engagementError } = await supabase
      .from('engagements')
      .select('id, name')
      .eq('id', engagementId)
      .single()

    if (engagementError || !engagement) {
      return NextResponse.json(
        { error: 'Engagement not found' },
        { status: 404 }
      )
    }

    // Fetch assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from('intake_assessments')
      .select('*')
      .eq('engagement_id', engagementId)
      .single()

    if (assessmentError && assessmentError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      throw assessmentError
    }

    // Fetch custom weights if they exist
    const { data: questionWeights } = await supabase
      .from('intake_question_weights')
      .select('question_id, weight')
      .eq('is_active', true)

    const { data: categoryWeights } = await supabase
      .from('intake_category_weights')
      .select('category, weight, display_name, description')
      .order('display_order')

    return NextResponse.json({
      success: true,
      assessment: assessment || null,
      questions: INTAKE_QUESTIONS,
      followUpQuestions: FOLLOW_UP_QUESTIONS,
      customWeights: {
        questions: questionWeights || [],
        categories: categoryWeights || [],
      },
    })
  } catch (error) {
    console.error('Error fetching intake assessment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assessment' },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST - Create or Update Assessment
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: engagementId } = await params
    const body = await request.json()

    // Validate request body
    const validation = UpdateAssessmentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { answers, status } = validation.data

    // Verify engagement exists
    const { data: engagement, error: engagementError } = await supabase
      .from('engagements')
      .select('id')
      .eq('id', engagementId)
      .single()

    if (engagementError || !engagement) {
      return NextResponse.json(
        { error: 'Engagement not found' },
        { status: 404 }
      )
    }

    // Calculate scores
    const scores = calculateAssessmentScore(answers)

    // Prepare assessment data
    const assessmentData = {
      engagement_id: engagementId,
      answers,
      scores,
      recommended_pathway: scores.pathwayRecommendation.pathway,
      status: status || (scores.completionPercentage === 100 ? 'completed' : 'in_progress'),
      updated_at: new Date().toISOString(),
    }

    // Check if assessment exists
    const { data: existing } = await supabase
      .from('intake_assessments')
      .select('id')
      .eq('engagement_id', engagementId)
      .single()

    let result
    if (existing) {
      // Update existing assessment
      const { data, error } = await supabase
        .from('intake_assessments')
        .update(assessmentData)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Create new assessment
      const { data, error } = await supabase
        .from('intake_assessments')
        .insert({
          ...assessmentData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({
      success: true,
      assessment: result,
      scores,
    })
  } catch (error) {
    console.error('Error saving intake assessment:', error)
    return NextResponse.json(
      { error: 'Failed to save assessment' },
      { status: 500 }
    )
  }
}

// =============================================================================
// PATCH - Override Pathway
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: engagementId } = await params
    const body = await request.json()

    // Validate request body
    const validation = PathwayOverrideSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { pathway, justification } = validation.data

    // Verify assessment exists
    const { data: assessment, error: assessmentError } = await supabase
      .from('intake_assessments')
      .select('id, recommended_pathway')
      .eq('engagement_id', engagementId)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    // Update with override
    const { data: updated, error: updateError } = await supabase
      .from('intake_assessments')
      .update({
        pathway_override: pathway,
        override_justification: justification,
        override_at: new Date().toISOString(),
        // Note: override_by would be set with actual auth
      })
      .eq('id', assessment.id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      assessment: updated,
      message: `Pathway overridden from ${assessment.recommended_pathway} to ${pathway}`,
    })
  } catch (error) {
    console.error('Error overriding pathway:', error)
    return NextResponse.json(
      { error: 'Failed to override pathway' },
      { status: 500 }
    )
  }
}

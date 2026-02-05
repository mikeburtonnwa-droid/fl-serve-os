/**
 * Admin Intake Weight Configuration API (F7.4)
 *
 * GET - Fetch all weights
 * PUT - Update weights
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =============================================================================
// Validation Schemas
// =============================================================================

const QuestionWeightSchema = z.object({
  questionId: z.string(),
  category: z.string(),
  weight: z.number().min(1).max(5),
  isActive: z.boolean().optional(),
})

const CategoryWeightSchema = z.object({
  category: z.string(),
  weight: z.number().min(0.1).max(2.0),
  displayName: z.string(),
  description: z.string().optional(),
  displayOrder: z.number().optional(),
})

const UpdateWeightsSchema = z.object({
  questionWeights: z.array(QuestionWeightSchema).optional(),
  categoryWeights: z.array(CategoryWeightSchema).optional(),
})

// =============================================================================
// GET - Fetch All Weights
// =============================================================================

export async function GET() {
  try {
    // Fetch question weights
    const { data: questionWeights, error: qError } = await supabase
      .from('intake_question_weights')
      .select('*')
      .order('category')

    if (qError) throw qError

    // Fetch category weights
    const { data: categoryWeights, error: cError } = await supabase
      .from('intake_category_weights')
      .select('*')
      .order('display_order')

    if (cError) throw cError

    return NextResponse.json({
      success: true,
      weights: {
        questions: questionWeights.map((w) => ({
          id: w.id,
          questionId: w.question_id,
          category: w.category,
          weight: w.weight,
          isActive: w.is_active,
          updatedAt: w.updated_at,
        })),
        categories: categoryWeights.map((w) => ({
          id: w.id,
          category: w.category,
          weight: parseFloat(w.weight),
          displayName: w.display_name,
          description: w.description,
          displayOrder: w.display_order,
          updatedAt: w.updated_at,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching intake weights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weights' },
      { status: 500 }
    )
  }
}

// =============================================================================
// PUT - Update Weights
// =============================================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validation = UpdateWeightsSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { questionWeights, categoryWeights } = validation.data
    const results: { questions: number; categories: number } = {
      questions: 0,
      categories: 0,
    }

    // Update question weights
    if (questionWeights && questionWeights.length > 0) {
      for (const qw of questionWeights) {
        const { error } = await supabase
          .from('intake_question_weights')
          .upsert(
            {
              question_id: qw.questionId,
              category: qw.category,
              weight: qw.weight,
              is_active: qw.isActive ?? true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'question_id' }
          )

        if (error) throw error
        results.questions++
      }
    }

    // Update category weights
    if (categoryWeights && categoryWeights.length > 0) {
      for (const cw of categoryWeights) {
        const { error } = await supabase
          .from('intake_category_weights')
          .upsert(
            {
              category: cw.category,
              weight: cw.weight,
              display_name: cw.displayName,
              description: cw.description || null,
              display_order: cw.displayOrder ?? 0,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'category' }
          )

        if (error) throw error
        results.categories++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${results.questions} question weights and ${results.categories} category weights`,
      results,
    })
  } catch (error) {
    console.error('Error updating intake weights:', error)
    return NextResponse.json(
      { error: 'Failed to update weights' },
      { status: 500 }
    )
  }
}

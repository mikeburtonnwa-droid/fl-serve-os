/**
 * PDF Generation API Endpoint (F4.1)
 *
 * Generates branded PDFs from artifact data.
 * Supports single artifact and batch generation.
 *
 * User Stories: US-018, US-019, US-020
 * Test Cases: TC-401, TC-402
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { generatePDF, generateBatchPDF, type PDFGenerationOptions, type ArtifactPDFData } from '@/lib/pdf'

// =============================================================================
// Validation Schemas
// =============================================================================

const BrandingSchema = z.object({
  companyName: z.string().optional(),
  logo: z.string().optional(),
  colors: z.object({
    primary: z.string().optional(),
    secondary: z.string().optional(),
    accent: z.string().optional(),
    text: z.string().optional(),
    background: z.string().optional(),
  }).optional(),
  footer: z.object({
    text: z.string().optional(),
    includePageNumbers: z.boolean().optional(),
    includeDate: z.boolean().optional(),
  }).optional(),
  watermark: z.object({
    text: z.string(),
    opacity: z.number().min(0).max(1),
    position: z.enum(['center', 'diagonal']),
  }).optional(),
}).optional()

const OptionsSchema = z.object({
  template: z.enum(['roi_calculator', 'implementation_plan', 'future_state', 'client_handoff', 'case_study', 'generic']).optional(),
  branding: BrandingSchema,
  pageSize: z.enum(['letter', 'a4', 'legal']).optional(),
  orientation: z.enum(['portrait', 'landscape']).optional(),
  includeTableOfContents: z.boolean().optional(),
  includeWatermark: z.boolean().optional(),
})

const SingleGenerateSchema = z.object({
  artifactId: z.string().uuid(),
  options: OptionsSchema.optional(),
})

const BatchGenerateSchema = z.object({
  artifactIds: z.array(z.string().uuid()).min(1).max(20),
  options: OptionsSchema.optional(),
})

// =============================================================================
// Supabase Client
// =============================================================================

async function createSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}

// =============================================================================
// POST Handler - Single PDF Generation
// =============================================================================

export async function POST(request: NextRequest) {
  const startTime = performance.now()

  try {
    const supabase = await createSupabaseClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()

    // Determine if single or batch request
    const isBatch = 'artifactIds' in body

    if (isBatch) {
      // Batch generation
      const parseResult = BatchGenerateSchema.safeParse(body)
      if (!parseResult.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid request', details: parseResult.error.issues },
          { status: 400 }
        )
      }

      const { artifactIds, options } = parseResult.data

      // Fetch all artifacts
      const { data: artifacts, error: fetchError } = await supabase
        .from('artifacts')
        .select(`
          id, name, template_id, content, status, created_at, updated_at,
          engagement:engagements(
            id, name, pathway,
            client:clients(name, industry)
          )
        `)
        .in('id', artifactIds)

      if (fetchError || !artifacts) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch artifacts' },
          { status: 500 }
        )
      }

      // Transform artifacts
      const artifactDataList: ArtifactPDFData[] = artifacts.map(artifact => {
        const engagement = Array.isArray(artifact.engagement)
          ? artifact.engagement[0]
          : artifact.engagement
        const client = engagement
          ? (Array.isArray(engagement.client) ? engagement.client[0] : engagement.client)
          : null

        return {
          id: artifact.id,
          name: artifact.name,
          templateId: artifact.template_id,
          content: artifact.content as Record<string, unknown>,
          engagement: {
            id: engagement?.id || '',
            name: engagement?.name || '',
            pathway: engagement?.pathway || '',
            client: {
              name: client?.name || 'Unknown Client',
              industry: client?.industry,
            },
          },
          createdAt: artifact.created_at,
          updatedAt: artifact.updated_at,
        }
      })

      // Generate PDFs
      const results = await generateBatchPDF(artifactDataList, options as PDFGenerationOptions)

      const successful = results.filter(r => r.success)
      const failed = results.filter(r => !r.success)

      return NextResponse.json({
        success: true,
        batch: true,
        totalRequested: artifactIds.length,
        successfulCount: successful.length,
        failedCount: failed.length,
        results: results.map((r, i) => ({
          artifactId: artifactIds[i],
          success: r.success,
          filename: r.filename,
          pageCount: r.pageCount,
          sizeBytes: r.sizeBytes,
          generationTimeMs: r.generationTimeMs,
          error: r.error,
          // Include base64 for download
          pdfBase64: r.pdfBase64,
        })),
        totalTimeMs: Math.round(performance.now() - startTime),
      })
    } else {
      // Single generation
      const parseResult = SingleGenerateSchema.safeParse(body)
      if (!parseResult.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid request', details: parseResult.error.issues },
          { status: 400 }
        )
      }

      const { artifactId, options } = parseResult.data

      // Fetch artifact with engagement and client data
      const { data: artifact, error: fetchError } = await supabase
        .from('artifacts')
        .select(`
          id, name, template_id, content, status, created_at, updated_at,
          engagement:engagements(
            id, name, pathway,
            client:clients(name, industry)
          )
        `)
        .eq('id', artifactId)
        .single()

      if (fetchError || !artifact) {
        return NextResponse.json(
          { success: false, error: 'Artifact not found' },
          { status: 404 }
        )
      }

      // Transform artifact data
      const engagement = Array.isArray(artifact.engagement)
        ? artifact.engagement[0]
        : artifact.engagement
      const client = engagement
        ? (Array.isArray(engagement.client) ? engagement.client[0] : engagement.client)
        : null

      const artifactData: ArtifactPDFData = {
        id: artifact.id,
        name: artifact.name,
        templateId: artifact.template_id,
        content: artifact.content as Record<string, unknown>,
        engagement: {
          id: engagement?.id || '',
          name: engagement?.name || '',
          pathway: engagement?.pathway || '',
          client: {
            name: client?.name || 'Unknown Client',
            industry: client?.industry,
          },
        },
        createdAt: artifact.created_at,
        updatedAt: artifact.updated_at,
      }

      // Generate PDF
      const result = await generatePDF(artifactData, options as PDFGenerationOptions)

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        )
      }

      // Log the export for audit
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'pdf_export',
        entity_type: 'artifact',
        entity_id: artifactId,
        metadata: {
          filename: result.filename,
          pageCount: result.pageCount,
          sizeBytes: result.sizeBytes,
          generationTimeMs: result.generationTimeMs,
        },
      })

      return NextResponse.json({
        success: true,
        filename: result.filename,
        pageCount: result.pageCount,
        sizeBytes: result.sizeBytes,
        generationTimeMs: result.generationTimeMs,
        pdfBase64: result.pdfBase64,
        totalTimeMs: Math.round(performance.now() - startTime),
      })
    }

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'PDF generation failed',
        totalTimeMs: Math.round(performance.now() - startTime),
      },
      { status: 500 }
    )
  }
}

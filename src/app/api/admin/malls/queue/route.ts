import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/malls/queue
 *
 * Fetches all malls with extraction progress info for queue view
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Get filter parameters
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''

    // Build query
    let query = supabase
      .from('malls')
      .select(`
        id,
        name,
        slug,
        extraction_status,
        extraction_progress,
        hero_image,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('extraction_status', status)
    }

    // Apply search filter
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data: malls, error } = await query

    if (error) {
      console.error('Failed to fetch malls queue:', error)
      return NextResponse.json(
        { error: 'Failed to fetch malls' },
        { status: 500 }
      )
    }

    // Transform data for frontend
    const queueItems = (malls || []).map(mall => {
      const steps = mall.extraction_progress?.steps || []
      const completedSteps = steps.filter((s: any) => s.status === 'completed').length
      const totalSteps = steps.length || 12
      const currentStep = steps.find((s: any) => s.status === 'running')
      const failedStep = steps.find((s: any) => s.status === 'failed')

      return {
        id: mall.id,
        name: mall.name,
        status: mall.extraction_status,
        progress_percentage: Math.round((completedSteps / totalSteps) * 100),
        completed_steps: completedSteps,
        total_steps: totalSteps,
        current_step: currentStep?.displayName || currentStep?.name || null,
        error_message: failedStep?.error || mall.extraction_progress?.error || null,
        thumbnail_url: mall.hero_image,
        created_at: mall.created_at,
        updated_at: mall.updated_at
      }
    })

    return NextResponse.json({
      success: true,
      malls: queueItems
    })

  } catch (error) {
    console.error('Mall queue fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

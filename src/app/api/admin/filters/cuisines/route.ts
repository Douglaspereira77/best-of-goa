import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/filters/cuisines
 *
 * Returns all available cuisines for filtering
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Database connection not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient()

    const { data: cuisines, error } = await supabase
      .from('restaurants_cuisines')
      .select('id, name')
      .order('name')

    if (error) {
      console.error('Failed to fetch cuisines:', error)
      return NextResponse.json(
        { error: 'Failed to fetch cuisines' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      cuisines: cuisines || []
    })
  } catch (error) {
    console.error('Cuisines fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

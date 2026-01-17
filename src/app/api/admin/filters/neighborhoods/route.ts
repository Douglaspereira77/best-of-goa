import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/filters/neighborhoods
 *
 * Returns all available neighborhoods (governorates) for filtering
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

    const { data: neighborhoods, error } = await supabase
      .from('restaurant_neighborhoods')
      .select('id, name')
      .order('name')

    if (error) {
      console.error('Failed to fetch neighborhoods:', error)
      return NextResponse.json(
        { error: 'Failed to fetch neighborhoods' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      neighborhoods: neighborhoods || []
    })
  } catch (error) {
    console.error('Neighborhoods fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

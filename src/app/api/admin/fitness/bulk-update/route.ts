import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { ids, gender_policy } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'No fitness place IDs provided' },
        { status: 400 }
      )
    }

    if (!gender_policy) {
      return NextResponse.json(
        { error: 'No gender_policy value provided' },
        { status: 400 }
      )
    }

    // Validate gender_policy value
    const validPolicies = ['women-only', 'men-only', 'co-ed']
    if (!validPolicies.includes(gender_policy)) {
      return NextResponse.json(
        { error: `Invalid gender_policy value. Must be one of: ${validPolicies.join(', ')}` },
        { status: 400 }
      )
    }

    // Update all selected fitness places
    const { data, error } = await supabase
      .from('fitness_places')
      .update({ gender_policy, updated_at: new Date().toISOString() })
      .in('id', ids)
      .select('id, name, gender_policy')

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      updated_count: data?.length || 0,
      updated_places: data
    })
  } catch (error) {
    console.error('[API] Failed to bulk update fitness places:', error)
    return NextResponse.json(
      { error: 'Failed to bulk update fitness places' },
      { status: 500 }
    )
  }
}

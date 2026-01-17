import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/restaurants/check-duplicate
 * 
 * Checks for duplicate restaurants before starting extraction
 * Matches by google_place_id (exact) and name + area (fuzzy)
 */
export async function POST(request: NextRequest) {
  try {
    const { placeId, name, area } = await request.json()

    if (!placeId || !name || !area) {
      return NextResponse.json(
        { error: 'placeId, name, and area are required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not configured')
      return NextResponse.json(
        { error: 'Database connection not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient()

    // Check for exact match by Google Place ID
    const { data: exactMatch, error: exactError } = await supabase
      .from('restaurants')
      .select('id, name, slug, address, area, verified, active, google_place_id')
      .eq('google_place_id', placeId)
      .single()

    if (exactError && exactError.code !== 'PGRST116') {
      console.error('Error checking exact match:', exactError)
      return NextResponse.json(
        { error: 'Failed to check for duplicates' },
        { status: 500 }
      )
    }

    // If exact match found, return it
    if (exactMatch) {
      return NextResponse.json({
        success: true,
        exists: true,
        match_type: 'exact',
        restaurants: [exactMatch]
      })
    }

    // Check for fuzzy match by name and area
    const { data: fuzzyMatches, error: fuzzyError } = await supabase
      .from('restaurants')
      .select('id, name, slug, address, area, verified, active, google_place_id')
      .ilike('name', `%${name}%`)
      .ilike('area', `%${area}%`)

    if (fuzzyError) {
      console.error('Error checking fuzzy match:', fuzzyError)
      return NextResponse.json(
        { error: 'Failed to check for duplicates' },
        { status: 500 }
      )
    }

    // Filter fuzzy matches by similarity score
    const similarRestaurants = fuzzyMatches.filter(restaurant => {
      const nameSimilarity = calculateSimilarity(name.toLowerCase(), restaurant.name.toLowerCase())
      const areaSimilarity = calculateSimilarity(area.toLowerCase(), restaurant.area.toLowerCase())
      
      // For same restaurant chain in different locations, only check name similarity
      // For same area, check both name and area similarity
      if (areaSimilarity > 0.8) {
        // Same area - require both name and area to be similar
        return nameSimilarity > 0.8 && areaSimilarity > 0.6
      } else {
        // Different area - only check name similarity (allow different outlets)
        return nameSimilarity > 0.9
      }
    })

    if (similarRestaurants.length > 0) {
      return NextResponse.json({
        success: true,
        exists: true,
        match_type: 'fuzzy',
        restaurants: similarRestaurants
      })
    }

    // No duplicates found
    return NextResponse.json({
      success: true,
      exists: false,
      match_type: null,
      restaurants: []
    })

  } catch (error) {
    console.error('Duplicate check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) {
    return 1.0
  }
  
  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

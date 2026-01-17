import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request: NextRequest) {
  try {
    const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY

    const { query } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    if (!googlePlacesApiKey) {
      return NextResponse.json(
        { error: 'Google Places API key not configured' },
        { status: 500 }
      )
    }

    // Search Google Places
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      query
    )}&key=${googlePlacesApiKey}`

    const response = await axios.get(searchUrl)

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${response.data.status}`)
    }

    const results = (response.data.results || []).slice(0, 10).map((place: any) => ({
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      geometry: place.geometry,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      types: place.types,
      opening_hours: place.opening_hours
    }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error('[API] Google Places search failed:', error)
    return NextResponse.json(
      { error: 'Failed to search Google Places' },
      { status: 500 }
    )
  }
}

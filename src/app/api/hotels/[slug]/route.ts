import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient()
    const { slug } = await params

    // Fetch hotel data
    const { data: hotel, error } = await supabase
      .from('hotels')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !hotel) {
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 404 }
      )
    }

    // Fetch hotel images
    const { data: images } = await supabase
      .from('hotel_images')
      .select('*')
      .eq('hotel_id', hotel.id)
      .order('display_order', { ascending: true })

    // Fetch hotel reviews (if any)
    const { data: reviews } = await supabase
      .from('hotel_reviews')
      .select('*')
      .eq('hotel_id', hotel.id)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      hotel: {
        ...hotel,
        images: images || [],
        reviews: reviews || []
      }
    })

  } catch (error) {
    console.error('Hotel API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()

    const { data: attraction, error } = await supabase
      .from('attractions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw error
    }

    if (!attraction) {
      return NextResponse.json({ error: 'Attraction not found' }, { status: 404 })
    }

    // Fetch images for this attraction
    const { data: images } = await supabase
      .from('attraction_images')
      .select('*')
      .eq('attraction_id', id)
      .order('display_order')

    // Map images to frontend format
    const mappedImages = (images || []).map((img: any) => ({
      id: img.id,
      url: img.url,
      alt: img.alt_text,
      status: img.approved ? 'approved' : 'pending',
      quality: img.metadata?.hero_score,
      tags: img.metadata?.content_classification || [],
      isHero: img.is_hero,
      displayOrder: img.display_order
    }))

    // Map to frontend format
    const mappedAttraction = {
      id: attraction.id,
      name: attraction.name,
      nameAr: attraction.name_ar,
      slug: attraction.slug,
      description: attraction.description,
      shortDescription: attraction.short_description,
      address: attraction.address,
      area: attraction.area,
      attractionType: attraction.attraction_type,
      isFree: attraction.is_free || false,
      admissionFee: attraction.admission_fee,
      typicalVisitDuration: attraction.typical_visit_duration,
      ageSuitability: attraction.age_suitability,
      bestTimeToVisit: attraction.best_time_to_visit,
      wheelchairAccessible: attraction.wheelchair_accessible || false,
      parkingAvailable: attraction.parking_available || false,
      guidedToursAvailable: attraction.guided_tours_available || false,
      audioGuideAvailable: attraction.audio_guide_available || false,
      photographyAllowed: attraction.photography_allowed !== false,
      phone: attraction.phone,
      email: attraction.email,
      website: attraction.website,
      instagram: attraction.instagram,
      facebook: attraction.facebook,
      twitter: attraction.twitter,
      googleRating: attraction.google_rating,
      googleReviewCount: attraction.google_review_count,
      metaTitle: attraction.meta_title,
      metaDescription: attraction.meta_description,
      metaKeywords: attraction.meta_keywords || [],
      heroImage: attraction.hero_image,
      openingHours: attraction.opening_hours,
      extractionStatus: attraction.extraction_status,
      verified: attraction.verified || false,
      featured: attraction.featured || false,
      active: attraction.active || false,
      createdAt: attraction.created_at,
      updatedAt: attraction.updated_at
    }

    return NextResponse.json({ attraction: mappedAttraction, images: mappedImages })
  } catch (error) {
    console.error('[API] Failed to load attraction:', error)
    return NextResponse.json({ error: 'Failed to load attraction' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()
    const body = await request.json()

    // Map from frontend to database format
    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.nameAr !== undefined) updateData.name_ar = body.nameAr
    if (body.description !== undefined) updateData.description = body.description
    if (body.shortDescription !== undefined) updateData.short_description = body.shortDescription
    if (body.address !== undefined) updateData.address = body.address
    if (body.area !== undefined) updateData.area = body.area
    if (body.attractionType !== undefined) updateData.attraction_type = body.attractionType
    if (body.isFree !== undefined) updateData.is_free = body.isFree
    if (body.admissionFee !== undefined) updateData.admission_fee = body.admissionFee
    if (body.typicalVisitDuration !== undefined)
      updateData.typical_visit_duration = body.typicalVisitDuration
    if (body.ageSuitability !== undefined) updateData.age_suitability = body.ageSuitability
    if (body.bestTimeToVisit !== undefined) updateData.best_time_to_visit = body.bestTimeToVisit
    if (body.wheelchairAccessible !== undefined)
      updateData.wheelchair_accessible = body.wheelchairAccessible
    if (body.parkingAvailable !== undefined) updateData.parking_available = body.parkingAvailable
    if (body.guidedToursAvailable !== undefined)
      updateData.guided_tours_available = body.guidedToursAvailable
    if (body.audioGuideAvailable !== undefined)
      updateData.audio_guide_available = body.audioGuideAvailable
    if (body.photographyAllowed !== undefined)
      updateData.photography_allowed = body.photographyAllowed
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.email !== undefined) updateData.email = body.email
    if (body.website !== undefined) updateData.website = body.website
    if (body.instagram !== undefined) updateData.instagram = body.instagram
    if (body.facebook !== undefined) updateData.facebook = body.facebook
    if (body.twitter !== undefined) updateData.twitter = body.twitter
    if (body.metaTitle !== undefined) updateData.meta_title = body.metaTitle
    if (body.metaDescription !== undefined) updateData.meta_description = body.metaDescription
    if (body.metaKeywords !== undefined) updateData.meta_keywords = body.metaKeywords

    const { data: updatedAttraction, error } = await supabase
      .from('attractions')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    // Re-map to frontend format
    const mappedAttraction = {
      id: updatedAttraction.id,
      name: updatedAttraction.name,
      nameAr: updatedAttraction.name_ar,
      slug: updatedAttraction.slug,
      description: updatedAttraction.description,
      shortDescription: updatedAttraction.short_description,
      address: updatedAttraction.address,
      area: updatedAttraction.area,
      attractionType: updatedAttraction.attraction_type,
      isFree: updatedAttraction.is_free || false,
      admissionFee: updatedAttraction.admission_fee,
      typicalVisitDuration: updatedAttraction.typical_visit_duration,
      ageSuitability: updatedAttraction.age_suitability,
      bestTimeToVisit: updatedAttraction.best_time_to_visit,
      wheelchairAccessible: updatedAttraction.wheelchair_accessible || false,
      parkingAvailable: updatedAttraction.parking_available || false,
      guidedToursAvailable: updatedAttraction.guided_tours_available || false,
      audioGuideAvailable: updatedAttraction.audio_guide_available || false,
      photographyAllowed: updatedAttraction.photography_allowed !== false,
      phone: updatedAttraction.phone,
      email: updatedAttraction.email,
      website: updatedAttraction.website,
      instagram: updatedAttraction.instagram,
      facebook: updatedAttraction.facebook,
      twitter: updatedAttraction.twitter,
      googleRating: updatedAttraction.google_rating,
      googleReviewCount: updatedAttraction.google_review_count,
      metaTitle: updatedAttraction.meta_title,
      metaDescription: updatedAttraction.meta_description,
      metaKeywords: updatedAttraction.meta_keywords || [],
      heroImage: updatedAttraction.hero_image,
      openingHours: updatedAttraction.opening_hours,
      extractionStatus: updatedAttraction.extraction_status,
      verified: updatedAttraction.verified || false,
      featured: updatedAttraction.featured || false,
      active: updatedAttraction.active || false,
      createdAt: updatedAttraction.created_at,
      updatedAt: updatedAttraction.updated_at
    }

    return NextResponse.json({ attraction: mappedAttraction })
  } catch (error) {
    console.error('[API] Failed to update attraction:', error)
    return NextResponse.json({ error: 'Failed to update attraction' }, { status: 500 })
  }
}

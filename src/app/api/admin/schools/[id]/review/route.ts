import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'




export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()

    const { data: school, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw error
    }

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    // Map to frontend format (camelCase)
    const mappedSchool = {
      id: school.id,
      name: school.name,
      nameAr: school.name_ar,
      slug: school.slug,
      description: school.description,
      shortDescription: school.short_description,
      address: school.address,
      area: school.area,
      governorate: school.governorate,
      phone: school.phone,
      email: school.email,
      website: school.website,
      instagram: school.instagram,
      facebook: school.facebook,
      twitter: school.twitter,
      tiktok: school.tiktok,
      youtube: school.youtube,
      linkedin: school.linkedin,
      snapchat: school.snapchat,
      whatsapp: school.whatsapp,
      schoolType: school.school_type,
      curriculum: school.curriculum || [],
      gradeLevels: school.grade_levels || [],
      minGrade: school.min_grade,
      maxGrade: school.max_grade,
      yearEstablished: school.year_established,
      genderPolicy: school.gender_policy,
      tuitionRangeMin: school.tuition_range_min,
      tuitionRangeMax: school.tuition_range_max,
      currency: school.currency || 'KWD',
      googleRating: school.google_rating,
      googleReviewCount: school.google_review_count,
      parentRating: school.parent_rating,
      metaTitle: school.meta_title,
      metaDescription: school.meta_description,
      metaKeywords: school.meta_keywords || [],
      heroImage: school.hero_image,
      logoImage: school.logo_image,
      extractionStatus: school.extraction_status,
      verified: school.verified || false,
      featured: school.featured || false,
      active: school.active || false,
      published: school.published || false,
      createdAt: school.created_at,
      updatedAt: school.updated_at
    }

    return NextResponse.json({ school: mappedSchool })
  } catch (error) {
    console.error('[API] Failed to load school:', error)
    return NextResponse.json({ error: 'Failed to load school' }, { status: 500 })
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

    // Map from frontend (camelCase) to database (snake_case)
    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.nameAr !== undefined) updateData.name_ar = body.nameAr
    if (body.description !== undefined) updateData.description = body.description
    if (body.shortDescription !== undefined) updateData.short_description = body.shortDescription
    if (body.address !== undefined) updateData.address = body.address
    if (body.area !== undefined) updateData.area = body.area
    if (body.governorate !== undefined) updateData.governorate = body.governorate
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.email !== undefined) updateData.email = body.email
    if (body.website !== undefined) updateData.website = body.website
    if (body.instagram !== undefined) updateData.instagram = body.instagram
    if (body.facebook !== undefined) updateData.facebook = body.facebook
    if (body.twitter !== undefined) updateData.twitter = body.twitter
    if (body.tiktok !== undefined) updateData.tiktok = body.tiktok
    if (body.youtube !== undefined) updateData.youtube = body.youtube
    if (body.linkedin !== undefined) updateData.linkedin = body.linkedin
    if (body.snapchat !== undefined) updateData.snapchat = body.snapchat
    if (body.whatsapp !== undefined) updateData.whatsapp = body.whatsapp
    if (body.schoolType !== undefined) updateData.school_type = body.schoolType
    if (body.curriculum !== undefined) updateData.curriculum = body.curriculum
    if (body.gradeLevels !== undefined) updateData.grade_levels = body.gradeLevels
    if (body.minGrade !== undefined) updateData.min_grade = body.minGrade
    if (body.maxGrade !== undefined) updateData.max_grade = body.maxGrade
    if (body.yearEstablished !== undefined) updateData.year_established = body.yearEstablished
    if (body.genderPolicy !== undefined) updateData.gender_policy = body.genderPolicy
    if (body.tuitionRangeMin !== undefined) updateData.tuition_range_min = body.tuitionRangeMin
    if (body.tuitionRangeMax !== undefined) updateData.tuition_range_max = body.tuitionRangeMax
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.metaTitle !== undefined) updateData.meta_title = body.metaTitle
    if (body.metaDescription !== undefined) updateData.meta_description = body.metaDescription
    if (body.metaKeywords !== undefined) updateData.meta_keywords = body.metaKeywords

    const { data: updatedSchool, error } = await supabase
      .from('schools')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    // Re-map to frontend format
    const mappedSchool = {
      id: updatedSchool.id,
      name: updatedSchool.name,
      nameAr: updatedSchool.name_ar,
      slug: updatedSchool.slug,
      description: updatedSchool.description,
      shortDescription: updatedSchool.short_description,
      address: updatedSchool.address,
      area: updatedSchool.area,
      governorate: updatedSchool.governorate,
      phone: updatedSchool.phone,
      email: updatedSchool.email,
      website: updatedSchool.website,
      instagram: updatedSchool.instagram,
      facebook: updatedSchool.facebook,
      twitter: updatedSchool.twitter,
      tiktok: updatedSchool.tiktok,
      youtube: updatedSchool.youtube,
      linkedin: updatedSchool.linkedin,
      snapchat: updatedSchool.snapchat,
      whatsapp: updatedSchool.whatsapp,
      schoolType: updatedSchool.school_type,
      curriculum: updatedSchool.curriculum || [],
      gradeLevels: updatedSchool.grade_levels || [],
      minGrade: updatedSchool.min_grade,
      maxGrade: updatedSchool.max_grade,
      yearEstablished: updatedSchool.year_established,
      genderPolicy: updatedSchool.gender_policy,
      tuitionRangeMin: updatedSchool.tuition_range_min,
      tuitionRangeMax: updatedSchool.tuition_range_max,
      currency: updatedSchool.currency || 'KWD',
      googleRating: updatedSchool.google_rating,
      googleReviewCount: updatedSchool.google_review_count,
      parentRating: updatedSchool.parent_rating,
      metaTitle: updatedSchool.meta_title,
      metaDescription: updatedSchool.meta_description,
      metaKeywords: updatedSchool.meta_keywords || [],
      heroImage: updatedSchool.hero_image,
      logoImage: updatedSchool.logo_image,
      extractionStatus: updatedSchool.extraction_status,
      verified: updatedSchool.verified || false,
      featured: updatedSchool.featured || false,
      active: updatedSchool.active || false,
      published: updatedSchool.published || false,
      createdAt: updatedSchool.created_at,
      updatedAt: updatedSchool.updated_at
    }

    return NextResponse.json({ school: mappedSchool })
  } catch (error) {
    console.error('[API] Failed to update school:', error)
    return NextResponse.json({ error: 'Failed to update school' }, { status: 500 })
  }
}






























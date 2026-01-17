import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient } from '@/lib/services/openai-client'

// GET - Fetch all images for a school
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()

    // First try school_images table
    const { data: images, error } = await supabase
      .from('school_images')
      .select('*')
      .eq('school_id', id)
      .order('display_order')

    if (error) throw error

    // If we have images from the table, return them
    if (images && images.length > 0) {
      return NextResponse.json({ images })
    }

    // Fallback: Check photos column on schools table
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('photos, hero_image, name')
      .eq('id', id)
      .single()

    if (schoolError) throw schoolError

    // Convert photos array to image format for display
    if (school?.photos && Array.isArray(school.photos) && school.photos.length > 0) {
      const fallbackImages = school.photos.map((url: string, index: number) => ({
        id: `photos-${index}`,
        school_id: id,
        url: url,
        alt_text: `${school.name || 'School'} - Photo ${index + 1}`,
        type: 'photo',
        is_hero: url === school.hero_image,
        is_active: true,
        display_order: index + 1,
        source: 'photos_column'
      }))
      return NextResponse.json({ images: fallbackImages, fromPhotosColumn: true })
    }

    return NextResponse.json({ images: [] })
  } catch (error) {
    console.error('[API] Failed to fetch images:', error)
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
  }
}

// POST - Upload a new image with AI analysis (hybrid approach)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const altText = formData.get('altText') as string || ''
    const isMultiUpload = formData.get('isMultiUpload') === 'true'
    const totalFiles = parseInt(formData.get('totalFiles') as string || '1', 10)

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const { data: school } = await supabase
      .from('schools')
      .select('slug, name')
      .eq('id', id)
      .single()

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'

    // Hybrid approach: Analyze single uploads sync, skip for multi-uploads (3+)
    let imageAnalysis: {
      filename_description: string
      alt_text: string
      tags: string[]
      image_type: string
      quality_score: number
      description: string
    } | null = null

    const shouldAnalyze = !isMultiUpload || totalFiles < 3

    if (shouldAnalyze) {
      try {
        const openai = getOpenAIClient()
        imageAnalysis = await openai.analyzeImage(buffer, school.name, 'school')
      } catch (analysisError) {
        console.error('[API] Image analysis failed, using fallback:', analysisError)
      }
    }

    const filenameBase = imageAnalysis?.filename_description || `manual-${Date.now()}`
    const filename = `${school.slug}-${filenameBase}.${ext}`
    const path = `schools/${school.slug}/images/${filename}`

    const { error: uploadError } = await supabase.storage
      .from('schools')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from('schools')
      .getPublicUrl(path)

    const { data: maxOrderResult } = await supabase
      .from('school_images')
      .select('display_order')
      .eq('school_id', id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxOrderResult?.display_order || 0) + 1
    const finalAltText = altText || imageAnalysis?.alt_text || `${school.name} image`

    const { data: newImage, error: insertError } = await supabase
      .from('school_images')
      .insert({
        school_id: id,
        url: urlData.publicUrl,
        alt_text: finalAltText,
        type: imageAnalysis?.image_type || 'manual',
        source: 'manual_upload',
        is_hero: false,
        is_active: true,
        display_order: nextOrder,
        quality_score: imageAnalysis?.quality_score || null,
        metadata: {
          filename,
          path,
          original_filename: file.name,
          uploaded_at: new Date().toISOString(),
          ai_analyzed: !!imageAnalysis,
          ai_description: imageAnalysis?.description || null,
          ai_tags: imageAnalysis?.tags || [],
          ai_image_type: imageAnalysis?.image_type || null
        }
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({
      success: true,
      image: {
        id: newImage.id,
        url: newImage.url,
        alt: newImage.alt_text,
        status: 'approved',
        isHero: newImage.is_hero,
        displayOrder: newImage.display_order,
        qualityScore: newImage.quality_score,
        aiAnalyzed: !!imageAnalysis
      }
    })
  } catch (error) {
    console.error('[API] Failed to upload image:', error)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}

// PATCH - Update image (approve/reject/set hero)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()
    const body = await request.json()

    const { imageId, action, altText, imageUrl } = body

    if (!imageId || !action) {
      return NextResponse.json({ error: 'Missing imageId or action' }, { status: 400 })
    }

    // Handle fallback images from photos column (IDs like "photos-0", "photos-1")
    if (imageId.startsWith('photos-')) {
      // For photos column images, we can only set hero
      if (action === 'set_hero' && imageUrl) {
        await supabase
          .from('schools')
          .update({ hero_image: imageUrl })
          .eq('id', id)
        return NextResponse.json({ success: true })
      }
      // Approve/reject don't apply to photos column (they're always active)
      if (action === 'approve' || action === 'reject') {
        return NextResponse.json({ success: true, message: 'Photos column images are always active' })
      }
      return NextResponse.json({ error: 'Invalid action for photos column image' }, { status: 400 })
    }

    // Handle regular school_images table records
    let updateData: Record<string, any> = {}

    switch (action) {
      case 'approve':
        updateData = { is_active: true }
        break
      case 'reject':
        updateData = { is_active: false }
        break
      case 'set_hero':
        await supabase
          .from('school_images')
          .update({ is_hero: false })
          .eq('school_id', id)

        updateData = { is_hero: true }

        const { data: heroImage } = await supabase
          .from('school_images')
          .select('url')
          .eq('id', imageId)
          .single()

        if (heroImage) {
          await supabase
            .from('schools')
            .update({ hero_image: heroImage.url })
            .eq('id', id)
        }
        break
      case 'update_alt':
        updateData = { alt_text: altText }
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { error } = await supabase
      .from('school_images')
      .update(updateData)
      .eq('id', imageId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Failed to update image:', error)
    return NextResponse.json({ error: 'Failed to update image' }, { status: 500 })
  }
}

// DELETE - Remove an image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('imageId')
    const imageUrl = searchParams.get('imageUrl')

    if (!imageId) {
      return NextResponse.json({ error: 'Missing imageId' }, { status: 400 })
    }

    // Handle fallback images from photos column (IDs like "photos-0", "photos-1")
    if (imageId.startsWith('photos-') && imageUrl) {
      // Get current photos array
      const { data: school, error: fetchError } = await supabase
        .from('schools')
        .select('photos, hero_image')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // Remove the URL from photos array
      const updatedPhotos = (school.photos || []).filter((url: string) => url !== imageUrl)

      // Update school record
      const updateData: Record<string, any> = { photos: updatedPhotos }

      // If deleted image was hero, clear hero_image
      if (school.hero_image === imageUrl) {
        updateData.hero_image = updatedPhotos.length > 0 ? updatedPhotos[0] : null
      }

      await supabase
        .from('schools')
        .update(updateData)
        .eq('id', id)

      return NextResponse.json({ success: true })
    }

    // Handle regular school_images table records
    const { data: image } = await supabase
      .from('school_images')
      .select('*')
      .eq('id', imageId)
      .single()

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    if (image.is_hero) {
      await supabase
        .from('schools')
        .update({ hero_image: null })
        .eq('id', id)
    }

    const { error } = await supabase
      .from('school_images')
      .delete()
      .eq('id', imageId)

    if (error) throw error

    if (image.metadata?.path) {
      await supabase.storage.from('schools').remove([image.metadata.path])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Failed to delete image:', error)
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
  }
}

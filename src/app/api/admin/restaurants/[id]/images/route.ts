import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient } from '@/lib/services/openai-client'

// GET - Fetch all images for a restaurant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()

    const { data: images, error } = await supabase
      .from('restaurant_images')
      .select('*')
      .eq('restaurant_id', id)
      .order('display_order')

    if (error) throw error

    return NextResponse.json({ images: images || [] })
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

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('slug, name')
      .eq('id', id)
      .single()

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
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
        imageAnalysis = await openai.analyzeImage(buffer, restaurant.name, 'restaurant')
      } catch (analysisError) {
        console.error('[API] Image analysis failed, using fallback:', analysisError)
      }
    }

    const filenameBase = imageAnalysis?.filename_description || `manual-${Date.now()}`
    const filename = `${restaurant.slug}-${filenameBase}.${ext}`
    const path = `restaurants/${restaurant.slug}/images/${filename}`

    const { error: uploadError } = await supabase.storage
      .from('restaurants')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from('restaurants')
      .getPublicUrl(path)

    const { data: maxOrderResult } = await supabase
      .from('restaurant_images')
      .select('display_order')
      .eq('restaurant_id', id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxOrderResult?.display_order || 0) + 1
    const finalAltText = altText || imageAnalysis?.alt_text || `${restaurant.name} image`

    const { data: newImage, error: insertError } = await supabase
      .from('restaurant_images')
      .insert({
        restaurant_id: id,
        url: urlData.publicUrl,
        alt_text: finalAltText,
        type: imageAnalysis?.image_type || 'manual',
        source: 'manual_upload',
        is_hero: false,
        approved: true,
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

    // Check if imageId is a valid UUID (restaurant_images table uses UUIDs)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(imageId)

    // If not a UUID, it's from the photos JSON column (filename or photo-N format)
    if (!isUUID) {
      // For fallback images, only set_hero is supported
      if (action === 'set_hero' && imageUrl) {
        await supabase
          .from('restaurant_images')
          .update({ is_hero: false })
          .eq('restaurant_id', id)

        // Get current photos array and update primary flags
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('photos')
          .eq('id', id)
          .single()

        let updatedPhotos = restaurant?.photos
        if (updatedPhotos && Array.isArray(updatedPhotos)) {
          updatedPhotos = updatedPhotos.map((photo: any) => ({
            ...photo,
            primary: photo.url === imageUrl
          }))
        }

        await supabase
          .from('restaurants')
          .update({
            hero_image: imageUrl,
            photos: updatedPhotos
          })
          .eq('id', id)

        return NextResponse.json({ success: true })
      }

      // approve/reject don't apply to photos JSON (they're always active)
      if (action === 'approve' || action === 'reject') {
        return NextResponse.json({ success: true })
      }

      return NextResponse.json({ error: 'Action not supported for this image type' }, { status: 400 })
    }

    // Standard update for restaurant_images table
    let updateData: Record<string, any> = {}

    switch (action) {
      case 'approve':
        updateData = { approved: true }
        break
      case 'reject':
        updateData = { approved: false }
        break
      case 'set_hero':
        await supabase
          .from('restaurant_images')
          .update({ is_hero: false })
          .eq('restaurant_id', id)

        updateData = { is_hero: true }

        const { data: heroImage } = await supabase
          .from('restaurant_images')
          .select('url')
          .eq('id', imageId)
          .single()

        if (heroImage) {
          await supabase
            .from('restaurants')
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
      .from('restaurant_images')
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

    // Check if imageId is a valid UUID (restaurant_images table uses UUIDs)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(imageId)

    // If not a UUID, it's from the photos JSON column (filename or photo-N format)
    if (!isUUID && imageUrl) {
      // Delete from photos JSON array on restaurants table
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('photos, hero_image')
        .eq('id', id)
        .single()

      if (!restaurant || !restaurant.photos) {
        return NextResponse.json({ error: 'Restaurant or photos not found' }, { status: 404 })
      }

      // Filter out the image by URL
      const updatedPhotos = restaurant.photos.filter((photo: any) => photo.url !== imageUrl)

      // If the deleted image was the hero, clear it
      const updateData: any = { photos: updatedPhotos }
      if (restaurant.hero_image === imageUrl) {
        updateData.hero_image = null
      }

      const { error } = await supabase
        .from('restaurants')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    // Standard deletion from restaurant_images table
    const { data: image } = await supabase
      .from('restaurant_images')
      .select('*')
      .eq('id', imageId)
      .single()

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    if (image.is_hero) {
      await supabase
        .from('restaurants')
        .update({ hero_image: null })
        .eq('id', id)
    }

    const { error } = await supabase
      .from('restaurant_images')
      .delete()
      .eq('id', imageId)

    if (error) throw error

    if (image.metadata?.path) {
      await supabase.storage.from('restaurants').remove([image.metadata.path])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Failed to delete image:', error)
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient } from '@/lib/services/openai-client'

// GET - Fetch all images for an attraction
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()

    const { data: images, error } = await supabase
      .from('attraction_images')
      .select('*')
      .eq('attraction_id', id)
      .order('display_order')

    if (error) {
      throw error
    }

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

    // Get attraction for slug
    const { data: attraction } = await supabase
      .from('attractions')
      .select('slug, name')
      .eq('id', id)
      .single()

    if (!attraction) {
      return NextResponse.json({ error: 'Attraction not found' }, { status: 404 })
    }

    // Convert file to buffer
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
        imageAnalysis = await openai.analyzeImage(buffer, attraction.name, 'attraction')
      } catch (analysisError) {
        console.error('[API] Image analysis failed, using fallback:', analysisError)
      }
    }

    // Generate filename based on analysis or fallback
    const filenameBase = imageAnalysis?.filename_description || `manual-${Date.now()}`
    const filename = `${attraction.slug}-${filenameBase}.${ext}`
    const path = `attractions/${attraction.slug}/images/${filename}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('attractions')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      throw uploadError
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('attractions')
      .getPublicUrl(path)

    // Get max display order
    const { data: maxOrderResult } = await supabase
      .from('attraction_images')
      .select('display_order')
      .eq('attraction_id', id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxOrderResult?.display_order || 0) + 1

    // Use AI-generated alt text or user-provided or fallback
    const finalAltText = altText || imageAnalysis?.alt_text || `${attraction.name} image`

    // Insert into database with AI metadata
    const { data: newImage, error: insertError } = await supabase
      .from('attraction_images')
      .insert({
        attraction_id: id,
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

    if (insertError) {
      throw insertError
    }

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

    const { imageId, action, altText } = body

    if (!imageId || !action) {
      return NextResponse.json({ error: 'Missing imageId or action' }, { status: 400 })
    }

    let updateData: Record<string, any> = {}

    switch (action) {
      case 'approve':
        updateData = { approved: true }
        break
      case 'reject':
        updateData = { approved: false }
        break
      case 'set_hero':
        // First, unset current hero
        await supabase
          .from('attraction_images')
          .update({ is_hero: false })
          .eq('attraction_id', id)

        // Set new hero
        updateData = { is_hero: true }

        // Also update the attraction's hero_image field
        const { data: heroImage } = await supabase
          .from('attraction_images')
          .select('url')
          .eq('id', imageId)
          .single()

        if (heroImage) {
          await supabase
            .from('attractions')
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
      .from('attraction_images')
      .update(updateData)
      .eq('id', imageId)

    if (error) {
      throw error
    }

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

    if (!imageId) {
      return NextResponse.json({ error: 'Missing imageId' }, { status: 400 })
    }

    // Get image to check if it's a hero and get path for storage deletion
    const { data: image } = await supabase
      .from('attraction_images')
      .select('*')
      .eq('id', imageId)
      .single()

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // If this was the hero, clear the attraction's hero_image
    if (image.is_hero) {
      await supabase
        .from('attractions')
        .update({ hero_image: null })
        .eq('id', id)
    }

    // Delete from database
    const { error } = await supabase
      .from('attraction_images')
      .delete()
      .eq('id', imageId)

    if (error) {
      throw error
    }

    // Try to delete from storage (don't fail if this fails)
    if (image.metadata?.path) {
      await supabase.storage
        .from('attractions')
        .remove([image.metadata.path])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Failed to delete image:', error)
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
  }
}

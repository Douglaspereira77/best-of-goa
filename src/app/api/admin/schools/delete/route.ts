import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Parse request body
    const { schoolId } = await request.json()

    if (!schoolId) {
      return NextResponse.json(
        { success: false, error: 'School ID is required' },
        { status: 400 }
      )
    }

    // 1. Fetch school to verify it exists
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id, name')
      .eq('id', schoolId)
      .single()

    if (schoolError || !school) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      )
    }

    // 2. Fetch all images for this school to get storage paths
    const { data: images, error: imagesError } = await supabase
      .from('school_images')
      .select('storage_path')
      .eq('school_id', schoolId)

    if (imagesError) {
      console.error('Error fetching school images:', imagesError)
    }

    // 3. Delete image files from Supabase Storage (best effort)
    let imagesDeleted = 0
    let imagesFailed = 0

    if (images && images.length > 0) {
      // Filter out null/undefined storage paths
      const validPaths = images
        .map(img => img.storage_path)
        .filter((path): path is string => !!path)

      if (validPaths.length > 0) {
        // Use Promise.allSettled for best-effort deletion
        const deleteResults = await Promise.allSettled(
          validPaths.map(async (path) => {
            const { error } = await supabase.storage
              .from('schools')
              .remove([path])

            if (error) {
              console.error(`Failed to delete image ${path}:`, error)
              throw error
            }
            return path
          })
        )

        // Count successes and failures
        deleteResults.forEach(result => {
          if (result.status === 'fulfilled') {
            imagesDeleted++
          } else {
            imagesFailed++
            console.error('Image deletion failed:', result.reason)
          }
        })
      }
    }

    // 4. Delete school from database (CASCADE will handle school_images table)
    const { error: deleteError } = await supabase
      .from('schools')
      .delete()
      .eq('id', schoolId)

    if (deleteError) {
      console.error('Error deleting school:', deleteError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete school from database',
          details: deleteError.message
        },
        { status: 500 }
      )
    }

    // 5. Return success with image deletion stats
    return NextResponse.json({
      success: true,
      message: `School "${school.name}" deleted successfully`,
      stats: {
        imagesDeleted,
        imagesFailed,
        totalImages: images?.length || 0
      }
    })

  } catch (error) {
    console.error('Error in delete school API:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

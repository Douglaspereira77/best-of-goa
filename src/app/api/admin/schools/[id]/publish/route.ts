import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()

    // Get request body to see if we're publishing or unpublishing
    const body = await request.json()
    const { action } = body // 'publish' or 'unpublish'

    if (!action || !['publish', 'unpublish'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "publish" or "unpublish"' },
        { status: 400 }
      )
    }

    // Get current school to check if it exists
    const { data: school, error: fetchError } = await supabase
      .from('schools')
      .select('id, name, published, active')
      .eq('id', id)
      .single()

    if (fetchError || !school) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      )
    }

    // Update the published status
    const newPublishedStatus = action === 'publish'

    const { error: updateError } = await supabase
      .from('schools')
      .update({
        published: newPublishedStatus,
        published_at: newPublishedStatus ? new Date().toISOString() : null,
        active: newPublishedStatus, // Set active to false when unpublishing
        verified: newPublishedStatus // Set verified to false when unpublishing
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating school published status:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update school status' },
        { status: 500 }
      )
    }

    const message = newPublishedStatus
      ? `School "${school.name}" published successfully`
      : `School "${school.name}" unpublished successfully`

    return NextResponse.json({
      success: true,
      message,
      published: newPublishedStatus
    })
  } catch (error) {
    console.error('Error in publish/unpublish API:', error)
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

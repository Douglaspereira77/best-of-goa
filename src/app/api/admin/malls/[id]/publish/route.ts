import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()

    const body = await request.json()
    const { action } = body

    if (!action || !['publish', 'unpublish'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "publish" or "unpublish"' },
        { status: 400 }
      )
    }

    const { data: mall, error: fetchError } = await supabase
      .from('malls')
      .select('id, name, published, active')
      .eq('id', id)
      .single()

    if (fetchError || !mall) {
      return NextResponse.json(
        { success: false, error: 'Mall not found' },
        { status: 404 }
      )
    }

    const newPublishedStatus = action === 'publish'

    const { error: updateError } = await supabase
      .from('malls')
      .update({
        published: newPublishedStatus,
        published_at: newPublishedStatus ? new Date().toISOString() : null,
        active: newPublishedStatus // Set active to false when unpublishing
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating mall published status:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update mall status' },
        { status: 500 }
      )
    }

    const message = newPublishedStatus
      ? `Mall "${mall.name}" published successfully`
      : `Mall "${mall.name}" unpublished successfully`

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

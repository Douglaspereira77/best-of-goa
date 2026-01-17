import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Create Supabase client inside handlers to avoid build-time initialization
function getSupabaseClient() {
  return createClient()
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabaseClient()
    const body = await request.json()
    const action = body.action as 'publish' | 'unpublish'

    if (!action || !['publish', 'unpublish'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "publish" or "unpublish"' },
        { status: 400 }
      )
    }

    const isPublish = action === 'publish'

    const { data, error } = await supabase
      .from('blog_articles')
      .update({
        status: isPublish ? 'published' : 'draft',
        published_at: isPublish ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('slug, category')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: isPublish ? 'Article published successfully' : 'Article unpublished successfully',
      slug: data?.slug,
      category: data?.category,
    })
  } catch (error) {
    console.error('Error publishing article:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Create Supabase client inside handlers to avoid build-time initialization
function getSupabaseClient() {
  return createClient()
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const supabase = getSupabaseClient()

    let query = supabase
      .from('blog_articles')
      .select('id, slug, category, title, excerpt, status, featured, published_at, created_at, updated_at, featured_image', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching blog articles:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const articles = (data || []).map(article => ({
      id: article.id,
      slug: article.slug,
      category: article.category,
      title: article.title,
      excerpt: article.excerpt,
      status: article.status,
      featured: article.featured,
      featuredImage: article.featured_image,
      publishedAt: article.published_at,
      createdAt: article.created_at,
      updatedAt: article.updated_at,
    }))

    return NextResponse.json({
      articles,
      pagination: {
        total: count || 0,
        limit,
      }
    })
  } catch (error) {
    console.error('Error in blog list API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

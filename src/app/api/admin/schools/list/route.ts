import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '100');

  const supabase = createClient();

  // Build the query
  let query = supabase
    .from('schools')
    .select('id, name, slug, area, extraction_status, google_rating, parent_rating, google_review_count, school_type, curriculum, hero_image, logo_image, tuition_range_min, published, created_at, updated_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(limit);

  // Apply status filter
  if (status && status !== 'all') {
    query = query.eq('extraction_status', status);
  }

  // Apply search filter
  if (search) {
    query = query.or(`name.ilike.%${search}%,area.ilike.%${search}%`);
  }

  const { data: schools, error, count } = await query;

  if (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schools' },
      { status: 500 }
    );
  }

  // Map to frontend format
  const formattedSchools = (schools || []).map(school => ({
    id: school.id,
    name: school.name,
    slug: school.slug,
    status: school.extraction_status || 'draft',
    area: school.area || '',
    rating: school.google_rating || school.parent_rating,
    reviewCount: school.google_review_count,
    schoolType: school.school_type,
    curriculum: school.curriculum,
    heroImage: school.hero_image,
    tuitionMin: school.tuition_range_min,
    logoImage: school.logo_image,
    published: school.published || false,
    createdAt: school.created_at
  }));

  return NextResponse.json({
    schools: formattedSchools,
    pagination: {
      total: count || 0,
      limit,
      page: 1
    }
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/malls/extraction-status/[mallId]
 *
 * Returns the current extraction status for a mall
 * Used for polling progress during extraction
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mallId: string }> }
) {
  try {
    const { mallId } = await params;

    if (!mallId) {
      return NextResponse.json(
        { error: 'mallId is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data: mall, error } = await supabase
      .from('malls')
      .select(`
        id,
        name,
        slug,
        extraction_status,
        extraction_progress,
        address,
        area,
        phone,
        website,
        instagram,
        facebook,
        twitter,
        google_rating,
        google_review_count,
        total_stores,
        total_parking_spaces,
        description,
        apify_output,
        firecrawl_output
      `)
      .eq('id', mallId)
      .single();

    if (error || !mall) {
      return NextResponse.json(
        { error: 'Mall not found' },
        { status: 404 }
      );
    }

    // Calculate progress percentage
    const steps = mall.extraction_progress?.steps || [];
    const completedSteps = steps.filter((s: any) => s.status === 'completed').length;
    const totalSteps = steps.length || 12;
    const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

    return NextResponse.json({
      success: true,
      status: mall.extraction_status,
      progress_percentage: progressPercentage,
      steps: steps,
      extracted_data: {
        name: mall.name,
        slug: mall.slug,
        address: mall.address,
        area: mall.area,
        phone: mall.phone,
        website: mall.website,
        instagram: mall.instagram,
        facebook: mall.facebook,
        twitter: mall.twitter,
        google_rating: mall.google_rating,
        google_review_count: mall.google_review_count,
        total_stores: mall.total_stores,
        total_parking_spaces: mall.total_parking_spaces,
        description: mall.description
      }
    });

  } catch (error) {
    console.error('Extraction status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

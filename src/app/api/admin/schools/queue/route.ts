import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient();

  // Get schools that are queued, processing, or recently completed
  const { data: schools, error } = await supabase
    .from('schools')
    .select('id, name, area, extraction_status, extraction_started_at, extraction_completed_at, current_extraction_step, created_at')
    .in('extraction_status', ['queued', 'processing', 'completed'])
    .order('extraction_started_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching queue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue' },
      { status: 500 }
    );
  }

  // Calculate progress for each school
  const schoolsWithProgress = (schools || []).map(school => {
    let progress = 0;

    if (school.extraction_status === 'completed') {
      progress = 100;
    } else if (school.extraction_status === 'processing') {
      // Estimate based on current step (12 total steps)
      const steps = [
        'initial_creation',
        'apify_fetch',
        'firecrawl_website',
        'social_media_search',
        'apify_reviews',
        'curriculum_detection',
        'tuition_extraction',
        'facilities_detection',
        'grade_level_mapping',
        'gender_policy_detection',
        'process_images',
        'ai_enhancement',
        'category_matching'
      ];
      const currentStepIndex = steps.indexOf(school.current_extraction_step || '');
      progress = currentStepIndex >= 0 ? Math.floor((currentStepIndex / steps.length) * 100) : 10;
    }

    return {
      id: school.id,
      name: school.name,
      area: school.area,
      extraction_status: school.extraction_status,
      extraction_started_at: school.extraction_started_at,
      extraction_completed_at: school.extraction_completed_at,
      extraction_progress: progress,
      current_step: school.current_extraction_step,
      created_at: school.created_at
    };
  });

  return NextResponse.json({
    schools: schoolsWithProgress
  });
}

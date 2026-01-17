import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = createClient();

    // Get all schools that have apify_output but no hero_image
    const { data: schools, error: fetchError } = await supabase
      .from('schools')
      .select('id, name, apify_output, hero_image')
      .is('hero_image', null);

    if (fetchError) {
      console.error('Error fetching schools:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch schools' },
        { status: 500 }
      );
    }

    if (!schools || schools.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No schools need image backfill',
        updated: 0
      });
    }

    console.log(`[Backfill] Found ${schools.length} schools without hero_image`);

    let updated = 0;
    const updates = [];

    for (const school of schools) {
      try {
        const apifyData = school.apify_output;
        if (!apifyData) continue;

        // Extract hero image from Apify data
        let heroImage: string | null = null;

        if (apifyData.imageUrls && Array.isArray(apifyData.imageUrls) && apifyData.imageUrls.length > 0) {
          heroImage = apifyData.imageUrls[0];
        } else if (apifyData.imageUrl) {
          heroImage = apifyData.imageUrl;
        }

        if (heroImage) {
          updates.push({
            id: school.id,
            hero_image: heroImage
          });
          console.log(`[Backfill] ${school.name}: Found image ${heroImage}`);
        } else {
          console.log(`[Backfill] ${school.name}: No image in Apify data`);
        }
      } catch (error) {
        console.error(`[Backfill] Error processing ${school.name}:`, error);
      }
    }

    // Bulk update schools with hero images
    if (updates.length > 0) {
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('schools')
          .update({ hero_image: update.hero_image })
          .eq('id', update.id);

        if (updateError) {
          console.error(`[Backfill] Error updating ${update.id}:`, updateError);
        } else {
          updated++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Backfilled ${updated} schools with hero images`,
      total: schools.length,
      updated
    });
  } catch (error) {
    console.error('[Backfill] Fatal error:', error);
    return NextResponse.json(
      { error: 'Failed to backfill images' },
      { status: 500 }
    );
  }
}


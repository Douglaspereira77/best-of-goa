#!/usr/bin/env node

/**
 * Extraction Progress Tracking Script
 *
 * Tracks progress toward 500-restaurant extraction goal with:
 * 1. Total count by status (completed, in_progress, failed)
 * 2. Geographic distribution across 6 governorates
 * 3. Cuisine distribution
 * 4. Daily extraction rate
 * 5. Estimated completion date
 * 6. Quality metrics
 *
 * Usage: node bin/extraction-progress.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GOAL = 500;
const TARGET_DISTRIBUTION = {
  'Salmiya': 83,
  'Goa City': 83,
  'Hawally': 83,
  'Farwaniya': 83,
  'Ahmadi': 83,
  'Jahra': 83
};

async function trackProgress() {
  console.log('ðŸ“Š BEST OF GOA - EXTRACTION PROGRESS TRACKER');
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\n');

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // 1. OVERALL PROGRESS
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  const { data: allRestaurants, error: allError } = await supabase
    .from('restaurants')
    .select('extraction_status, created_at');

  if (allError) {
    console.error('âŒ Error fetching restaurants:', allError.message);
    return;
  }

  const statusCounts = {
    completed: 0,
    in_progress: 0,
    failed: 0,
    pending: 0
  };

  allRestaurants.forEach(r => {
    const status = r.extraction_status || 'pending';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const totalExtracted = statusCounts.completed;
  const progressPercent = ((totalExtracted / GOAL) * 100).toFixed(1);
  const remaining = GOAL - totalExtracted;

  console.log('ðŸŽ¯ OVERALL PROGRESS');
  console.log('â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€');
  console.log(`Goal: ${GOAL} restaurants`);
  console.log(`Completed: ${statusCounts.completed} âœ…`);
  console.log(`In Progress: ${statusCounts.in_progress} â³`);
  console.log(`Failed: ${statusCounts.failed} âŒ`);
  console.log(`Pending: ${statusCounts.pending || 0} â¸ï¸`);
  console.log(`\nProgress: ${progressPercent}% complete`);
  console.log(`Remaining: ${remaining} restaurants\n`);

  // Progress bar
  const barLength = 50;
  const filledLength = Math.round((totalExtracted / GOAL) * barLength);
  const bar = 'â–ˆ'.repeat(filledLength) + 'â–‘'.repeat(barLength - filledLength);
  console.log(`[${bar}] ${totalExtracted}/${GOAL}\n`);

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // 2. GEOGRAPHIC DISTRIBUTION
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  const { data: byArea, error: areaError } = await supabase
    .from('restaurants')
    .select('area')
    .eq('extraction_status', 'completed');

  if (!areaError && byArea) {
    const areaCounts = {};
    byArea.forEach(r => {
      const area = r.area || 'Unknown';
      areaCounts[area] = (areaCounts[area] || 0) + 1;
    });

    console.log('ðŸ“ GEOGRAPHIC DISTRIBUTION');
    console.log('â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€');

    Object.keys(TARGET_DISTRIBUTION).forEach(area => {
      const current = areaCounts[area] || 0;
      const target = TARGET_DISTRIBUTION[area];
      const areaProgress = ((current / target) * 100).toFixed(0);
      const status = current >= target ? 'âœ…' : current >= target * 0.8 ? 'ðŸŸ¡' : 'ðŸ”´';

      console.log(`${area.padEnd(15)} ${current.toString().padStart(3)}/${target} (${areaProgress.toString().padStart(3)}%) ${status}`);
    });

    // Check for restaurants in unexpected areas
    const unexpectedAreas = Object.keys(areaCounts).filter(
      area => !Object.keys(TARGET_DISTRIBUTION).includes(area) && area !== 'Unknown'
    );

    if (unexpectedAreas.length > 0) {
      console.log('\nâš ï¸  Restaurants in unexpected areas:');
      unexpectedAreas.forEach(area => {
        console.log(`   ${area}: ${areaCounts[area]}`);
      });
    }

    console.log('');
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // 3. CUISINE DISTRIBUTION
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  const { data: cuisineData, error: cuisineError } = await supabase
    .from('restaurants')
    .select(`
      id,
      restaurant_cuisine_ids
    `)
    .eq('extraction_status', 'completed');

  if (!cuisineError && cuisineData) {
    // Get cuisine names
    const { data: cuisines } = await supabase
      .from('restaurants_cuisines')
      .select('id, name');

    const cuisineMap = {};
    cuisines?.forEach(c => {
      cuisineMap[c.id] = c.name;
    });

    const cuisineCounts = {};
    cuisineData.forEach(r => {
      if (r.restaurant_cuisine_ids && Array.isArray(r.restaurant_cuisine_ids)) {
        r.restaurant_cuisine_ids.forEach(cuisineId => {
          const cuisineName = cuisineMap[cuisineId] || 'Unknown';
          cuisineCounts[cuisineName] = (cuisineCounts[cuisineName] || 0) + 1;
        });
      }
    });

    console.log('ðŸ½ï¸  TOP CUISINES');
    console.log('â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€');

    const sortedCuisines = Object.entries(cuisineCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    sortedCuisines.forEach(([cuisine, count]) => {
      console.log(`${cuisine.padEnd(20)} ${count.toString().padStart(3)} restaurants`);
    });

    const unmappedCount = cuisineData.filter(r =>
      !r.restaurant_cuisine_ids || r.restaurant_cuisine_ids.length === 0
    ).length;

    if (unmappedCount > 0) {
      console.log(`\nâš ï¸  ${unmappedCount} restaurants without cuisine mapping`);
    }

    console.log('');
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // 4. EXTRACTION RATE & TIMELINE
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  const { data: recent, error: recentError } = await supabase
    .from('restaurants')
    .select('created_at')
    .eq('extraction_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(50);

  if (!recentError && recent && recent.length > 1) {
    // Calculate daily rate from last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentExtractions = recent.filter(r =>
      new Date(r.created_at) > sevenDaysAgo
    );

    const dailyRate = recentExtractions.length / 7;

    console.log('â±ï¸  EXTRACTION RATE');
    console.log('â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€');
    console.log(`Last 7 days: ${recentExtractions.length} restaurants`);
    console.log(`Average rate: ${dailyRate.toFixed(1)} per day`);

    if (dailyRate > 0) {
      const daysRemaining = Math.ceil(remaining / dailyRate);
      const completionDate = new Date(now.getTime() + daysRemaining * 24 * 60 * 60 * 1000);

      console.log(`\nEstimated completion: ${daysRemaining} days (${completionDate.toLocaleDateString()})`);

      if (daysRemaining > 14) {
        console.log(`âš ï¸  Current rate too slow to reach 500 by end of next week!`);
        const requiredRate = Math.ceil(remaining / 7);
        console.log(`   Need to extract ${requiredRate} per day to finish in 1 week`);
      } else {
        console.log(`âœ… On track to reach 500 restaurants within 2 weeks`);
      }
    }

    console.log('');
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // 5. QUALITY METRICS
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  const { data: qualityData, error: qualityError } = await supabase
    .from('restaurants')
    .select(`
      id,
      photos,
      ai_enhancement_output,
      seo_metadata,
      average_rating,
      restaurant_cuisine_ids
    `)
    .eq('extraction_status', 'completed');

  if (!qualityError && qualityData) {
    const qualityMetrics = {
      withPhotos: 0,
      with5PlusPhotos: 0,
      with10PlusPhotos: 0,
      withAIEnhancement: 0,
      withSEOMetadata: 0,
      withRating: 0,
      withCuisines: 0
    };

    qualityData.forEach(r => {
      const photoCount = r.photos?.length || 0;

      if (photoCount > 0) qualityMetrics.withPhotos++;
      if (photoCount >= 5) qualityMetrics.with5PlusPhotos++;
      if (photoCount >= 10) qualityMetrics.with10PlusPhotos++;
      if (r.ai_enhancement_output) qualityMetrics.withAIEnhancement++;
      if (r.seo_metadata) qualityMetrics.withSEOMetadata++;
      if (r.average_rating && r.average_rating > 0) qualityMetrics.withRating++;
      if (r.restaurant_cuisine_ids && r.restaurant_cuisine_ids.length > 0) qualityMetrics.withCuisines++;
    });

    console.log('âœ¨ QUALITY METRICS');
    console.log('â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€');

    const total = qualityData.length;
    const metrics = [
      ['Photos (any)', qualityMetrics.withPhotos, total],
      ['Photos (5+)', qualityMetrics.with5PlusPhotos, total],
      ['Photos (10+)', qualityMetrics.with10PlusPhotos, total],
      ['AI Enhanced', qualityMetrics.withAIEnhancement, total],
      ['SEO Metadata', qualityMetrics.withSEOMetadata, total],
      ['Has Rating', qualityMetrics.withRating, total],
      ['Has Cuisines', qualityMetrics.withCuisines, total]
    ];

    metrics.forEach(([label, count, total]) => {
      const percent = ((count / total) * 100).toFixed(0);
      const status = percent >= 95 ? 'âœ…' : percent >= 80 ? 'ðŸŸ¡' : 'ðŸ”´';
      console.log(`${label.padEnd(20)} ${count.toString().padStart(3)}/${total} (${percent.toString().padStart(3)}%) ${status}`);
    });

    console.log('');
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // 6. RECOMMENDATIONS
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  console.log('ðŸ“ NEXT STEPS');
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');

  if (statusCounts.failed > 0) {
    console.log(`ðŸ”´ Fix ${statusCounts.failed} failed extractions`);
  }

  if (remaining > 0) {
    const dailyTarget = Math.ceil(remaining / 7);
    console.log(`ðŸŽ¯ Extract ${dailyTarget} restaurants/day to reach 500 in 1 week`);
  }

  // Check which areas need more restaurants
  if (byArea) {
    const areaCounts = {};
    byArea.forEach(r => {
      const area = r.area || 'Unknown';
      areaCounts[area] = (areaCounts[area] || 0) + 1;
    });

    const needsMore = Object.entries(TARGET_DISTRIBUTION)
      .filter(([area, target]) => (areaCounts[area] || 0) < target * 0.8)
      .sort((a, b) => (areaCounts[a[0]] || 0) - (areaCounts[b[0]] || 0));

    if (needsMore.length > 0) {
      console.log(`\nðŸŽ¯ Focus on these areas next:`);
      needsMore.forEach(([area, target]) => {
        const current = areaCounts[area] || 0;
        const needed = target - current;
        console.log(`   ${area}: Need ${needed} more (currently ${current}/${target})`);
      });
    }
  }

  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\n');
}

trackProgress();

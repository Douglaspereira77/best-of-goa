/**
 * Check Extraction Status for Top 50 Fitness Places
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStatus() {
  console.log('📊 Top 50 Fitness Places - Extraction Status');
  console.log('='.repeat(60) + '\n');

  // Get top 50 fitness places
  const { data: fitnessPlaces, error } = await supabase
    .from('fitness_places')
    .select(`
      id,
      name,
      extraction_status,
      extraction_progress,
      description,
      meta_title,
      bok_score
    `)
    .not('google_rating', 'is', null)
    .not('google_place_id', 'is', null)
    .order('google_review_count', { ascending: false })
    .limit(50);

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  // Count by status
  const statusCounts = {
    completed: 0,
    processing: 0,
    pending: 0,
    failed: 0
  };

  const stepStatus = {
    apify_fetch: { completed: 0, in_progress: 0, failed: 0, pending: 0 },
    firecrawl_website: { completed: 0, in_progress: 0, failed: 0, pending: 0 },
    social_media_search: { completed: 0, in_progress: 0, failed: 0, pending: 0 },
    apify_reviews: { completed: 0, in_progress: 0, failed: 0, pending: 0 },
    process_images: { completed: 0, in_progress: 0, failed: 0, pending: 0 },
    ai_enhancement: { completed: 0, in_progress: 0, failed: 0, pending: 0 },
    category_matching: { completed: 0, in_progress: 0, failed: 0, pending: 0 },
    calculate_bok_score: { completed: 0, in_progress: 0, failed: 0, pending: 0 }
  };

  fitnessPlaces.forEach(fp => {
    // Count overall status
    const status = fp.extraction_status || 'pending';
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    // Count step statuses
    const progress = fp.extraction_progress || {};
    Object.keys(stepStatus).forEach(step => {
      const stepData = progress[step];
      if (stepData) {
        const stepStatusValue = stepData.status || 'pending';
        if (stepStatusValue === 'completed') {
          stepStatus[step].completed++;
        } else if (stepStatusValue === 'in_progress' || stepStatusValue === 'running') {
          stepStatus[step].in_progress++;
        } else if (stepStatusValue === 'failed') {
          stepStatus[step].failed++;
        } else {
          stepStatus[step].pending++;
        }
      } else {
        stepStatus[step].pending++;
      }
    });
  });

  // Print summary
  console.log('📈 OVERALL STATUS');
  console.log('='.repeat(60));
  console.log(`✅ Completed:  ${statusCounts.completed}/${fitnessPlaces.length}`);
  console.log(`🔄 Processing: ${statusCounts.processing}/${fitnessPlaces.length}`);
  console.log(`⏳ Pending:    ${statusCounts.pending}/${fitnessPlaces.length}`);
  console.log(`❌ Failed:     ${statusCounts.failed}/${fitnessPlaces.length}`);
  console.log('');

  // Print step-by-step progress
  console.log('📋 STEP-BY-STEP PROGRESS');
  console.log('='.repeat(60));
  const steps = [
    { key: 'apify_fetch', name: '1. Apify Fetch' },
    { key: 'firecrawl_website', name: '2. Firecrawl Website' },
    { key: 'social_media_search', name: '3. Social Media Search' },
    { key: 'apify_reviews', name: '4. Apify Reviews' },
    { key: 'process_images', name: '5. Process Images' },
    { key: 'ai_enhancement', name: '6. AI Enhancement' },
    { key: 'category_matching', name: '7. Category Matching' },
    { key: 'calculate_bok_score', name: '8. BOK Score Calculation' }
  ];

  steps.forEach(step => {
    const stats = stepStatus[step.key];
    const total = fitnessPlaces.length;
    const completed = stats.completed;
    const percentage = Math.round((completed / total) * 100);
    const barLength = Math.round(percentage / 2);
    const bar = '█'.repeat(barLength) + '░'.repeat(50 - barLength);
    
    console.log(`${step.name}:`);
    console.log(`  ${bar} ${percentage}% (${completed}/${total})`);
    console.log(`  ✅ Completed: ${completed} | 🔄 In Progress: ${stats.in_progress} | ⏳ Pending: ${stats.pending} | ❌ Failed: ${stats.failed}`);
  });
  console.log('');

  // Check data completeness
  const hasDescription = fitnessPlaces.filter(fp => fp.description).length;
  const hasMetaTitle = fitnessPlaces.filter(fp => fp.meta_title).length;
  const hasBOKScore = fitnessPlaces.filter(fp => fp.bok_score !== null).length;

  console.log('📊 DATA COMPLETENESS');
  console.log('='.repeat(60));
  console.log(`Description:  ${hasDescription}/${fitnessPlaces.length} (${Math.round(hasDescription/fitnessPlaces.length*100)}%)`);
  console.log(`Meta Title:   ${hasMetaTitle}/${fitnessPlaces.length} (${Math.round(hasMetaTitle/fitnessPlaces.length*100)}%)`);
  console.log(`BOK Score:    ${hasBOKScore}/${fitnessPlaces.length} (${Math.round(hasBOKScore/fitnessPlaces.length*100)}%)`);
  console.log('');

  // Show places still processing
  const stillProcessing = fitnessPlaces.filter(fp => 
    fp.extraction_status === 'processing' || fp.extraction_status === 'pending'
  );

  if (stillProcessing.length > 0) {
    console.log('🔄 PLACES STILL PROCESSING');
    console.log('='.repeat(60));
    stillProcessing.slice(0, 10).forEach((fp, i) => {
      const progress = fp.extraction_progress || {};
      const currentStep = Object.keys(progress).find(step => 
        progress[step]?.status === 'in_progress' || progress[step]?.status === 'running'
      ) || 'Starting...';
      
      console.log(`${i + 1}. ${fp.name}`);
      console.log(`   Status: ${fp.extraction_status} | Current Step: ${currentStep}`);
    });
    if (stillProcessing.length > 10) {
      console.log(`   ... and ${stillProcessing.length - 10} more`);
    }
    console.log('');
  }

  // Show failed places
  const failed = fitnessPlaces.filter(fp => fp.extraction_status === 'failed');
  if (failed.length > 0) {
    console.log('❌ FAILED EXTRACTIONS');
    console.log('='.repeat(60));
    failed.forEach((fp, i) => {
      console.log(`${i + 1}. ${fp.name}`);
      const progress = fp.extraction_progress || {};
      const failedStep = Object.keys(progress).find(step => 
        progress[step]?.status === 'failed'
      );
      if (failedStep) {
        console.log(`   Failed at: ${failedStep}`);
        console.log(`   Error: ${progress[failedStep]?.error || 'Unknown error'}`);
      }
    });
    console.log('');
  }

  // Overall completion percentage
  const completionPercentage = Math.round((statusCounts.completed / fitnessPlaces.length) * 100);
  console.log('🎯 OVERALL COMPLETION');
  console.log('='.repeat(60));
  console.log(`${completionPercentage}% Complete (${statusCounts.completed}/${fitnessPlaces.length} places)`);
  
  if (statusCounts.completed === fitnessPlaces.length) {
    console.log('\n✅ All extractions completed successfully!');
  } else if (statusCounts.processing > 0) {
    console.log(`\n⏳ ${statusCounts.processing} extractions still in progress...`);
  }
  console.log('');
}

checkStatus()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
































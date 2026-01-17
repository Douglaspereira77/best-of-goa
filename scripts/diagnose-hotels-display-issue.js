const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseHotels() {
  console.log('=== HOTEL DATABASE DIAGNOSIS ===\n');

  // Check total hotels
  const { count: totalCount } = await supabase
    .from('hotels')
    .select('*', { count: 'exact', head: true });
  console.log('Total hotels in database:', totalCount);

  // Check by extraction status
  const { data: byStatus } = await supabase
    .from('hotels')
    .select('extraction_status')
    .order('extraction_status');

  const statusCounts = {};
  byStatus?.forEach(h => {
    statusCounts[h.extraction_status] = (statusCounts[h.extraction_status] || 0) + 1;
  });
  console.log('\nBy extraction_status:', statusCounts);

  // Check active flag
  const { count: activeCount } = await supabase
    .from('hotels')
    .select('*', { count: 'exact', head: true })
    .eq('active', true);
  console.log('\nActive hotels (active=true):', activeCount);

  // Check verified flag
  const { count: verifiedCount } = await supabase
    .from('hotels')
    .select('*', { count: 'exact', head: true })
    .eq('verified', true);
  console.log('Verified hotels (verified=true):', verifiedCount);

  // Check published flag (NEW)
  const { count: publishedCount } = await supabase
    .from('hotels')
    .select('*', { count: 'exact', head: true })
    .eq('published', true);
  console.log('Published hotels (published=true):', publishedCount);

  // Check hotels that SHOULD appear on /places-to-stay
  // Current query requires: active=true AND extraction_status='completed'
  const { count: shouldShowCount } = await supabase
    .from('hotels')
    .select('*', { count: 'exact', head: true })
    .eq('active', true)
    .eq('extraction_status', 'completed');
  console.log('\nHotels matching current query (active=true AND extraction_status=completed):', shouldShowCount);

  // Check hotels that match ALL criteria (with published)
  const { count: allCriteriaCount } = await supabase
    .from('hotels')
    .select('*', { count: 'exact', head: true })
    .eq('active', true)
    .eq('extraction_status', 'completed')
    .eq('published', true);
  console.log('Hotels matching with published=true:', allCriteriaCount);

  // Sample data from first 3 hotels
  const { data: sampleHotels } = await supabase
    .from('hotels')
    .select('name, active, extraction_status, verified, published, bok_score')
    .limit(5);

  console.log('\nSample hotels (first 5):');
  sampleHotels?.forEach(h => {
    console.log(`  - ${h.name}: active=${h.active}, extraction_status=${h.extraction_status}, verified=${h.verified}, published=${h.published}, bok_score=${h.bok_score}`);
  });

  console.log('\n=== DIAGNOSIS SUMMARY ===');
  console.log('The /places-to-stay page queries need: active=true AND extraction_status=completed');
  console.log('Based on the migration file (20251128_add_published_fields_all_categories.sql),');
  console.log('a new "published" field was added that may not be set correctly.');
  console.log('\nIf published field is required but not set, that would explain why hotels are not showing.');
}

diagnoseHotels().catch(console.error);

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('\n🗃️  CHECKING HOTEL_FAQS TABLE SCHEMA:\n');

  // Try inserting a test record to see what fails
  const { data, error } = await supabase
    .from('hotel_faqs')
    .insert({
      hotel_id: '00000000-0000-0000-0000-000000000000',
      question: 'Test question',
      answer: 'Test answer',
      category: 'general',
      relevance_score: 50,
      source: 'test',
      display_order: 1,
      is_featured: false,
      last_updated: new Date().toISOString()
    })
    .select();

  if (error) {
    console.log('❌ INSERT ERROR:', error.message);
    console.log('Error code:', error.code);
    console.log('Error details:', error.details);
    console.log('\n💡 Missing fields:', extractMissingFields(error.message));
  } else {
    console.log('✅ Test insert succeeded');
    if (data && data[0]) {
      await supabase.from('hotel_faqs').delete().eq('id', data[0].id);
      console.log('✅ Test record cleaned up');
    }
  }
}

function extractMissingFields(errorMessage) {
  const match = errorMessage.match(/'([^']+)' column/);
  return match ? match[1] : 'Unknown';
}

checkSchema().catch(console.error);

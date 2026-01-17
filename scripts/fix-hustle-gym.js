require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function fixHustleGym() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log('🔧 Fixing Hustle gym record...\n')

  // Update the Hustle gym to be unpublished and inactive
  const { data, error } = await supabase
    .from('fitness_places')
    .update({
      published: false,
      active: false,
      published_at: null
    })
    .eq('slug', 'hustle-gym')
    .select('id, name, slug, published, active')

  if (error) {
    console.error('❌ Error updating database:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No records were updated')
    return
  }

  console.log('✅ Successfully updated Hustle gym:')
  console.log(`  Name: ${data[0].name}`)
  console.log(`  Published: ${data[0].published}`)
  console.log(`  Active: ${data[0].active}`)
  console.log('\n✨ The gym should no longer appear on the public fitness page')
}

fixHustleGym().catch(console.error)

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function checkHustleStatus() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log('🔍 Searching for Hustle gym records...\n')

  // Search for records with "hustle" in the name
  const { data, error } = await supabase
    .from('fitness_places')
    .select('id, name, slug, published, active, created_at')
    .ilike('name', '%hustle%')

  if (error) {
    console.error('❌ Error querying database:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No records found with "hustle" in the name')
    return
  }

  console.log(`✅ Found ${data.length} record(s):\n`)
  data.forEach((record, index) => {
    console.log(`Record ${index + 1}:`)
    console.log(`  ID: ${record.id}`)
    console.log(`  Name: ${record.name}`)
    console.log(`  Slug: ${record.slug}`)
    console.log(`  Published: ${record.published}`)
    console.log(`  Active: ${record.active}`)
    console.log(`  Created: ${record.created_at}`)
    console.log('')
  })
}

checkHustleStatus().catch(console.error)

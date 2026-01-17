require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function fixUnpublishedActiveRecords() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log('🔧 Fixing unpublished but active records across all categories...\n')

  const categories = [
    { name: 'Restaurants', table: 'restaurants' },
    { name: 'Hotels', table: 'hotels' },
    { name: 'Malls', table: 'malls' },
    { name: 'Fitness', table: 'fitness_places' },
    { name: 'Attractions', table: 'attractions' },
    { name: 'Schools', table: 'schools' }
  ]

  let totalFixed = 0

  for (const category of categories) {
    // Find records that are unpublished but active
    const { data: records, error: findError } = await supabase
      .from(category.table)
      .select('id, name')
      .eq('published', false)
      .eq('active', true)

    if (findError) {
      console.error(`❌ Error finding ${category.name}:`, findError)
      continue
    }

    if (!records || records.length === 0) {
      console.log(`✅ ${category.name}: No issues to fix`)
      continue
    }

    console.log(`\n🔧 ${category.name}: Fixing ${records.length} record(s)...`)

    // Update all unpublished records to be inactive
    const { data: updated, error: updateError } = await supabase
      .from(category.table)
      .update({
        active: false,
        published_at: null
      })
      .eq('published', false)
      .eq('active', true)
      .select('id, name')

    if (updateError) {
      console.error(`❌ Error updating ${category.name}:`, updateError)
      continue
    }

    if (updated && updated.length > 0) {
      console.log(`   ✅ Fixed ${updated.length} record(s):`)
      updated.forEach((record, index) => {
        console.log(`      ${index + 1}. ${record.name}`)
      })
      totalFixed += updated.length
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  if (totalFixed > 0) {
    console.log(`\n✅ Successfully fixed ${totalFixed} record(s)!`)
    console.log('\nAll unpublished records are now inactive and won\'t appear on public pages.')
  } else {
    console.log('\n✅ No records needed fixing. All categories are clean!')
  }
}

fixUnpublishedActiveRecords().catch(console.error)

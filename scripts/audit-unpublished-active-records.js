require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function auditUnpublishedActiveRecords() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log('🔍 Auditing unpublished but active records across all categories...\n')

  const categories = [
    { name: 'Restaurants', table: 'restaurants' },
    { name: 'Hotels', table: 'hotels' },
    { name: 'Malls', table: 'malls' },
    { name: 'Fitness', table: 'fitness_places' },
    { name: 'Attractions', table: 'attractions' },
    { name: 'Schools', table: 'schools' }
  ]

  let totalIssues = 0

  for (const category of categories) {
    const { data, error } = await supabase
      .from(category.table)
      .select('id, name, slug, published, active')
      .eq('published', false)
      .eq('active', true)

    if (error) {
      console.error(`❌ Error querying ${category.name}:`, error)
      continue
    }

    if (data && data.length > 0) {
      console.log(`\n⚠️  ${category.name}: Found ${data.length} unpublished but active record(s):`)
      data.forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.name} (${record.slug})`)
        totalIssues++
      })
    } else {
      console.log(`✅ ${category.name}: No issues found`)
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  if (totalIssues > 0) {
    console.log(`\n⚠️  Total issues found: ${totalIssues} records are unpublished but still active`)
    console.log('\nThese records will appear on public pages. Run fix script to resolve.')
  } else {
    console.log('\n✅ All categories are clean! No unpublished records are active.')
  }
}

auditUnpublishedActiveRecords().catch(console.error)

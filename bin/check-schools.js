const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSchools() {
  console.log('\n🔍 Checking schools table...\n')

  // Check if table exists and get count
  const { data: schools, error, count } = await supabase
    .from('schools')
    .select('slug, name, active, school_type, area', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('❌ Error fetching schools:', error.message)
    return
  }

  console.log(`✅ Found ${count} total schools\n`)

  if (schools && schools.length > 0) {
    console.log('Recent schools:')
    console.log('─'.repeat(80))
    schools.forEach((school, i) => {
      console.log(`${i + 1}. ${school.name}`)
      console.log(`   Slug: ${school.slug}`)
      console.log(`   Active: ${school.active}`)
      console.log(`   Type: ${school.school_type || 'N/A'}`)
      console.log(`   Area: ${school.area || 'N/A'}`)
      console.log('')
    })

    // Check for British School specifically
    const { data: britishSchools } = await supabase
      .from('schools')
      .select('slug, name, active')
      .ilike('name', '%british%')

    if (britishSchools && britishSchools.length > 0) {
      console.log('\n🇬🇧 British Schools found:')
      console.log('─'.repeat(80))
      britishSchools.forEach((school) => {
        console.log(`- ${school.name}`)
        console.log(`  Slug: ${school.slug}`)
        console.log(`  Active: ${school.active}`)
        console.log(`  URL: http://localhost:3000/places-to-learn/schools/${school.slug}`)
        console.log('')
      })
    }
  } else {
    console.log('⚠️  No schools found in database')
    console.log('\nTo add schools, visit: http://localhost:3000/admin/schools/add')
  }

  // Check active schools
  const { count: activeCount } = await supabase
    .from('schools')
    .select('*', { count: 'exact', head: true })
    .eq('active', true)

  console.log(`\n📊 Statistics:`)
  console.log(`   Total schools: ${count}`)
  console.log(`   Active schools: ${activeCount}`)
  console.log(`   Inactive schools: ${count - activeCount}`)
}

checkSchools().catch(console.error)

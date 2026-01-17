const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runExtraction() {
  console.log('\nðŸ”„ Starting extraction for British School of Goa...\n')

  // Get the school
  const { data: school, error: fetchError } = await supabase
    .from('schools')
    .select('id, name, google_place_id, slug')
    .eq('slug', 'the-british-school-of-goa-salwa')
    .single()

  if (fetchError || !school) {
    console.error('âŒ Error fetching school:', fetchError?.message)
    return
  }

  console.log(`Found school:`)
  console.log(`  Name: ${school.name}`)
  console.log(`  ID: ${school.id}`)
  console.log(`  Google Place ID: ${school.google_place_id}`)
  console.log(`\nðŸš€ Triggering extraction via API...\n`)

  // Call the extraction API
  try {
    const response = await fetch('http://localhost:3000/api/admin/schools/start-extraction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schoolId: school.id,
        placeId: school.google_place_id,
        name: school.name,
      }),
    })

    const result = await response.json()

    if (response.ok) {
      console.log('âœ… Extraction started successfully!')
      console.log(`\nðŸ“Š Monitor progress at:`)
      console.log(`   Admin Queue: http://localhost:3000/admin/schools/queue`)
      console.log(`   Review Page: http://localhost:3000/admin/schools/${school.id}/review`)
      console.log(`\nâ±ï¸  This will take 3-5 minutes. Steps include:`)
      console.log('   1. Google Places data fetch')
      console.log('   2. Website scraping (Firecrawl)')
      console.log('   3. Social media search')
      console.log('   4. Google Reviews')
      console.log('   5-9. Data analysis (curriculum, facilities, etc.)')
      console.log('   10. Image processing with Vision AI (2-3 min)')
      console.log('   11. AI enhancement')
      console.log('   12. Category matching')
    } else {
      console.error('âŒ Extraction failed:', result.error || result.message)
    }
  } catch (error) {
    console.error('âŒ API call failed:', error.message)
  }
}

runExtraction().catch(console.error)

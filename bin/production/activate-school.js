const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function activateSchool(slug) {
  console.log(`\nðŸ”„ Activating school: ${slug}...\n`)

  const { data, error } = await supabase
    .from('schools')
    .update({ active: true })
    .eq('slug', slug)
    .select('name, slug, active')
    .single()

  if (error) {
    console.error('âŒ Error:', error.message)
    return
  }

  console.log('âœ… School activated successfully!\n')
  console.log(`   Name: ${data.name}`)
  console.log(`   Slug: ${data.slug}`)
  console.log(`   Active: ${data.active}`)
  console.log(`\nðŸŒ View at: http://localhost:3000/places-to-learn/schools/${data.slug}`)
}

const slug = process.argv[2] || 'the-british-school-of-goa-salwa'
activateSchool(slug).catch(console.error)

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function clearFitnessPlaces() {
  console.log('🗑️  Clearing all fitness places from database...\n')

  // Delete all fitness places
  const { error } = await supabase
    .from('fitness_places')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows

  if (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }

  // Verify count
  const { count } = await supabase
    .from('fitness_places')
    .select('*', { count: 'exact', head: true })

  console.log(`✅ All fitness places deleted. Current count: ${count}`)
}

clearFitnessPlaces()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

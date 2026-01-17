require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkCount() {
  const { data, count, error } = await supabase
    .from('fitness_places')
    .select('id, name, gender_policy, fitness_types', { count: 'exact' })

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('✅ Total fitness places in database:', count)
  console.log('\nFirst 10 entries:')
  data.slice(0, 10).forEach((p, i) => {
    const types = p.fitness_types ? p.fitness_types.join(', ') : 'none'
    console.log(`${i + 1}. ${p.name} (${p.gender_policy}, ${types})`)
  })

  // Group by gender policy
  const bySex = {}
  data.forEach(p => {
    bySex[p.gender_policy] = (bySex[p.gender_policy] || 0) + 1
  })

  console.log('\nBreakdown by gender policy:')
  Object.entries(bySex).forEach(([policy, count]) => {
    console.log(`  ${policy}: ${count}`)
  })
}

checkCount()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function findRichData() {
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('name, slug, apify_output')
    .not('apify_output', 'is', null)
    .limit(50)

  console.log('Searching 50 restaurants for rich Apify data...\n')

  let bestCandidate = null
  let maxFields = 0

  restaurants.forEach(r => {
    const a = r.apify_output
    const fieldCount =
      Object.keys(a?.accessibility || {}).length +
      Object.keys(a?.options || {}).length +
      Object.keys(a?.serviceOptions || {}).length +
      Object.keys(a?.attributes || {}).length

    if (fieldCount > maxFields) {
      maxFields = fieldCount
      bestCandidate = r
    }
  })

  if (bestCandidate) {
    console.log(`Best candidate: ${bestCandidate.name}`)
    console.log(`Total rich fields: ${maxFields}\n`)

    const a = bestCandidate.apify_output

    console.log('ACCESSIBILITY:')
    console.log(JSON.stringify(a?.accessibility || {}, null, 2))
    console.log()

    console.log('OPTIONS:')
    console.log(JSON.stringify(a?.options || {}, null, 2))
    console.log()

    console.log('SERVICE OPTIONS:')
    console.log(JSON.stringify(a?.serviceOptions || {}, null, 2))
    console.log()

    console.log('ATTRIBUTES:')
    console.log(JSON.stringify(a?.attributes || {}, null, 2))
    console.log()

    console.log('PRICE:')
    console.log(`  price: ${a?.price}`)
    console.log(`  priceRange: ${a?.priceRange}`)
  } else {
    console.log('No rich data found')
  }
}

findRichData().catch(console.error)

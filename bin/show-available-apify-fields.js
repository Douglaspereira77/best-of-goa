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

async function showFields() {
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name, apify_output')
    .not('apify_output', 'is', null)
    .limit(1)
    .single()

  console.log(`Restaurant: ${restaurant.name}\n`)
  console.log('ALL AVAILABLE APIFY FIELDS:')
  console.log('=' .repeat(80))

  const apify = restaurant.apify_output

  Object.keys(apify).sort().forEach(key => {
    const value = apify[key]
    const type = typeof value
    let display = value

    if (type === 'object' && value !== null) {
      if (Array.isArray(value)) {
        display = `Array(${value.length}) ${value.length > 0 ? `[${JSON.stringify(value[0]).substring(0, 50)}...]` : '[]'}`
      } else {
        display = `Object ${JSON.stringify(value).substring(0, 100)}...`
      }
    } else if (type === 'string' && value.length > 100) {
      display = value.substring(0, 100) + '...'
    }

    console.log(`${key}: ${display}`)
  })
}

showFields().catch(console.error)

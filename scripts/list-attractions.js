import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function listAttractions() {
  console.log('Fetching all attractions...\n')

  const { data: attractions, error } = await supabase
    .from('attractions')
    .select('id, name, slug, area, active, extraction_status, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Found ${attractions.length} attractions:\n`)
  console.log('━'.repeat(100))

  for (const attraction of attractions) {
    console.log(`${attraction.name}`)
    console.log(`  Slug: ${attraction.slug}`)
    console.log(`  Area: ${attraction.area || 'N/A'}`)
    console.log(`  Status: ${attraction.extraction_status}`)
    console.log(`  Active: ${attraction.active}`)
    console.log(`  Created: ${new Date(attraction.created_at).toLocaleDateString()}`)
    console.log('━'.repeat(100))
  }

  // Get count by status
  const { data: statusCounts } = await supabase
    .from('attractions')
    .select('extraction_status')

  const counts = statusCounts?.reduce((acc, curr) => {
    acc[curr.extraction_status] = (acc[curr.extraction_status] || 0) + 1
    return acc
  }, {})

  console.log('\n=== STATUS SUMMARY ===')
  console.log(JSON.stringify(counts, null, 2))
}

listAttractions().catch(console.error)

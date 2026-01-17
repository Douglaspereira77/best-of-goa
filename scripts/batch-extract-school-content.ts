import { SchoolContentExtractor } from '../src/lib/services/school-content-extractor'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function batchExtract() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const extractor = new SchoolContentExtractor()

  console.log('='.repeat(80))
  console.log('BATCH CONTENT EXTRACTION')
  console.log('='.repeat(80))

  // Get all schools with Firecrawl data
  const { data: schools, error } = await supabase
    .from('schools')
    .select('id, name, slug, firecrawl_output')
    .not('firecrawl_output', 'is', null)
    .eq('active', true)

  if (error || !schools) {
    console.error('Error fetching schools:', error)
    return
  }

  console.log(`\nFound ${schools.length} schools with Firecrawl data\n`)

  const results = {
    total: schools.length,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: [] as any[]
  }

  for (let i = 0; i < schools.length; i++) {
    const school = schools[i]
    console.log(`\n[${i + 1}/${schools.length}] Processing: ${school.name}`)
    console.log('-'.repeat(80))

    try {
      // Check if school has markdown content
      const hasContent = school.firecrawl_output?.data?.markdown || 
                        school.firecrawl_output?.markdown ||
                        school.firecrawl_output?.data?.content

      if (!hasContent) {
        console.log('⚠️  No markdown content available, skipping')
        results.skipped++
        continue
      }

      const success = await extractor.extractAndUpdate(school.id)

      if (success) {
        console.log('✅ Success')
        results.successful++
      } else {
        console.log('❌ Failed')
        results.failed++
        results.errors.push({
          school: school.name,
          slug: school.slug,
          error: 'Extraction returned false'
        })
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000))

    } catch (error: any) {
      console.error('❌ Error:', error.message)
      results.failed++
      results.errors.push({
        school: school.name,
        slug: school.slug,
        error: error.message
      })
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80))
  console.log('EXTRACTION SUMMARY')
  console.log('='.repeat(80))
  console.log(`Total schools: ${results.total}`)
  console.log(`✅ Successful: ${results.successful}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`⚠️  Skipped: ${results.skipped}`)
  console.log(`Success rate: ${((results.successful / results.total) * 100).toFixed(1)}%`)

  if (results.errors.length > 0) {
    console.log('\nErrors:')
    results.errors.forEach(err => {
      console.log(`  - ${err.school}: ${err.error}`)
    })
  }

  console.log('\n✨ Batch extraction complete!')
}

batchExtract().catch(console.error)




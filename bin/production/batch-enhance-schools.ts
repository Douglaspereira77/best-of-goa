#!/usr/bin/env tsx
/**
 * Batch School Enhancement Tool
 *
 * Re-runs TIER 1 + TIER 2 enhancements on existing schools
 * without requiring full re-extraction
 *
 * Usage:
 *   npx tsx bin/batch-enhance-schools.ts --school=gulf-british-academy-salmiya
 *   npx tsx bin/batch-enhance-schools.ts --all
 *   npx tsx bin/batch-enhance-schools.ts --all --dry-run
 *   npx tsx bin/batch-enhance-schools.ts --school=gulf-british-academy-salmiya --verbose
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { SchoolContentExtractor } from '../src/lib/services/school-content-extractor.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Parse command line arguments
const args = process.argv.slice(2)
const schoolSlug = args.find(arg => arg.startsWith('--school='))?.split('=')[1]
const enhanceAll = args.includes('--all')
const dryRun = args.includes('--dry-run')
const verbose = args.includes('--verbose')

async function enhanceSingleSchool(school) {
  console.log(`\n${'='.repeat(70)}`)
  console.log(`Enhancing: ${school.name} (${school.slug})`)
  console.log('='.repeat(70))

  // Count current populated fields
  const before = countPopulatedFields(school)
  console.log(`\n📊 Before Enhancement: ${before.populated}/${before.total} fields (${before.percentage}%)`)

  const updates = {}

  // ========================================
  // TIER 1: Direct mapping from Apify
  // ========================================
  console.log('\n🔹 TIER 1: Direct Mapping from Apify')

  const apifyData = school.apify_output
  if (!apifyData) {
    console.log('   ⚠️  No Apify data available')
  } else {
    // Arabic name
    if (apifyData.subTitle && !school.name_ar) {
      updates.name_ar = apifyData.subTitle
      console.log(`   ✅ name_ar: "${apifyData.subTitle}"`)
    }

    // School hours
    if (apifyData.openingHours && Array.isArray(apifyData.openingHours)) {
      const hours = parseOpeningHours(apifyData.openingHours)
      if (hours) {
        if (!school.school_hours_start) {
          updates.school_hours_start = hours.start
          console.log(`   ✅ school_hours_start: ${hours.start}`)
        }
        if (!school.school_hours_end) {
          updates.school_hours_end = hours.end
          console.log(`   ✅ school_hours_end: ${hours.end}`)
        }
        if (!school.school_days || school.school_days.length === 0) {
          updates.school_days = hours.days
          console.log(`   ✅ school_days: ${hours.days.join(', ')}`)
        }
      }
    }

    // Accessibility features
    if (apifyData.additionalInfo?.Accessibility) {
      const features = Object.keys(apifyData.additionalInfo.Accessibility)
        .filter(key => apifyData.additionalInfo.Accessibility[key] === true)
      if (features.length > 0 && (!school.security_features || school.security_features.length === 0)) {
        updates.security_features = features
        console.log(`   ✅ security_features: ${features.join(', ')}`)
      }
    }
  }

  const tier1Count = Object.keys(updates).length
  console.log(`\n   TIER 1 Result: ${tier1Count} fields added`)

  // ========================================
  // TIER 2: AI Content Extraction
  // ========================================
  console.log('\n🔹 TIER 2: AI Content Extraction with GPT-4')

  const firecrawlData = school.firecrawl_output
  if (!firecrawlData?.data?.markdown) {
    console.log('   ⚠️  No Firecrawl markdown available - skipping AI extraction')
  } else {
    console.log(`   📄 Processing ${firecrawlData.data.markdown.length} characters of website content`)

    if (!dryRun) {
      // Call the SchoolContentExtractor service
      try {
        const extractor = new SchoolContentExtractor()
        const extractedContent = await extractor.extractFromFirecrawl(school.id)

        if (extractedContent && Object.keys(extractedContent).length > 0) {
          // Merge AI-extracted fields with updates
          let aiFieldsCount = 0
          Object.entries(extractedContent).forEach(([key, value]) => {
            // Only add if not already populated and not in tier1 updates
            if (value !== null && value !== undefined && !school[key] && !updates[key]) {
              updates[key] = value
              aiFieldsCount++
              if (verbose) {
                console.log(`   ✅ ${key}: ${typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : value}`)
              }
            }
          })
          console.log(`\n   TIER 2 Result: ${aiFieldsCount} fields extracted`)
        }
      } catch (error) {
        console.error('   ❌ AI extraction failed:', error.message)
      }
    } else {
      console.log('   ⏭️  Skipped (dry-run mode)')
    }
  }

  // ========================================
  // Apply Updates
  // ========================================
  const totalNewFields = Object.keys(updates).length

  if (totalNewFields === 0) {
    console.log('\n✅ No new fields to update - school already complete!')
    return { updated: false, fieldCount: 0 }
  }

  console.log(`\n📝 Total fields to update: ${totalNewFields}`)

  if (verbose) {
    console.log('\nAll updates:')
    Object.entries(updates).forEach(([key, value]) => {
      console.log(`  - ${key}: ${typeof value === 'object' ? JSON.stringify(value).substring(0, 80) + '...' : value}`)
    })
  }

  if (dryRun) {
    console.log('\n🔍 DRY RUN - No changes applied to database')
    return { updated: false, fieldCount: totalNewFields }
  }

  // Apply updates to database
  console.log('\n💾 Updating database...')
  const { error } = await supabase
    .from('schools')
    .update(updates)
    .eq('id', school.id)

  if (error) {
    console.error('❌ Update failed:', error.message)
    return { updated: false, fieldCount: 0 }
  }

  console.log('✅ Database updated successfully!')

  // Calculate after stats
  const updatedSchool = { ...school, ...updates }
  const after = countPopulatedFields(updatedSchool)
  const improvement = after.populated - before.populated

  console.log(`\n📊 After Enhancement: ${after.populated}/${after.total} fields (${after.percentage}%)`)
  console.log(`📈 Improvement: +${improvement} fields (+${(after.percentage - before.percentage).toFixed(1)}%)`)

  return { updated: true, fieldCount: totalNewFields }
}

async function enhanceAllSchools() {
  console.log('🚀 Batch Enhancement: All Schools\n')

  const { data: schools, error } = await supabase
    .from('schools')
    .select('*')
    .eq('active', true)
    .order('name')

  if (error || !schools || schools.length === 0) {
    console.error('❌ No schools found')
    return
  }

  console.log(`Found ${schools.length} active schools\n`)

  const results = []
  for (const school of schools) {
    const result = await enhanceSingleSchool(school)
    results.push({ school: school.name, ...result })
  }

  // Summary
  console.log('\n' + '='.repeat(70))
  console.log('BATCH ENHANCEMENT SUMMARY')
  console.log('='.repeat(70))
  results.forEach(r => {
    const status = r.updated ? '✅ Enhanced' : '⏭️  Skipped'
    console.log(`${status}: ${r.school} (${r.fieldCount} fields)`)
  })

  const totalFields = results.reduce((sum, r) => sum + r.fieldCount, 0)
  console.log(`\nTotal fields added across all schools: ${totalFields}`)
}

async function enhanceBySlug(slug) {
  const { data: school, error } = await supabase
    .from('schools')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !school) {
    console.error(`❌ School not found: ${slug}`)
    return
  }

  await enhanceSingleSchool(school)
}

// Helper functions
function parseOpeningHours(openingHours) {
  try {
    const days = []
    let startTime = null
    let endTime = null

    for (const entry of openingHours) {
      if (!entry.hours || entry.hours.toLowerCase() === 'closed') continue

      days.push(entry.day.toLowerCase())

      const timeMatch = entry.hours.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\s*to\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i)
      if (timeMatch && !startTime) {
        const [_, startHour, startMin = '00', startPeriod, endHour, endMin = '00', endPeriod] = timeMatch

        let start24 = parseInt(startHour)
        if (startPeriod.toUpperCase() === 'PM' && start24 !== 12) start24 += 12
        if (startPeriod.toUpperCase() === 'AM' && start24 === 12) start24 = 0

        let end24 = parseInt(endHour)
        if (endPeriod.toUpperCase() === 'PM' && end24 !== 12) end24 += 12
        if (endPeriod.toUpperCase() === 'AM' && end24 === 12) end24 = 0

        startTime = `${String(start24).padStart(2, '0')}:${startMin}`
        endTime = `${String(end24).padStart(2, '0')}:${endMin}`
      }
    }

    if (days.length > 0 && startTime && endTime) {
      return { start: startTime, end: endTime, days }
    }
    return null
  } catch (error) {
    return null
  }
}

function countPopulatedFields(school) {
  const total = 158 // Based on schema analysis
  let populated = 0

  Object.entries(school).forEach(([key, value]) => {
    if (key === 'id' || key === 'created_at' || key === 'updated_at') return

    const isEmpty = value === null ||
                   value === undefined ||
                   value === '' ||
                   (Array.isArray(value) && value.length === 0) ||
                   (typeof value === 'boolean' && value === false)

    if (!isEmpty) {
      populated++
    }
  })

  const percentage = Math.round((populated / total) * 100)
  return { total, populated, percentage }
}

// Main execution
async function main() {
  if (!schoolSlug && !enhanceAll) {
    console.error('❌ Usage: node bin/batch-enhance-schools.js --school=<slug> OR --all')
    console.error('\nOptions:')
    console.error('  --school=<slug>  Enhance specific school')
    console.error('  --all            Enhance all active schools')
    console.error('  --dry-run        Show what would change without applying')
    console.error('  --verbose        Show detailed field-by-field updates')
    process.exit(1)
  }

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No database changes will be made\n')
  }

  try {
    if (enhanceAll) {
      await enhanceAllSchools()
    } else {
      await enhanceBySlug(schoolSlug)
    }

    console.log('\n✅ Enhancement complete!')
  } catch (error) {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  }
}

main()

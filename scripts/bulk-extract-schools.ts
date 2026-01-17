#!/usr/bin/env ts-node
/**
 * Bulk School Extraction Script
 *
 * Reads a CSV file of schools and runs full extraction for each.
 *
 * Usage:
 *   npm run extract:schools -- --limit 1  (test with 1 school)
 *   npm run extract:schools -- --limit 5  (test with 5 schools)
 *   npm run extract:schools                (extract all schools)
 *
 * CSV Format: School Name, Governorate, Curriculum Type, Grade Levels, Accreditation, Notes, Google Place ID
 */

// IMPORTANT: Load environment variables FIRST before any other imports
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const CSV_PATH = 'c:\\Users\\Douglas\\Downloads\\Goa-Top-Schools-Directory.csv'
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY!
const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const DELAY_MS = 2000 // 2 seconds between extractions

interface CSVRow {
  'School Name': string
  Governorate: string
  'Curriculum Type': string
  'Grade Levels': string
  Accreditation: string
  Notes: string
  'Google Place ID': string
}

interface ExtractionResult {
  name: string
  status: 'success' | 'failed_place_id' | 'failed_extraction' | 'duplicate'
  error?: string
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * Parse curriculum from CSV (e.g., "American IB" -> ["american", "ib"])
 */
function parseCurriculum(curriculumStr: string): string[] {
  if (!curriculumStr || curriculumStr.trim() === '') return []

  const normalized = curriculumStr.toLowerCase().trim()
  const curricula: string[] = []

  // Handle common patterns
  const curriculumMap: Record<string, string[]> = {
    'bilingual': ['bilingual'],
    'british': ['british'],
    'american': ['american'],
    'american ib': ['american', 'ib'],
    'ib': ['ib'],
    'french': ['french'],
    'german': ['german'],
    'japanese': ['japanese'],
    'australian': ['australian'],
    'pakistani': ['pakistani'],
    'arabic': ['arabic'],
    'mixed': ['mixed'],
    'filipino': ['filipino'],
    'sri lankan': ['sri_lankan'],
    'cbse': ['indian', 'cbse'],
    'cambridge': ['british', 'cambridge'],
    'cbse/cambridge': ['indian', 'cbse', 'british', 'cambridge']
  }

  // Check for exact matches
  if (curriculumMap[normalized]) {
    return curriculumMap[normalized]
  }

  // Split by common delimiters
  const parts = normalized.split(/[\/,]/).map(p => p.trim())
  for (const part of parts) {
    if (curriculumMap[part]) {
      curricula.push(...curriculumMap[part])
    }
  }

  // Remove duplicates
  return [...new Set(curricula)]
}

/**
 * Parse grade levels from CSV (e.g., "KG-12" -> ['kindergarten', 'elementary', 'middle', 'high'])
 */
function parseGradeLevels(gradeLevelsStr: string): {
  gradeLevels: string[]
  minGrade: string | null
  maxGrade: string | null
} {
  if (!gradeLevelsStr || gradeLevelsStr.trim() === '') {
    return { gradeLevels: [], minGrade: null, maxGrade: null }
  }

  const normalized = gradeLevelsStr.toLowerCase().trim()
  const gradeLevels: string[] = []
  let minGrade: string | null = null
  let maxGrade: string | null = null

  // Detect kindergarten/pre-k
  if (/kg|kindergarten|pre-?k|nursery|eyfs/i.test(normalized)) {
    gradeLevels.push('kindergarten')
    minGrade = 'kg1'
  }

  // Detect grade range patterns
  if (/k-12|kg-12|1-12|pre-?k-12/i.test(normalized)) {
    gradeLevels.push('kindergarten', 'elementary', 'middle', 'high')
    if (!minGrade) minGrade = 'kg1'
    maxGrade = 'grade12'
  } else if (/6-8/i.test(normalized)) {
    gradeLevels.push('middle')
    if (!minGrade) minGrade = 'grade6'
    maxGrade = 'grade8'
  } else {
    // Check for specific mentions
    if (/elementary|primary|grade [1-5]/i.test(normalized)) {
      gradeLevels.push('elementary')
      if (!minGrade) minGrade = 'grade1'
    }
    if (/middle|intermediate|grade [6-8]/i.test(normalized)) {
      gradeLevels.push('middle')
      if (!maxGrade) maxGrade = 'grade8'
    }
    if (/high|secondary|a-?level|igcse|grade (9|10|11|12)/i.test(normalized)) {
      gradeLevels.push('high')
      maxGrade = 'grade12'
    }
  }

  // If we detected multiple levels but no min grade, set it
  if (gradeLevels.length > 0 && !minGrade) {
    if (gradeLevels.includes('kindergarten')) minGrade = 'kg1'
    else if (gradeLevels.includes('elementary')) minGrade = 'grade1'
    else if (gradeLevels.includes('middle')) minGrade = 'grade6'
    else if (gradeLevels.includes('high')) minGrade = 'grade9'
  }

  // Remove duplicates
  return {
    gradeLevels: [...new Set(gradeLevels)],
    minGrade,
    maxGrade
  }
}

/**
 * Parse accreditations from CSV (comma-separated)
 */
function parseAccreditations(accreditationStr: string): string[] {
  if (!accreditationStr || accreditationStr.trim() === '') return []

  const normalized = accreditationStr.toLowerCase().trim()
  const accreditations: string[] = []

  const accreditationMap: Record<string, string> = {
    'cis': 'cis',
    'neasc': 'neasc',
    'bso': 'bso',
    'bsme': 'bsme',
    'ib world school': 'ib_world',
    'ib': 'ib_world',
    'msa': 'msa',
    'cognia': 'cognia',
    'advanced': 'cognia',
    'iaps': 'iaps',
    'british': 'british',
    'cbse': 'cbse',
    'ncert': 'ncert',
    'cambridge': 'cambridge',
    'mlf': 'mlf'
  }

  // Split by comma and check each
  const parts = normalized.split(',').map(p => p.trim())
  for (const part of parts) {
    for (const [key, value] of Object.entries(accreditationMap)) {
      if (part.includes(key)) {
        accreditations.push(value)
      }
    }
  }

  // Remove duplicates
  return [...new Set(accreditations)]
}

/**
 * Search for Google Place ID
 */
async function searchPlaceId(schoolName: string, governorate?: string): Promise<string | null> {
  try {
    const location = governorate ? `${governorate}, Goa` : 'Goa'
    const searchQuery = `${schoolName}, ${location}`
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_PLACES_API_KEY}`

    const response = await axios.get(url)

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      return response.data.results[0].place_id
    }

    return null
  } catch (error) {
    console.error(`  Error searching Place ID: ${error}`)
    return null
  }
}

/**
 * Create school record in database with CSV pre-populated data
 */
async function createSchool(row: CSVRow, placeId: string): Promise<string | null> {
  try {
    const schoolName = row['School Name'].trim()
    
    // Generate slug
    const slug = schoolName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Parse CSV fields
    const curriculum = parseCurriculum(row['Curriculum Type'])
    const { gradeLevels, minGrade, maxGrade } = parseGradeLevels(row['Grade Levels'])
    const accreditations = parseAccreditations(row['Accreditation'])

    const { data, error } = await supabase
      .from('schools')
      .insert({
        name: schoolName,
        slug: slug,
        governorate: row.Governorate || null,
        curriculum: curriculum.length > 0 ? curriculum : null,
        grade_levels: gradeLevels.length > 0 ? gradeLevels : null,
        min_grade: minGrade,
        max_grade: maxGrade,
        accreditations: accreditations.length > 0 ? accreditations : null,
        review_notes: row.Notes || null,
        google_place_id: placeId,
        extraction_status: 'pending',
        extraction_source: 'bulk_csv',
        active: false, // Will be set to true after extraction
        verified: false,
        address: 'Goa', // Placeholder - will be populated during extraction
        area: row.Governorate || 'Goa' // Placeholder - will be refined during extraction
      })
      .select('id')
      .single()

    if (error) {
      // Check if duplicate
      if (error.code === '23505') {
        return 'duplicate'
      }
      throw error
    }

    return data.id
  } catch (error) {
    console.error(`  Error creating school:`, error)
    return null
  }
}

/**
 * Wait/delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Main extraction function
 */
async function extractSchool(row: CSVRow, index: number, total: number): Promise<ExtractionResult> {
  const schoolName = row['School Name'].trim()

  console.log(`\n[${index + 1}/${total}] ${schoolName}`)
  console.log(`  Governorate: ${row.Governorate}`)
  console.log(`  Curriculum: ${row['Curriculum Type']}`)
  console.log(`  Grades: ${row['Grade Levels']}`)

  // Step 1: Search Place ID (unless already provided in CSV)
  let placeId = row['Google Place ID']?.trim()
  
  if (!placeId) {
    console.log(`  â†’ Searching Google Place ID...`)
    placeId = await searchPlaceId(schoolName, row.Governorate)

    if (!placeId) {
      console.log(`  âœ— Place ID not found`)
      return { name: schoolName, status: 'failed_place_id', error: 'Place ID not found' }
    }

    console.log(`  âœ“ Place ID found: ${placeId}`)
  } else {
    console.log(`  âœ“ Place ID from CSV: ${placeId}`)
  }

  // Step 2: Create school record
  console.log(`  â†’ Creating school record...`)
  const schoolId = await createSchool(row, placeId)

  if (!schoolId) {
    console.log(`  âœ— Failed to create school`)
    return { name: schoolName, status: 'failed_extraction', error: 'Database insert failed' }
  }

  if (schoolId === 'duplicate') {
    console.log(`  âš  Already exists - skipping`)
    return { name: schoolName, status: 'duplicate' }
  }

  console.log(`  âœ“ School created: ${schoolId}`)

  // Step 3: Run full extraction (import orchestrator here after env vars are loaded)
  console.log(`  â†’ Running full extraction (12 steps)...`)

  try {
    const { schoolExtractionOrchestrator } = await import('../src/lib/services/school-extraction-orchestrator')
    
    await schoolExtractionOrchestrator.executeExtraction({
      schoolId,
      placeId,
      searchQuery: schoolName
    })

    // Set to published after successful extraction
    await supabase
      .from('schools')
      .update({ active: true, verified: true })
      .eq('id', schoolId)

    console.log(`  âœ“ Extraction complete - PUBLISHED`)
    return { name: schoolName, status: 'success' }

  } catch (error) {
    console.log(`  âœ— Extraction failed: ${error}`)
    return {
      name: schoolName,
      status: 'failed_extraction',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Main script
 */
async function main() {
  console.log('=== BULK SCHOOL EXTRACTION ===\n')

  // Parse command line arguments
  const args = process.argv.slice(2)
  const limitIndex = args.indexOf('--limit')
  let limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : null
  
  // Also check for bare number argument (e.g., just "1")
  if (limit === null && args.length > 0 && !isNaN(parseInt(args[0]))) {
    limit = parseInt(args[0])
  }

  // Check if CSV exists
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`Error: CSV file not found at ${CSV_PATH}`)
    process.exit(1)
  }

  // Read and parse CSV
  console.log(`Reading CSV: ${CSV_PATH}`)
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8')
  const rows: CSVRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  })

  const totalRows = limit ? Math.min(limit, rows.length) : rows.length
  const rowsToProcess = rows.slice(0, totalRows)

  console.log(`Found ${rows.length} schools in CSV`)
  if (limit) {
    console.log(`Processing first ${totalRows} (--limit ${limit})`)
  }
  console.log(`Delay between extractions: ${DELAY_MS}ms\n`)

  // Track results
  const results: ExtractionResult[] = []
  const startTime = Date.now()

  // Process each school
  for (let i = 0; i < rowsToProcess.length; i++) {
    const row = rowsToProcess[i]
    const result = await extractSchool(row, i, totalRows)
    results.push(result)

    // Delay before next (except for last one)
    if (i < rowsToProcess.length - 1) {
      console.log(`  â³ Waiting ${DELAY_MS / 1000}s before next...`)
      await delay(DELAY_MS)
    }
  }

  // Summary
  const endTime = Date.now()
  const duration = Math.round((endTime - startTime) / 1000)

  console.log('\n' + '='.repeat(50))
  console.log('EXTRACTION SUMMARY')
  console.log('='.repeat(50))

  const successful = results.filter(r => r.status === 'success').length
  const failedPlaceId = results.filter(r => r.status === 'failed_place_id')
  const failedExtraction = results.filter(r => r.status === 'failed_extraction')
  const duplicates = results.filter(r => r.status === 'duplicate').length

  console.log(`\nTotal processed: ${results.length}`)
  console.log(`âœ“ Successful: ${successful}`)
  console.log(`âš  Duplicates (skipped): ${duplicates}`)
  console.log(`âœ— Failed Place ID: ${failedPlaceId.length}`)
  console.log(`âœ— Failed Extraction: ${failedExtraction.length}`)
  console.log(`\nTotal time: ${duration}s (${Math.round(duration / 60)}m)`)
  if (results.length > 0) {
    console.log(`Average time per school: ${(duration / results.length).toFixed(1)}s`)
  }

  // Failed Place IDs
  if (failedPlaceId.length > 0) {
    console.log(`\n--- Failed Place ID Lookup ---`)
    failedPlaceId.forEach(r => {
      console.log(`  - ${r.name}`)
    })
  }

  // Failed Extractions
  if (failedExtraction.length > 0) {
    console.log(`\n--- Failed Extractions ---`)
    failedExtraction.forEach(r => {
      console.log(`  - ${r.name}`)
      if (r.error) console.log(`    Error: ${r.error}`)
    })
  }

  console.log('\n' + '='.repeat(50))
  console.log('âœ“ Bulk school extraction complete!')
  console.log('Review schools at: http://localhost:3000/admin/schools')
  console.log('='.repeat(50) + '\n')
}

// Run script
main().catch(error => {
  console.error('\nâŒ Script failed:', error)
  process.exit(1)
})


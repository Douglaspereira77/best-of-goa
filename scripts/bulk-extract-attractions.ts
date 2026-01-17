#!/usr/bin/env ts-node
/**
 * Bulk Attraction Extraction Script
 *
 * Reads a CSV file of attractions and runs full extraction for each.
 *
 * Usage:
 *   npx tsx scripts/bulk-extract-attractions.ts
 *   npx tsx scripts/bulk-extract-attractions.ts --limit 5  (test with first 5)
 *
 * CSV Format: Rank, Place Name, Rating, Reviews, Category, Description
 */

// IMPORTANT: Load environment variables FIRST before any other imports
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'
import { attractionExtractionOrchestrator } from '../src/lib/services/attraction-extraction-orchestrator'

const CSV_PATH = 'c:\\Users\\Douglas\\Downloads\\places-to-visit.csv'
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY!
const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const DELAY_MS = 2000 // 2 seconds between extractions

interface CSVRow {
  Rank: string
  'Place Name': string
  Rating: string
  Reviews: string
  Category: string
  Description: string
}

interface ExtractionResult {
  name: string
  status: 'success' | 'failed_place_id' | 'failed_extraction' | 'duplicate'
  error?: string
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * Search for Google Place ID
 */
async function searchPlaceId(placeName: string): Promise<string | null> {
  try {
    const searchQuery = `${placeName}, Goa`
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
 * Create attraction record in database
 */
async function createAttraction(placeName: string, placeId: string): Promise<string | null> {
  try {
    // Generate slug
    const slug = placeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    const { data, error } = await supabase
      .from('attractions')
      .insert({
        name: placeName,
        slug: slug,
        address: 'Goa', // Placeholder - will be populated during extraction
        area: 'Goa', // Placeholder - will be populated during extraction
        google_place_id: placeId,
        extraction_status: 'pending',
        extraction_source: 'bulk_csv',
        active: false, // Will be set to true after extraction
        verified: false
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
    console.error(`  Error creating attraction:`, error)
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
async function extractAttraction(row: CSVRow, index: number, total: number): Promise<ExtractionResult> {
  const placeName = row['Place Name'].trim()

  console.log(`\n[${index + 1}/${total}] ${placeName}`)

  // Step 1: Search Place ID
  console.log(`  â†’ Searching Google Place ID...`)
  const placeId = await searchPlaceId(placeName)

  if (!placeId) {
    console.log(`  âœ— Place ID not found`)
    return { name: placeName, status: 'failed_place_id', error: 'Place ID not found' }
  }

  console.log(`  âœ“ Place ID found: ${placeId}`)

  // Step 2: Create attraction record
  console.log(`  â†’ Creating attraction record...`)
  const attractionId = await createAttraction(placeName, placeId)

  if (!attractionId) {
    console.log(`  âœ— Failed to create attraction`)
    return { name: placeName, status: 'failed_extraction', error: 'Database insert failed' }
  }

  if (attractionId === 'duplicate') {
    console.log(`  âš  Already exists - skipping`)
    return { name: placeName, status: 'duplicate' }
  }

  console.log(`  âœ“ Attraction created: ${attractionId}`)

  // Step 3: Run full extraction
  console.log(`  â†’ Running full extraction (7 steps)...`)

  try {
    await attractionExtractionOrchestrator.executeExtraction({
      attractionId,
      placeId,
      searchQuery: placeName
    })

    // Set to published after successful extraction
    await supabase
      .from('attractions')
      .update({ active: true, verified: true })
      .eq('id', attractionId)

    console.log(`  âœ“ Extraction complete - PUBLISHED`)
    return { name: placeName, status: 'success' }

  } catch (error) {
    console.log(`  âœ— Extraction failed: ${error}`)
    return {
      name: placeName,
      status: 'failed_extraction',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Main script
 */
async function main() {
  console.log('=== BULK ATTRACTION EXTRACTION ===\n')

  // Parse command line arguments
  const args = process.argv.slice(2)
  const limitIndex = args.indexOf('--limit')
  const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : null

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

  console.log(`Found ${rows.length} attractions in CSV`)
  if (limit) {
    console.log(`Processing first ${totalRows} (--limit ${limit})`)
  }
  console.log(`Delay between extractions: ${DELAY_MS}ms\n`)

  // Track results
  const results: ExtractionResult[] = []
  const startTime = Date.now()

  // Process each attraction
  for (let i = 0; i < rowsToProcess.length; i++) {
    const row = rowsToProcess[i]
    const result = await extractAttraction(row, i, totalRows)
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
  console.log('âœ“ Bulk extraction complete!')
  console.log('Review attractions at: http://localhost:3000/admin/attractions')
  console.log('='.repeat(50) + '\n')
}

// Run script
main().catch(error => {
  console.error('\nâŒ Script failed:', error)
  process.exit(1)
})

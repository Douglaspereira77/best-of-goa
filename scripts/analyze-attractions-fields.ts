#!/usr/bin/env ts-node
/**
 * Attraction Field Generation Analysis Script
 *
 * Analyzes the attractions database to identify:
 * - Which fields are being populated vs empty
 * - Field population rates across all attractions
 * - Which AI-generated fields are missing
 * - Data quality issues
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface FieldStats {
  fieldName: string
  displayName: string
  populated: number
  empty: number
  populationRate: string
  category: 'Basic Info' | 'Contact' | 'SEO' | 'AI-Generated' | 'Operational' | 'Features' | 'Ratings' | 'Meta'
}

async function analyzeAttractions() {
  console.log('='.repeat(80))
  console.log('ATTRACTION FIELD GENERATION ANALYSIS')
  console.log('='.repeat(80))
  console.log()

  // Fetch all attractions
  const { data: attractions, error } = await supabase
    .from('attractions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching attractions:', error)
    return
  }

  if (!attractions || attractions.length === 0) {
    console.log('No attractions found in database.')
    return
  }

  const total = attractions.length
  console.log(`Total Attractions: ${total}`)
  console.log()

  // Define fields to analyze
  const fieldsToAnalyze: Array<{ field: string; display: string; category: FieldStats['category'] }> = [
    // Basic Info
    { field: 'name', display: 'Name', category: 'Basic Info' },
    { field: 'name_ar', display: 'Arabic Name', category: 'Basic Info' },
    { field: 'slug', display: 'Slug', category: 'Basic Info' },
    { field: 'address', display: 'Address', category: 'Basic Info' },
    { field: 'area', display: 'Area', category: 'Basic Info' },
    { field: 'google_place_id', display: 'Google Place ID', category: 'Basic Info' },
    { field: 'latitude', display: 'Latitude', category: 'Basic Info' },
    { field: 'longitude', display: 'Longitude', category: 'Basic Info' },
    { field: 'neighborhood_id', display: 'Neighborhood ID', category: 'Basic Info' },

    // Contact
    { field: 'phone', display: 'Phone', category: 'Contact' },
    { field: 'email', display: 'Email', category: 'Contact' },
    { field: 'website', display: 'Website', category: 'Contact' },
    { field: 'instagram', display: 'Instagram', category: 'Contact' },
    { field: 'facebook', display: 'Facebook', category: 'Contact' },
    { field: 'twitter', display: 'Twitter', category: 'Contact' },
    { field: 'tiktok', display: 'TikTok', category: 'Contact' },
    { field: 'youtube', display: 'YouTube', category: 'Contact' },
    { field: 'linkedin', display: 'LinkedIn', category: 'Contact' },

    // AI-Generated Content
    { field: 'description', display: 'Description', category: 'AI-Generated' },
    { field: 'short_description', display: 'Short Description', category: 'AI-Generated' },
    { field: 'historical_significance', display: 'Historical Significance', category: 'AI-Generated' },
    { field: 'cultural_importance', display: 'Cultural Importance', category: 'AI-Generated' },
    { field: 'fun_facts', display: 'Fun Facts', category: 'AI-Generated' },

    // SEO Fields
    { field: 'meta_title', display: 'Meta Title', category: 'SEO' },
    { field: 'meta_description', display: 'Meta Description', category: 'SEO' },
    { field: 'meta_keywords', display: 'Meta Keywords', category: 'SEO' },
    { field: 'og_title', display: 'OG Title', category: 'SEO' },
    { field: 'og_description', display: 'OG Description', category: 'SEO' },
    { field: 'og_image', display: 'OG Image', category: 'SEO' },

    // Operational
    { field: 'attraction_type', display: 'Attraction Type', category: 'Operational' },
    { field: 'is_free', display: 'Is Free', category: 'Operational' },
    { field: 'admission_fee', display: 'Admission Fee', category: 'Operational' },
    { field: 'opening_hours', display: 'Opening Hours', category: 'Operational' },
    { field: 'typical_visit_duration', display: 'Typical Visit Duration', category: 'Operational' },
    { field: 'best_time_to_visit', display: 'Best Time to Visit', category: 'Operational' },
    { field: 'age_suitability', display: 'Age Suitability', category: 'Operational' },
    { field: 'wheelchair_accessible', display: 'Wheelchair Accessible', category: 'Operational' },
    { field: 'parking_available', display: 'Parking Available', category: 'Operational' },
    { field: 'guided_tours_available', display: 'Guided Tours Available', category: 'Operational' },
    { field: 'audio_guide_available', display: 'Audio Guide Available', category: 'Operational' },
    { field: 'photography_allowed', display: 'Photography Allowed', category: 'Operational' },

    // Features/Categories
    { field: 'attraction_category_ids', display: 'Category IDs', category: 'Features' },
    { field: 'attraction_amenity_ids', display: 'Amenity IDs', category: 'Features' },
    { field: 'attraction_feature_ids', display: 'Feature IDs', category: 'Features' },

    // Ratings
    { field: 'google_rating', display: 'Google Rating', category: 'Ratings' },
    { field: 'google_review_count', display: 'Google Review Count', category: 'Ratings' },
    { field: 'bok_score', display: 'BOK Score', category: 'Ratings' },
    { field: 'bok_score_breakdown', display: 'BOK Score Breakdown', category: 'Ratings' },
    { field: 'total_reviews_aggregated', display: 'Total Reviews', category: 'Ratings' },

    // Images
    { field: 'hero_image', display: 'Hero Image', category: 'Meta' },
    { field: 'logo_image', display: 'Logo Image', category: 'Meta' },

    // Status
    { field: 'extraction_status', display: 'Extraction Status', category: 'Meta' },
    { field: 'extraction_progress', display: 'Extraction Progress', category: 'Meta' },
    { field: 'apify_output', display: 'Apify Output', category: 'Meta' },
    { field: 'firecrawl_output', display: 'Firecrawl Output', category: 'Meta' },
  ]

  // Calculate statistics for each field
  const stats: FieldStats[] = fieldsToAnalyze.map(({ field, display, category }) => {
    let populated = 0
    let empty = 0

    attractions.forEach(attraction => {
      const value = attraction[field]

      // Check if field is populated
      const isPopulated =
        value !== null &&
        value !== undefined &&
        value !== '' &&
        (Array.isArray(value) ? value.length > 0 : true) &&
        (typeof value === 'object' && !Array.isArray(value) ? Object.keys(value).length > 0 : true)

      if (isPopulated) {
        populated++
      } else {
        empty++
      }
    })

    const populationRate = ((populated / total) * 100).toFixed(1)

    return {
      fieldName: field,
      displayName: display,
      populated,
      empty,
      populationRate: `${populationRate}%`,
      category
    }
  })

  // Group by category
  const categories = ['Basic Info', 'Contact', 'AI-Generated', 'SEO', 'Operational', 'Features', 'Ratings', 'Meta'] as const

  categories.forEach(category => {
    const categoryStats = stats.filter(s => s.category === category)

    console.log(`${'='.repeat(80)}`)
    console.log(`${category.toUpperCase()}`)
    console.log(`${'='.repeat(80)}`)
    console.log()
    console.log(`Field Name                          Populated    Empty    Rate`)
    console.log(`${'─'.repeat(80)}`)

    categoryStats.forEach(stat => {
      const fieldName = stat.displayName.padEnd(35)
      const populated = String(stat.populated).padStart(5)
      const empty = String(stat.empty).padStart(8)
      const rate = stat.populationRate.padStart(8)

      console.log(`${fieldName} ${populated}    ${empty}    ${rate}`)
    })

    console.log()
  })

  // Summary insights
  console.log(`${'='.repeat(80)}`)
  console.log('SUMMARY INSIGHTS')
  console.log(`${'='.repeat(80)}`)
  console.log()

  // Fields with 100% population
  const fullyPopulated = stats.filter(s => s.populated === total)
  console.log(`✅ Fully Populated Fields (100%): ${fullyPopulated.length}`)
  fullyPopulated.forEach(s => console.log(`   - ${s.displayName}`))
  console.log()

  // Fields with 0% population
  const emptyFields = stats.filter(s => s.populated === 0)
  console.log(`❌ Completely Empty Fields (0%): ${emptyFields.length}`)
  emptyFields.forEach(s => console.log(`   - ${s.displayName}`))
  console.log()

  // AI-generated fields analysis
  const aiFields = stats.filter(s => s.category === 'AI-Generated')
  const aiPopulated = aiFields.filter(s => s.populated > 0).length
  console.log(`🤖 AI-Generated Content:`)
  console.log(`   - Fields with some data: ${aiPopulated}/${aiFields.length}`)
  aiFields.forEach(s => {
    const icon = parseFloat(s.populationRate) > 80 ? '✅' :
                 parseFloat(s.populationRate) > 50 ? '⚠️' : '❌'
    console.log(`   ${icon} ${s.displayName}: ${s.populationRate}`)
  })
  console.log()

  // SEO fields analysis
  const seoFields = stats.filter(s => s.category === 'SEO')
  const seoPopulated = seoFields.filter(s => s.populated > 0).length
  console.log(`🔍 SEO Metadata:`)
  console.log(`   - Fields with some data: ${seoPopulated}/${seoFields.length}`)
  seoFields.forEach(s => {
    const icon = parseFloat(s.populationRate) > 80 ? '✅' :
                 parseFloat(s.populationRate) > 50 ? '⚠️' : '❌'
    console.log(`   ${icon} ${s.displayName}: ${s.populationRate}`)
  })
  console.log()

  // Sample a completed attraction
  const completedAttractions = attractions.filter(a => a.extraction_status === 'completed')
  if (completedAttractions.length > 0) {
    const sample = completedAttractions[0]
    console.log(`${'='.repeat(80)}`)
    console.log(`SAMPLE ATTRACTION: ${sample.name}`)
    console.log(`${'='.repeat(80)}`)
    console.log(`Status: ${sample.extraction_status}`)
    console.log(`Area: ${sample.area}`)
    console.log(`Type: ${sample.attraction_type || 'N/A'}`)
    console.log()
    console.log(`Description: ${sample.description ? 'YES (' + sample.description.substring(0, 80) + '...)' : 'NO'}`)
    console.log(`Short Description: ${sample.short_description || 'N/A'}`)
    console.log(`Meta Title: ${sample.meta_title || 'N/A'}`)
    console.log(`Meta Description: ${sample.meta_description || 'N/A'}`)
    console.log(`Opening Hours: ${sample.opening_hours ? 'YES' : 'NO'}`)
    console.log(`Typical Visit: ${sample.typical_visit_duration || 'N/A'}`)
    console.log(`Age Suitability: ${sample.age_suitability || 'N/A'}`)
    console.log(`Categories: ${sample.attraction_category_ids?.length || 0}`)
    console.log(`Amenities: ${sample.attraction_amenity_ids?.length || 0}`)
    console.log(`Features: ${sample.attraction_feature_ids?.length || 0}`)
    console.log(`Hero Image: ${sample.hero_image ? 'YES' : 'NO'}`)
    console.log()
  }

  console.log(`${'='.repeat(80)}`)
  console.log('END OF ANALYSIS')
  console.log(`${'='.repeat(80)}`)
}

analyzeAttractions().catch(console.error)

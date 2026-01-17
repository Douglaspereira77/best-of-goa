require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const csv = require('csv-parser')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Inline data mapping logic (from fitness-data-mapper.ts)
function detectGenderPolicy(name, description = '') {
  const text = `${name} ${description}`.toLowerCase()

  const womenKeywords = ['women only', 'ladies only', 'female only', 'for women', 'ladies gym']
  const menKeywords = ['men only', 'male only', 'for men', 'mens gym']
  const separateKeywords = ['separate hours', 'separate timings', 'segregated']

  if (womenKeywords.some(keyword => text.includes(keyword))) {
    return 'women-only'
  }
  if (menKeywords.some(keyword => text.includes(keyword))) {
    return 'men-only'
  }
  if (separateKeywords.some(keyword => text.includes(keyword))) {
    return 'separate-hours'
  }

  return 'co-ed'
}

function parseAmenities(apifyData) {
  const amenities = {}

  // Parse from additionalInfo if available
  const additionalInfo = apifyData.additionalInfo || {}

  // Amenities
  const amenitiesText = (additionalInfo.Amenities || '').toLowerCase()
  amenities.pool = amenitiesText.includes('swimming pool') || amenitiesText.includes('pool')
  amenities.sauna = amenitiesText.includes('sauna')
  amenities.steam_room = amenitiesText.includes('steam room')
  amenities.jacuzzi = amenitiesText.includes('jacuzzi') || amenitiesText.includes('hot tub')
  amenities.locker_rooms = amenitiesText.includes('locker') || amenitiesText.includes('changing room')
  amenities.showers = amenitiesText.includes('shower')

  // Parking
  const parkingText = (additionalInfo.Parking || '').toLowerCase()
  if (parkingText.includes('free')) {
    amenities.free_parking = true
  } else if (parkingText.includes('paid')) {
    amenities.paid_parking = true
  } else if (parkingText.includes('valet')) {
    amenities.valet_parking = true
  }

  // Accessibility
  const accessibilityText = (additionalInfo.Accessibility || '').toLowerCase()
  amenities.wheelchair_accessible = accessibilityText.includes('wheelchair')
  amenities.elevator = accessibilityText.includes('elevator') || accessibilityText.includes('lift')

  // Offerings
  const offeringsText = (additionalInfo.Offerings || '').toLowerCase()
  amenities.personal_training = offeringsText.includes('personal training') || offeringsText.includes('pt')
  amenities.group_classes = offeringsText.includes('group class') || offeringsText.includes('fitness class')
  amenities.childcare = offeringsText.includes('childcare') || offeringsText.includes('kids')

  // Atmosphere
  const atmosphereText = (additionalInfo.Atmosphere || '').toLowerCase()
  amenities.cafe = atmosphereText.includes('cafe') || atmosphereText.includes('coffee')
  amenities.pro_shop = atmosphereText.includes('shop') || atmosphereText.includes('store')

  return amenities
}

function categorizeFitnessType(apifyData) {
  const types = []
  const allText = `${apifyData.categoryName || ''} ${(apifyData.categories || []).join(' ')} ${(apifyData.placesTags || []).join(' ')}`.toLowerCase()

  if (allText.includes('gym') || allText.includes('fitness')) types.push('gym')
  if (allText.includes('yoga')) types.push('yoga')
  if (allText.includes('pilates')) types.push('pilates')
  if (allText.includes('crossfit')) types.push('crossfit')
  if (allText.includes('martial') || allText.includes('karate') || allText.includes('jiu-jitsu') || allText.includes('mma')) types.push('martial-arts')
  if (allText.includes('boxing') || allText.includes('kickboxing')) types.push('boxing')
  if (allText.includes('dance') || allText.includes('zumba')) types.push('dance')
  if (allText.includes('cycling') || allText.includes('spin')) types.push('cycling')
  if (allText.includes('swim')) types.push('swimming')
  if (allText.includes('personal training') || allText.includes('pt studio')) types.push('personal-training')

  // Default to gym if no specific type found
  if (types.length === 0) types.push('gym')

  return types
}

function mapDataInline(apifyData) {
  const name = apifyData.title || ''
  const slug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')

  // Detect gender policy
  const gender_policy = detectGenderPolicy(name, apifyData.description)

  // Parse amenities
  const amenities = parseAmenities(apifyData)

  // Categorize fitness types
  const fitness_types = categorizeFitnessType(apifyData)

  // Parse coordinates
  let latitude = null
  let longitude = null
  if (apifyData.location) {
    latitude = apifyData.location.lat || null
    longitude = apifyData.location.lng || null
  }

  // Parse opening hours
  const opening_hours = apifyData.openingHours || null

  return {
    name,
    slug,
    description: apifyData.description || null,
    short_description: apifyData.description ? apifyData.description.substring(0, 160) : null,
    address: apifyData.address || '',
    area: apifyData.neighborhood || apifyData.city || 'Goa',
    latitude,
    longitude,
    fitness_types,
    gender_policy,
    amenities,
    phone: apifyData.phone || null,
    website: apifyData.website || apifyData.url || null,
    google_place_id: apifyData.placeId || null,
    google_rating: apifyData.totalScore || null,
    google_review_count: apifyData.reviewsCount || null,
    opening_hours,
    extraction_status: 'completed',
    verified: false,
    featured: false,
    active: false,
    apify_output: apifyData,
    firecrawl_output: null
  }
}

async function importGyms() {
  const csvPath = 'C:\\Users\\Douglas\\Downloads\\Gym_data.csv'

  console.log('ðŸ‹ï¸  Starting bulk fitness import from CSV...\n')
  console.log(`Reading from: ${csvPath}\n`)

  const gyms = []
  const errors = []

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv({ separator: '\t' }))
      .on('data', (row) => {
        try {
          // Build apifyData from flattened CSV columns
          const apifyData = {
            title: row.title || '',
            address: row.address || '',
            categoryName: row.categoryName || '',
            categories: [row['categories/0'], row['categories/1'], row['categories/2']].filter(Boolean),
            city: row.city || '',
            neighborhood: row.neighborhood || '',
            phone: row.phone || '',
            website: row.website || '',
            placeId: row.placeId || '',
            totalScore: row.totalScore ? parseFloat(row.totalScore) : null,
            reviewsCount: row.reviewsCount ? parseInt(row.reviewsCount) : null,
            description: row.description || '',
            location: {
              lat: row['location/lat'] ? parseFloat(row['location/lat']) : null,
              lng: row['location/lng'] ? parseFloat(row['location/lng']) : null
            },
            openingHours: row['openingHours/0/day'] ? [
              { day: row['openingHours/0/day'], hours: row['openingHours/0/hours'] },
              { day: row['openingHours/1/day'], hours: row['openingHours/1/hours'] },
              { day: row['openingHours/2/day'], hours: row['openingHours/2/hours'] },
              { day: row['openingHours/3/day'], hours: row['openingHours/3/hours'] },
              { day: row['openingHours/4/day'], hours: row['openingHours/4/hours'] },
              { day: row['openingHours/5/day'], hours: row['openingHours/5/hours'] },
              { day: row['openingHours/6/day'], hours: row['openingHours/6/hours'] }
            ].filter(h => h.day) : null,
            additionalInfo: {
              Amenities: [
                row['additionalInfo/Amenities/0/Swimming pool'] === 'true' ? 'Swimming pool' : null,
                row['additionalInfo/Amenities/0/Basketball court'] === 'true' ? 'Basketball court' : null,
                row['additionalInfo/Amenities/0/Child care'] === 'true' ? 'Child care' : null,
                row['additionalInfo/Amenities/0/Restroom'] === 'true' ? 'Restroom' : null,
                row['additionalInfo/Amenities/0/Wi-Fi'] === 'true' ? 'Wi-Fi' : null,
                row['additionalInfo/Amenities/0/Free Wi-Fi'] === 'true' ? 'Free Wi-Fi' : null
              ].filter(Boolean).join(', '),
              Parking: [
                row['additionalInfo/Parking/0/Free parking lot'] === 'true' ? 'Free parking lot' : null,
                row['additionalInfo/Parking/0/Paid parking lot'] === 'true' ? 'Paid parking lot' : null,
                row['additionalInfo/Parking/0/On-site parking'] === 'true' ? 'On-site parking' : null
              ].filter(Boolean).join(', '),
              Accessibility: [
                row['additionalInfo/Accessibility/0/Wheelchair accessible entrance'] === 'true' ? 'Wheelchair accessible entrance' : null,
                row['additionalInfo/Accessibility/0/Wheelchair accessible parking lot'] === 'true' ? 'Wheelchair accessible parking lot' : null
              ].filter(Boolean).join(', '),
              Offerings: [
                row['additionalInfo/Offerings/0/Sauna'] === 'true' ? 'Sauna' : null,
                row['additionalInfo/Offerings/0/Food'] === 'true' ? 'Food' : null
              ].filter(Boolean).join(', '),
              Atmosphere: [
                row['additionalInfo/Atmosphere/0/Shower'] === 'true' ? 'Shower' : null
              ].filter(Boolean).join(', ')
            },
            placesTags: [],
            // Image data
            imageUrl: row.imageUrl || '',
            imageUrls: [
              row['imageUrls/0'],
              row['imageUrls/1'],
              row['imageUrls/2'],
              row['imageUrls/3'],
              row['imageUrls/4'],
              row['imageUrls/5'],
              row['imageUrls/6'],
              row['imageUrls/7'],
              row['imageUrls/8'],
              row['imageUrls/9']
            ].filter(Boolean),
            imagesCount: row.imagesCount || 0
          }

          if (apifyData.title) {
            gyms.push(apifyData)
          }
        } catch (err) {
          errors.push({ row, error: err.message })
        }
      })
      .on('end', async () => {
        console.log(`ðŸ“Š Parsed ${gyms.length} gyms from CSV`)

        // Limit to top 100 gyms
        const top100 = gyms.slice(0, 100)
        console.log(`ðŸŽ¯ Importing top ${top100.length} gyms\n`)

        if (errors.length > 0) {
          console.log(`âš ï¸  ${errors.length} rows had parsing errors\n`)
        }

        // Import each gym
        let imported = 0
        let skipped = 0
        let failed = 0

        for (const apifyData of top100) {
          try {
            const mappedData = mapDataInline(apifyData)

            // Check if gym already exists by slug or google_place_id
            let existing = null

            // Check by slug first
            const { data: bySlug } = await supabase
              .from('fitness_places')
              .select('id, name')
              .eq('slug', mappedData.slug)
              .maybeSingle()

            if (bySlug) {
              existing = bySlug
            } else if (mappedData.google_place_id) {
              // Check by google_place_id
              const { data: byPlaceId } = await supabase
                .from('fitness_places')
                .select('id, name')
                .eq('google_place_id', mappedData.google_place_id)
                .maybeSingle()

              if (byPlaceId) {
                existing = byPlaceId
              }
            }

            if (existing) {
              console.log(`â­ï¸  SKIPPED: ${mappedData.name} (already exists)`)
              skipped++
              continue
            }

            // Insert into database
            const { data, error } = await supabase
              .from('fitness_places')
              .insert([mappedData])
              .select()
              .single()

            if (error) {
              console.log(`âŒ FAILED: ${mappedData.name} - ${error.message}`)
              failed++
            } else {
              console.log(`âœ… IMPORTED: ${mappedData.name} (${mappedData.gender_policy}, ${mappedData.fitness_types.join(', ')})`)
              imported++
            }

          } catch (err) {
            console.log(`âŒ ERROR: ${err.message}`)
            failed++
          }
        }

        console.log('\n' + '='.repeat(60))
        console.log('ðŸ“Š IMPORT SUMMARY')
        console.log('='.repeat(60))
        console.log(`Total in CSV:     ${gyms.length}`)
        console.log(`ðŸŽ¯ Top selected:   ${top100.length}`)
        console.log(`âœ… Imported:       ${imported}`)
        console.log(`â­ï¸  Skipped:        ${skipped} (already exist)`)
        console.log(`âŒ Failed:         ${failed}`)
        console.log('='.repeat(60))

        resolve()
      })
      .on('error', (err) => {
        console.error('Error reading CSV:', err)
        reject(err)
      })
  })
}

importGyms()
  .then(() => {
    console.log('\nâœ… Bulk import complete!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('\nâŒ Import failed:', err)
    process.exit(1)
  })
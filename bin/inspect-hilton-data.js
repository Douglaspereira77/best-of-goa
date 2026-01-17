/**
 * Inspect Hilton Hotel Extraction Data
 *
 * Purpose: Check actual Apify and Firecrawl output to see what data is available
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectHiltonData() {
  console.log('\n========================================');
  console.log('HILTON HOTEL DATA INSPECTION');
  console.log('========================================\n');

  // Find Hilton hotel
  const { data: hotel, error } = await supabase
    .from('hotels')
    .select('*')
    .ilike('slug', '%hilton%')
    .single();

  if (error || !hotel) {
    console.error('❌ Error finding Hilton hotel:', error?.message || 'Not found');
    return;
  }

  console.log(`🏨 Hotel: ${hotel.name}`);
  console.log(`🆔 Slug: ${hotel.slug}`);
  console.log(`📊 Extraction Status: ${hotel.extraction_status}\n`);

  // ============================================================================
  // 1. APIFY OUTPUT ANALYSIS
  // ============================================================================
  console.log('\n========================================');
  console.log('1. APIFY OUTPUT ANALYSIS');
  console.log('========================================\n');

  if (hotel.apify_output) {
    console.log('✅ Apify data exists\n');

    // List all top-level keys
    const apifyKeys = Object.keys(hotel.apify_output);
    console.log(`📋 Top-level fields (${apifyKeys.length}):`);
    console.log(apifyKeys.map(k => `  • ${k}`).join('\n'));

    // Check for specific fields we're interested in
    console.log('\n🔍 FIELD CHECKS:\n');

    // Email
    if (hotel.apify_output.email) {
      console.log(`✅ email: "${hotel.apify_output.email}"`);
    } else {
      console.log('❌ email: NOT FOUND');
    }

    // Year opened/renovated
    if (hotel.apify_output.yearOpened) {
      console.log(`✅ yearOpened: ${hotel.apify_output.yearOpened}`);
    } else {
      console.log('❌ yearOpened: NOT FOUND');
    }

    if (hotel.apify_output.yearRenovated) {
      console.log(`✅ yearRenovated: ${hotel.apify_output.yearRenovated}`);
    } else {
      console.log('❌ yearRenovated: NOT FOUND');
    }

    // Number of floors
    if (hotel.apify_output.numberOfFloors) {
      console.log(`✅ numberOfFloors: ${hotel.apify_output.numberOfFloors}`);
    } else {
      console.log('❌ numberOfFloors: NOT FOUND');
    }

    // Hotel type
    if (hotel.apify_output.type || hotel.apify_output.hotelType || hotel.apify_output.category) {
      console.log(`✅ hotel type data: ${hotel.apify_output.type || hotel.apify_output.hotelType || hotel.apify_output.category}`);
    } else {
      console.log('❌ hotel type: NOT FOUND in Apify');
    }

    // Facilities/Amenities
    console.log('\n🏢 FACILITIES/AMENITIES:\n');

    const facilityFields = ['amenities', 'facilities', 'hotelFacilities', 'services', 'features', 'amenityList'];
    let foundFacilities = false;

    for (const field of facilityFields) {
      if (hotel.apify_output[field]) {
        console.log(`✅ ${field}:`);
        const data = hotel.apify_output[field];
        if (Array.isArray(data)) {
          console.log(`   ${data.slice(0, 10).join(', ')}${data.length > 10 ? '...' : ''}`);
          console.log(`   (Total: ${data.length} items)`);
        } else if (typeof data === 'object') {
          console.log(`   ${JSON.stringify(data).substring(0, 200)}...`);
        } else {
          console.log(`   ${data}`);
        }
        foundFacilities = true;
      }
    }

    if (!foundFacilities) {
      console.log('❌ No facilities/amenities found in standard fields');
      console.log('   Checking additionalInfo...');
      if (hotel.apify_output.additionalInfo) {
        const info = JSON.stringify(hotel.apify_output.additionalInfo).toLowerCase();
        const keywords = ['amenity', 'amenities', 'facility', 'facilities', 'service', 'feature'];
        const found = keywords.filter(k => info.includes(k));
        if (found.length > 0) {
          console.log(`   ⚠️ Found keywords in additionalInfo: ${found.join(', ')}`);
          console.log(`   Sample: ${JSON.stringify(hotel.apify_output.additionalInfo).substring(0, 300)}...`);
        }
      }
    }

    // Room types
    console.log('\n🛏️ ROOM TYPES:\n');

    const roomFields = ['roomTypes', 'rooms', 'roomOptions', 'accommodations'];
    let foundRooms = false;

    for (const field of roomFields) {
      if (hotel.apify_output[field]) {
        console.log(`✅ ${field}:`);
        const data = hotel.apify_output[field];
        if (Array.isArray(data)) {
          console.log(`   ${data.slice(0, 5).map(r => typeof r === 'object' ? r.name || r.type : r).join(', ')}${data.length > 5 ? '...' : ''}`);
          console.log(`   (Total: ${data.length} items)`);
        } else {
          console.log(`   ${JSON.stringify(data).substring(0, 200)}...`);
        }
        foundRooms = true;
      }
    }

    if (!foundRooms) {
      console.log('❌ No room types found in Apify output');
    }

  } else {
    console.log('❌ No Apify data available');
  }

  // ============================================================================
  // 2. FIRECRAWL OUTPUT ANALYSIS
  // ============================================================================
  console.log('\n========================================');
  console.log('2. FIRECRAWL OUTPUT ANALYSIS');
  console.log('========================================\n');

  if (hotel.firecrawl_output) {
    console.log('✅ Firecrawl data exists\n');

    const sections = Object.keys(hotel.firecrawl_output);
    console.log(`📋 Sections (${sections.length}):`);
    console.log(sections.map(s => `  • ${s}`).join('\n'));

    // Check TripAdvisor
    console.log('\n🔍 TRIPADVISOR SECTION:\n');
    if (hotel.firecrawl_output.tripadvisor) {
      const ta = hotel.firecrawl_output.tripadvisor;

      if (ta.results && ta.results.length > 0) {
        console.log(`✅ ${ta.results.length} TripAdvisor results found\n`);

        ta.results.slice(0, 3).forEach((result, i) => {
          console.log(`Result ${i + 1}:`);
          console.log(`  Title: ${result.title}`);
          console.log(`  Description: ${result.description?.substring(0, 150)}...`);
          if (result.markdown) {
            console.log(`  Markdown sample: ${result.markdown.substring(0, 200)}...`);
          }
          console.log('');
        });

        // Try to parse ratings
        const allText = ta.results
          .map((r) => `${r.title || ''} ${r.description || ''} ${r.markdown || ''}`)
          .join(' ');

        console.log('🔍 Parsing attempt:');
        const ratingMatch = allText.match(/(?:rating:|score:)?\s*(\d+\.?\d*)\s*(?:\/|of)\s*5/i);
        if (ratingMatch) {
          console.log(`  ✅ Rating found: ${ratingMatch[0]} → ${ratingMatch[1]}/5`);
        } else {
          console.log('  ❌ No rating pattern matched');
          console.log(`  Sample text: ${allText.substring(0, 300)}...`);
        }

        const reviewMatch = allText.match(/([\d,]+)\s*reviews?/i);
        if (reviewMatch) {
          console.log(`  ✅ Review count found: ${reviewMatch[0]} → ${reviewMatch[1]} reviews`);
        } else {
          console.log('  ❌ No review count pattern matched');
        }

      } else {
        console.log('⚠️ TripAdvisor section exists but has no results');
      }
    } else {
      console.log('❌ No TripAdvisor section found');
    }

    // Check Booking.com
    console.log('\n🔍 BOOKING.COM SECTION:\n');
    if (hotel.firecrawl_output.booking_com) {
      const booking = hotel.firecrawl_output.booking_com;

      if (booking.results && booking.results.length > 0) {
        console.log(`✅ ${booking.results.length} Booking.com results found\n`);

        booking.results.slice(0, 3).forEach((result, i) => {
          console.log(`Result ${i + 1}:`);
          console.log(`  Title: ${result.title}`);
          console.log(`  Description: ${result.description?.substring(0, 150)}...`);
          if (result.markdown) {
            console.log(`  Markdown sample: ${result.markdown.substring(0, 200)}...`);
          }
          console.log('');
        });

        // Try to parse data
        const allText = booking.results
          .map((r) => `${r.title || ''} ${r.description || ''} ${r.markdown || ''}`)
          .join(' ');

        console.log('🔍 Parsing attempt:');

        const ratingMatch = allText.match(/(?:rating:|score:)?\s*(\d+\.?\d*)\s*(?:\/|out\s*of)\s*10/i);
        if (ratingMatch) {
          console.log(`  ✅ Rating found: ${ratingMatch[0]} → ${ratingMatch[1]}/10`);
        } else {
          console.log('  ❌ No rating pattern matched');
        }

        const reviewMatch = allText.match(/([\d,]+)\s*reviews?/i);
        if (reviewMatch) {
          console.log(`  ✅ Review count found: ${reviewMatch[0]} → ${reviewMatch[1]} reviews`);
        } else {
          console.log('  ❌ No review count pattern matched');
        }

        const priceMatch = allText.match(/(?:from\s*)?(?:KWD|\$)\s*([\d,]+)/i);
        if (priceMatch) {
          console.log(`  ✅ Price found: ${priceMatch[0]}`);
        } else {
          console.log('  ❌ No price pattern matched');
        }

        const cancelMatch = allText.toLowerCase().includes('cancellation');
        if (cancelMatch) {
          console.log(`  ✅ Cancellation policy mentioned`);
          const cancelText = allText.match(/(?:cancellation|refund).{10,100}/i);
          if (cancelText) {
            console.log(`     "${cancelText[0]}..."`);
          }
        } else {
          console.log('  ❌ No cancellation policy mentioned');
        }

        console.log(`\n  Sample text: ${allText.substring(0, 300)}...`);

      } else {
        console.log('⚠️ Booking.com section exists but has no results');
      }
    } else {
      console.log('❌ No Booking.com section found');
    }

    // Check rooms section
    console.log('\n🔍 ROOMS SECTION:\n');
    if (hotel.firecrawl_output.rooms) {
      const rooms = hotel.firecrawl_output.rooms;

      if (rooms.results && rooms.results.length > 0) {
        console.log(`✅ ${rooms.results.length} room search results found`);

        const allText = rooms.results
          .map((r) => `${r.title || ''} ${r.description || ''} ${r.markdown || ''}`)
          .join(' ');

        // Look for room type mentions
        const roomKeywords = ['standard room', 'deluxe', 'suite', 'executive', 'king', 'twin', 'double'];
        const foundTypes = roomKeywords.filter(k => allText.toLowerCase().includes(k));

        if (foundTypes.length > 0) {
          console.log(`  ✅ Room types mentioned: ${foundTypes.join(', ')}`);
        }

        // Look for facilities
        const facilityKeywords = ['pool', 'gym', 'spa', 'restaurant', 'parking', 'wifi', 'breakfast'];
        const foundFacilities = facilityKeywords.filter(k => allText.toLowerCase().includes(k));

        if (foundFacilities.length > 0) {
          console.log(`  ✅ Facilities mentioned: ${foundFacilities.join(', ')}`);
        }

      } else {
        console.log('⚠️ Rooms section exists but has no results');
      }
    } else {
      console.log('❌ No rooms section found');
    }

  } else {
    console.log('❌ No Firecrawl data available');
  }

  // ============================================================================
  // 3. CURRENT DATABASE VALUES
  // ============================================================================
  console.log('\n========================================');
  console.log('3. CURRENT DATABASE VALUES');
  console.log('========================================\n');

  console.log('Field values we are checking:\n');
  console.log(`email: ${hotel.email || '❌ NULL'}`);
  console.log(`total_floors: ${hotel.total_floors || '❌ NULL'}`);
  console.log(`year_opened: ${hotel.year_opened || '❌ NULL'}`);
  console.log(`year_renovated: ${hotel.year_renovated || '❌ NULL'}`);
  console.log(`hotel_type: ${hotel.hotel_type || '❌ NULL'}`);
  console.log(`neighborhood_id: ${hotel.neighborhood_id || '❌ NULL'}`);
  console.log(`tripadvisor_rating: ${hotel.tripadvisor_rating || '❌ NULL'}`);
  console.log(`tripadvisor_review_count: ${hotel.tripadvisor_review_count || '❌ NULL'}`);
  console.log(`booking_com_rating: ${hotel.booking_com_rating || '❌ NULL'}`);
  console.log(`booking_com_review_count: ${hotel.booking_com_review_count || '❌ NULL'}`);
  console.log(`average_nightly_rate: ${hotel.average_nightly_rate || '❌ NULL'}`);
  console.log(`cancellation_policy: ${hotel.cancellation_policy || '❌ NULL'}`);
  console.log(`hotel_facility_ids: ${hotel.hotel_facility_ids?.length > 0 ? hotel.hotel_facility_ids : '❌ EMPTY'}`);
  console.log(`hotel_room_type_ids: ${hotel.hotel_room_type_ids?.length > 0 ? hotel.hotel_room_type_ids : '❌ EMPTY'}`);

  console.log('\n========================================\n');
}

inspectHiltonData()
  .then(() => {
    console.log('✅ Inspection complete\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Inspection failed:', error);
    process.exit(1);
  });

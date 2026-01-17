#!/usr/bin/env node

/**
 * FETCH MISSING HOTEL PLACE IDs
 *
 * Uses Google Places Text Search API to find Place IDs
 * for hotels missing from our discovery list
 *
 * Usage: node bin/fetch-missing-hotel-place-ids.js
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Search for hotel using Google Places Text Search API
 */
async function searchHotelPlaceId(hotelName, apiKey) {
  const query = `${hotelName} Goa hotel`;
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.append('query', query);
  url.searchParams.append('type', 'lodging');
  url.searchParams.append('key', apiKey);

  try {
    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return null;
    }

    // Return the first (best) match
    const result = data.results[0];
    return {
      place_id: result.place_id,
      name: result.name,
      address: result.formatted_address || result.vicinity || '',
      rating: result.rating || 0,
      user_ratings_total: result.user_ratings_total || 0,
      lat: result.geometry?.location?.lat || null,
      lng: result.geometry?.location?.lng || null,
      business_status: result.business_status || 'UNKNOWN',
      types: result.types || []
    };

  } catch (error) {
    console.error(`   âŒ API Error: ${error.message}`);
    return null;
  }
}

async function fetchMissingPlaceIds() {
  console.log('ðŸ¨ FETCH MISSING HOTEL PLACE IDs');
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\n');

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    console.error('âŒ GOOGLE_PLACES_API_KEY not found in .env.local');
    console.error('   Please add your Google Places API key to continue.\n');
    process.exit(1);
  }

  // Load missing hotels
  const missingPath = path.join(__dirname, '..', 'hotels-missing-from-discovery.json');

  if (!fs.existsSync(missingPath)) {
    console.error('âŒ hotels-missing-from-discovery.json not found');
    console.error('   Run bin/merge-hotel-lists.js first\n');
    process.exit(1);
  }

  const missingHotels = JSON.parse(fs.readFileSync(missingPath, 'utf8'));
  console.log(`ðŸ“Š Missing hotels to lookup: ${missingHotels.length}\n`);

  const foundHotels = [];
  const notFoundHotels = [];
  let apiCalls = 0;

  console.log('ðŸ” SEARCHING FOR PLACE IDs');
  console.log('â”€'.repeat(60) + '\n');

  for (let i = 0; i < missingHotels.length; i++) {
    const hotel = missingHotels[i];
    const progress = `[${i + 1}/${missingHotels.length}]`;

    console.log(`${progress} Searching: ${hotel.name}`);

    const result = await searchHotelPlaceId(hotel.name, apiKey);
    apiCalls++;

    if (result) {
      console.log(`${progress}   âœ… Found: ${result.name}`);
      console.log(`${progress}   Place ID: ${result.place_id}`);
      console.log(`${progress}   Rating: ${result.rating}â­ (${result.user_ratings_total} reviews)`);
      console.log(`${progress}   Address: ${result.address}\n`);

      foundHotels.push({
        original_name: hotel.name,
        tripadvisor_rating: hotel.tripadvisor_rating,
        price_usd: hotel.price_usd,
        ...result
      });
    } else {
      console.log(`${progress}   âŒ Not found\n`);
      notFoundHotels.push(hotel);
    }

    // Rate limiting: 500ms between requests
    if (i < missingHotels.length - 1) {
      await delay(500);
    }
  }

  // Summary
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  console.log('ðŸ“Š RESULTS SUMMARY\n');
  console.log(`   Total searched: ${missingHotels.length}`);
  console.log(`   âœ… Found: ${foundHotels.length}`);
  console.log(`   âŒ Not found: ${notFoundHotels.length}`);
  console.log(`   API calls made: ${apiCalls}`);
  console.log(`   Estimated cost: $${(apiCalls * 0.032).toFixed(2)}\n`);

  if (notFoundHotels.length > 0) {
    console.log('âš ï¸  HOTELS NOT FOUND:\n');
    notFoundHotels.forEach((hotel, index) => {
      console.log(`   ${index + 1}. ${hotel.name}`);
    });
    console.log('');
  }

  // Save found hotels
  const foundPath = path.join(__dirname, '..', 'hotels-missing-with-place-ids.json');
  fs.writeFileSync(foundPath, JSON.stringify(foundHotels, null, 2));
  console.log(`ðŸ’¾ Saved found hotels to: hotels-missing-with-place-ids.json\n`);

  // Now merge with existing legitimate hotels list
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  console.log('ðŸ”„ MERGING WITH EXISTING LIST\n');

  const legitimatePath = path.join(__dirname, '..', 'hotels-legitimate-4.0-plus.json');
  const existingHotels = JSON.parse(fs.readFileSync(legitimatePath, 'utf8'));

  console.log(`   Existing hotels: ${existingHotels.length}`);
  console.log(`   New hotels to add: ${foundHotels.length}`);

  // Convert found hotels to same format as existing
  const newHotelsFormatted = foundHotels.map(hotel => ({
    place_id: hotel.place_id,
    name: hotel.name,
    area: extractArea(hotel.address),
    address: hotel.address,
    rating: hotel.rating,
    user_ratings_total: hotel.user_ratings_total,
    price_level: null,
    lat: hotel.lat,
    lng: hotel.lng,
    business_status: hotel.business_status,
    types: hotel.types,
    photos: 0,
    filter_confidence: 'tripadvisor_import',
    filter_reason: `TripAdvisor ${hotel.tripadvisor_rating}â­, $${hotel.price_usd}/night`
  }));

  // Check for duplicates by place_id
  const existingPlaceIds = new Set(existingHotels.map(h => h.place_id));
  const uniqueNewHotels = newHotelsFormatted.filter(h => !existingPlaceIds.has(h.place_id));

  console.log(`   Unique new hotels (no duplicates): ${uniqueNewHotels.length}`);

  // Merge and sort
  const mergedHotels = [...existingHotels, ...uniqueNewHotels];
  mergedHotels.sort((a, b) => {
    if (b.rating !== a.rating) {
      return b.rating - a.rating;
    }
    return b.user_ratings_total - a.user_ratings_total;
  });

  console.log(`   Total merged list: ${mergedHotels.length} hotels\n`);

  // Save merged list
  const mergedPath = path.join(__dirname, '..', 'hotels-final-extraction-list.json');
  fs.writeFileSync(mergedPath, JSON.stringify(mergedHotels, null, 2));
  console.log(`ðŸ’¾ Saved final extraction list to: hotels-final-extraction-list.json`);

  // Also update the legitimate list
  fs.writeFileSync(legitimatePath, JSON.stringify(mergedHotels, null, 2));
  console.log(`ðŸ’¾ Updated hotels-legitimate-4.0-plus.json\n`);

  // Final cost estimate
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  console.log('ðŸ’° FINAL EXTRACTION COST ESTIMATE\n');
  console.log(`   Total hotels ready: ${mergedHotels.length}`);
  console.log(`   Estimated cost: $${mergedHotels.length.toFixed(2)}`);
  console.log(`   Estimated time: ${(mergedHotels.length * 3.5 / 60).toFixed(1)} hours\n`);

  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  console.log('âœ… PLACE ID FETCH COMPLETE\n');
  console.log('ðŸš€ Next step: Run bulk extraction');
  console.log('   node bin/extract-hotels-from-discovery.js\n');
}

/**
 * Extract area from address
 */
function extractArea(address) {
  if (!address) return 'Goa City';

  const areas = [
    'Salmiya', 'Hawalli', 'Farwaniya', 'Ahmadi', 'Jahra',
    'Goa City', 'Fahaheel', 'Mangaf', 'Fintas', 'Salwa',
    'Jabriya', 'Sharq', 'Al Kout', 'Messilah', 'Bidaa',
    'Mahboula', 'Al Khiran', 'Downtown'
  ];

  for (const area of areas) {
    if (address.toLowerCase().includes(area.toLowerCase())) {
      return area;
    }
  }

  return 'Goa City';
}

fetchMissingPlaceIds().catch(error => {
  console.error('âŒ Fetch failed:', error);
  process.exit(1);
});

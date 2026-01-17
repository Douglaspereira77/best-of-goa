#!/usr/bin/env node

/**
 * FILTER LEGITIMATE HOTELS
 *
 * Filters the discovered hotels to identify legitimate hotel/resort properties
 * Removes: Private homes, garages, mosques, residential apartments
 * Keeps: Hotels, resorts, inns, serviced apartments with hotel characteristics
 *
 * Usage: node bin/filter-legitimate-hotels.js
 */

const fs = require('fs');
const path = require('path');

// Hotel indicators (name contains these = likely a hotel)
const HOTEL_KEYWORDS = [
  'hotel', 'resort', 'inn', 'suites', 'plaza', 'tower',
  'marriott', 'hilton', 'hyatt', 'sheraton', 'crowne', 'holiday',
  'intercontinental', 'radisson', 'novotel', 'ibis', 'movenpick',
  'four seasons', 'ritz', 'regency', 'millennium', 'safir',
  'copthorne', 'arabella', 'symphony', 'residence', 'furnished',
  'serviced', 'apartments', 'vignette', 'ihg', 'motel', 'lodge'
];

// Exclude indicators (name contains these = NOT a hotel)
const EXCLUDE_KEYWORDS = [
  'Ø¯ÙŠÙˆØ§Ù†', 'Ø¨ÙŠØª', 'Ù…Ù†Ø²Ù„', 'Ù…Ø³Ø¬Ø¯', 'mosque', 'masjid',
  'garage', 'Ù…Ù‚Ø¨Ø±Ø©', 'cemetery', 'school', 'Ù…Ø¯Ø±Ø³Ø©',
  'hospital', 'Ù…Ø³ØªØ´ÙÙ‰', 'clinic', 'Ø¹ÙŠØ§Ø¯Ø©',
  'market', 'Ø³ÙˆÙ‚', 'mall', 'store', 'shop', 'Ù…Ø­Ù„'
];

// High-confidence threshold (reviews)
const HIGH_CONFIDENCE_REVIEW_THRESHOLD = 500; // 500+ reviews = definitely a hotel

/**
 * Check if a place is a legitimate hotel
 */
function isLegitimateHotel(place) {
  const nameLower = place.name.toLowerCase();

  // Rule 1: High review count = almost certainly a legitimate business
  if (place.user_ratings_total >= HIGH_CONFIDENCE_REVIEW_THRESHOLD) {
    // But exclude obvious non-hotels even with high reviews
    const hasExcludeKeyword = EXCLUDE_KEYWORDS.some(keyword =>
      nameLower.includes(keyword.toLowerCase())
    );
    if (hasExcludeKeyword) {
      return { isHotel: false, confidence: 'excluded_keyword', reason: 'Exclude keyword found despite high reviews' };
    }
    return { isHotel: true, confidence: 'high_reviews', reason: `${place.user_ratings_total} reviews` };
  }

  // Rule 2: Exclude keywords = definitely NOT a hotel
  const hasExcludeKeyword = EXCLUDE_KEYWORDS.some(keyword =>
    nameLower.includes(keyword.toLowerCase())
  );
  if (hasExcludeKeyword) {
    return { isHotel: false, confidence: 'excluded_keyword', reason: 'Contains exclude keyword' };
  }

  // Rule 3: Hotel keywords = likely a hotel
  const hasHotelKeyword = HOTEL_KEYWORDS.some(keyword =>
    nameLower.includes(keyword.toLowerCase())
  );
  if (hasHotelKeyword) {
    return { isHotel: true, confidence: 'hotel_keyword', reason: 'Contains hotel keyword' };
  }

  // Rule 4: Check place types (from Google)
  if (place.types) {
    const hotelTypes = ['lodging', 'hotel', 'resort', 'motel'];
    const hasHotelType = place.types.some(type => hotelTypes.includes(type.toLowerCase()));
    const excludeTypes = ['mosque', 'place_of_worship', 'cemetery', 'school', 'hospital'];
    const hasExcludeType = place.types.some(type => excludeTypes.includes(type.toLowerCase()));

    if (hasExcludeType) {
      return { isHotel: false, confidence: 'excluded_type', reason: 'Google type indicates non-hotel' };
    }
  }

  // Rule 5: Moderate reviews (100-499) + no exclude keywords = likely hotel
  if (place.user_ratings_total >= 100 && place.user_ratings_total < HIGH_CONFIDENCE_REVIEW_THRESHOLD) {
    return { isHotel: true, confidence: 'moderate_reviews', reason: `${place.user_ratings_total} reviews, no exclusions` };
  }

  // Rule 6: Low reviews (<100) + no clear indicators = uncertain (exclude to be safe)
  return { isHotel: false, confidence: 'uncertain', reason: 'Low reviews, no clear hotel indicators' };
}

/**
 * Main filtering function
 */
function filterLegitimateHotels() {
  console.log('ðŸ” FILTERING LEGITIMATE HOTELS');
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\n');

  // Read discovered hotels
  const inputPath = path.join(__dirname, '..', 'hotels-4.0-plus.json');

  if (!fs.existsSync(inputPath)) {
    console.error('âŒ hotels-4.0-plus.json not found');
    console.error('   Run bin/discover-goa-hotels.js first\n');
    process.exit(1);
  }

  const allHotels = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  console.log(`ðŸ“Š Input: ${allHotels.length} hotels (4.0+ rating)\n`);

  // Filter hotels
  const results = {
    legitimate: [],
    excluded: [],
    uncertain: []
  };

  for (const hotel of allHotels) {
    const check = isLegitimateHotel(hotel);

    const enrichedHotel = {
      ...hotel,
      filter_confidence: check.confidence,
      filter_reason: check.reason
    };

    if (check.isHotel) {
      results.legitimate.push(enrichedHotel);
    } else if (check.confidence === 'uncertain') {
      results.uncertain.push(enrichedHotel);
    } else {
      results.excluded.push(enrichedHotel);
    }
  }

  console.log('âœ… FILTERING COMPLETE\n');
  console.log(`   Legitimate hotels: ${results.legitimate.length}`);
  console.log(`   Excluded (non-hotels): ${results.excluded.length}`);
  console.log(`   Uncertain: ${results.uncertain.length}\n`);

  // Breakdown by confidence
  const confidenceBreakdown = {
    high_reviews: results.legitimate.filter(h => h.filter_confidence === 'high_reviews').length,
    hotel_keyword: results.legitimate.filter(h => h.filter_confidence === 'hotel_keyword').length,
    moderate_reviews: results.legitimate.filter(h => h.filter_confidence === 'moderate_reviews').length
  };

  console.log('ðŸ“Š LEGITIMATE HOTELS BREAKDOWN\n');
  console.log(`   High confidence (500+ reviews): ${confidenceBreakdown.high_reviews}`);
  console.log(`   Hotel keyword match: ${confidenceBreakdown.hotel_keyword}`);
  console.log(`   Moderate reviews (100-499): ${confidenceBreakdown.moderate_reviews}\n`);

  // Save legitimate hotels
  const legitimatePath = path.join(__dirname, '..', 'hotels-legitimate-4.0-plus.json');
  fs.writeFileSync(legitimatePath, JSON.stringify(results.legitimate, null, 2));
  console.log(`ðŸ’¾ Saved ${results.legitimate.length} legitimate hotels to: hotels-legitimate-4.0-plus.json\n`);

  // Save excluded for reference
  const excludedPath = path.join(__dirname, '..', 'hotels-excluded.json');
  fs.writeFileSync(excludedPath, JSON.stringify(results.excluded, null, 2));
  console.log(`ðŸ’¾ Saved ${results.excluded.length} excluded entries to: hotels-excluded.json\n`);

  // Display top 20 legitimate hotels
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  console.log('ðŸ¨ TOP 20 LEGITIMATE HOTELS (4.0+ RATING)\n');

  results.legitimate.slice(0, 20).forEach((hotel, index) => {
    console.log(`${index + 1}. ${hotel.name}`);
    console.log(`   Rating: ${hotel.rating} â­ (${hotel.user_ratings_total} reviews)`);
    console.log(`   Location: ${hotel.area}`);
    console.log(`   Confidence: ${hotel.filter_confidence}`);
    console.log(`   Place ID: ${hotel.place_id}\n`);
  });

  // Display some excluded examples
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  console.log('âŒ SAMPLE EXCLUDED ENTRIES (Not Hotels)\n');

  results.excluded.slice(0, 10).forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.name}`);
    console.log(`   Reason: ${entry.filter_reason}`);
    console.log(`   Reviews: ${entry.user_ratings_total}\n`);
  });

  // Final summary
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  console.log('âœ… FILTERING SUMMARY\n');
  console.log(`ðŸ“ Legitimate hotels ready for extraction: ${results.legitimate.length}`);
  console.log(`ðŸ’° Estimated extraction cost: $${results.legitimate.length.toFixed(2)}`);
  console.log(`â±ï¸  Estimated extraction time: ${(results.legitimate.length * 3.5 / 60).toFixed(1)} hours\n`);
  console.log('ðŸš€ Next: Build hotel extraction system (database + orchestrator + admin UI)\n');

  return results.legitimate;
}

// Run filter
filterLegitimateHotels();

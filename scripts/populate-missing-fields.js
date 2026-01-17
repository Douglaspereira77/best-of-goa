#!/usr/bin/env node
/**
 * Populate Missing Fields Script
 * 
 * This script extracts missing fields from existing Apify and Firecrawl data
 * and populates the database with the missing information.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Map price level from string to number
 */
function mapPriceLevel(price) {
  if (!price) return null;
  const priceMap = {
    '$': 1,
    '$$': 2,
    '$$$': 3,
    '$$$$': 4
  };
  return priceMap[price] || null;
}

/**
 * Calculate average meal price from price data
 */
function calculateAverageMealPrice(price, priceRange) {
  if (!price && !priceRange) return null;

  // Try to extract price from price range if available
  if (priceRange) {
    if (typeof priceRange === 'string') {
      const rangeMatch = priceRange.match(/(\d+)-(\d+)/);
      if (rangeMatch) {
        const min = parseInt(rangeMatch[1]);
        const max = parseInt(rangeMatch[2]);
        return Math.round((min + max) / 2);
      }
    }
  }

  // Fallback to price level estimation
  const priceLevel = mapPriceLevel(price);
  const priceEstimates = {
    1: 5,   // $
    2: 15,  // $$
    3: 25,  // $$$
    4: 40   // $$$$
  };

  return priceEstimates[priceLevel] || null;
}

/**
 * Normalize hours format from Apify to our standard format
 */
function normalizeHours(apifyHours) {
  if (!apifyHours || !Array.isArray(apifyHours)) return null;

  const normalized = {};
  const dayMap = {
    'monday': 'mon',
    'tuesday': 'tue',
    'wednesday': 'wed',
    'thursday': 'thu',
    'friday': 'fri',
    'saturday': 'sat',
    'sunday': 'sun'
  };

  apifyHours.forEach((entry) => {
    const dayKey = dayMap[entry.day.toLowerCase()];
    if (!dayKey) return;

    if (entry.hours.toLowerCase().includes('closed')) {
      normalized[dayKey] = { open: null, close: null, closed: true };
    } else {
      const parts = entry.hours.split(' to ');
      if (parts.length === 2) {
        normalized[dayKey] = {
          open: convertTo24Hour(parts[0].trim()),
          close: convertTo24Hour(parts[1].trim()),
          closed: false
        };
      }
    }
  });

  return normalized;
}

/**
 * Convert 12-hour time to 24-hour format
 */
function convertTo24Hour(time12h) {
  try {
    const [time, period] = time12h.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    // Handle cases where minutes might be undefined (e.g., "8 AM")
    if (isNaN(minutes)) minutes = 0;

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Error converting time:', time12h);
    return '00:00';
  }
}

/**
 * Extract mall name from address
 */
function extractMallName(address) {
  if (!address) return null;
  
  const mallPatterns = [
    /(Avenues Mall|360 Mall|Marina Mall|Grand Avenue|Souk Sharq|Al Kout Mall|The Avenues|Marina Crescent|Morouj Complex|Goa City Mall|Al Hamra Mall|The Gate Mall|Al Tijaria Tower|Al Shaheed Park|Salmiya Mall|Hawally Mall|Fahaheel Mall|Farwaniya Mall|Jahra Mall|Mubarakiya Souk|Souk Al-Mubarakiya)/i
  ];
  
  for (const pattern of mallPatterns) {
    const match = address.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Extract social media from Firecrawl data
 */
function extractSocialMediaFromFirecrawl(firecrawlData) {
  let instagram = null;
  let facebook = null;
  let twitter = null;

  const results = firecrawlData?.results;

  if (Array.isArray(results)) {
    results.forEach((result) => {
      const url = result.url || '';
      const content = result.content || result.markdown || '';

      // Check URLs first
      if (!instagram && url.includes('instagram.com')) {
        instagram = url;
      } else if (!facebook && (url.includes('facebook.com') || url.includes('fb.com'))) {
        facebook = url;
      } else if (!twitter && (url.includes('twitter.com') || url.includes('x.com'))) {
        twitter = url;
      }

      // Check content for social media handles/links
      if (!instagram) {
        const instagramMatch = content.match(/(?:instagram\.com\/|@)([a-zA-Z0-9._]+)/i);
        if (instagramMatch) {
          instagram = `https://instagram.com/${instagramMatch[1]}`;
        }
      }

      if (!facebook) {
        const facebookMatch = content.match(/(?:facebook\.com\/|fb\.com\/)([a-zA-Z0-9._]+)/i);
        if (facebookMatch) {
          facebook = `https://facebook.com/${facebookMatch[1]}`;
        }
      }

      if (!twitter) {
        const twitterMatch = content.match(/(?:twitter\.com\/|x\.com\/|@)([a-zA-Z0-9._]+)/i);
        if (twitterMatch) {
          twitter = `https://twitter.com/${twitterMatch[1]}`;
        }
      }
    });
  }

  return { instagram, facebook, twitter };
}

/**
 * Extract email from Firecrawl data
 */
function extractEmailFromFirecrawl(firecrawlData) {
  const results = firecrawlData?.results;

  if (Array.isArray(results)) {
    for (const result of results) {
      const content = result.content || result.markdown || '';
      const emailMatch = content.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      if (emailMatch) {
        return emailMatch[1];
      }
    }
  }

  return null;
}

/**
 * Extract reservations policy from reviews
 */
function extractReservationsPolicy(apifyData) {
  const reviews = apifyData?.reviews || [];
  const reservationKeywords = ['reservation', 'book', 'booking', 'table', 'walk-in', 'walk in'];
  
  for (const review of reviews) {
    const text = (review.text || review.review || '').toLowerCase();
    if (reservationKeywords.some(keyword => text.includes(keyword))) {
      if (text.includes('reservation') || text.includes('book')) {
        return 'Reservations Recommended';
      } else if (text.includes('walk-in') || text.includes('walk in')) {
        return 'Walk-ins Welcome';
      }
    }
  }

  return null;
}

/**
 * Extract parking info from reviews and address
 */
function extractParkingInfo(apifyData) {
  const reviews = apifyData?.reviews || [];
  const parkingKeywords = ['parking', 'valet', 'garage', 'lot', 'space'];
  
  for (const review of reviews) {
    const text = (review.text || review.review || '').toLowerCase();
    if (parkingKeywords.some(keyword => text.includes(keyword))) {
      if (text.includes('valet')) {
        return 'Valet Parking Available';
      } else if (text.includes('parking') && text.includes('free')) {
        return 'Free Parking Available';
      } else if (text.includes('parking')) {
        return 'Parking Available';
      }
    }
  }

  // Check address for mall parking
  const address = apifyData?.address || apifyData?.fullAddress || '';
  if (address.toLowerCase().includes('mall') || address.toLowerCase().includes('complex')) {
    return 'Mall Parking Available';
  }

  return null;
}

/**
 * Main function to populate missing fields
 */
async function populateMissingFields() {
  console.log('ðŸ” Fetching restaurants with missing data...\n');

  // Get restaurants that have Apify data but missing operational fields
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('id, name, apify_output, firecrawl_output')
    .not('apify_output', 'is', null)
    .or('hours.is.null,price_level.is.null,average_meal_price.is.null,reservations_policy.is.null,parking_info.is.null,instagram.is.null,facebook.is.null,email.is.null,mall_name.is.null');

  if (error) {
    console.error('âŒ Error fetching restaurants:', error);
    return;
  }

  console.log(`ðŸ“Š Found ${restaurants.length} restaurants with missing data\n`);

  let updated = 0;
  let errors = 0;

  for (const restaurant of restaurants) {
    try {
      console.log(`ðŸ”„ Processing: ${restaurant.name}`);
      
      const apifyData = restaurant.apify_output;
      const firecrawlData = restaurant.firecrawl_output;
      
      const updates = {};

      // Extract hours
      if (apifyData?.openingHours && !restaurant.hours) {
        updates.hours = normalizeHours(apifyData.openingHours);
        if (updates.hours) console.log('  âœ… Hours extracted');
      }

      // Extract price level and average meal price
      if (apifyData?.price && !restaurant.price_level) {
        updates.price_level = mapPriceLevel(apifyData.price);
        if (updates.price_level) console.log('  âœ… Price level extracted');
      }

      if (apifyData?.price && !restaurant.average_meal_price) {
        updates.average_meal_price = calculateAverageMealPrice(apifyData.price, apifyData.priceRange);
        if (updates.average_meal_price) console.log('  âœ… Average meal price calculated');
      }

      // Extract mall name
      if (apifyData?.address && !restaurant.mall_name) {
        updates.mall_name = extractMallName(apifyData.address);
        if (updates.mall_name) console.log('  âœ… Mall name extracted');
      }

      // Extract reservations policy
      if (!restaurant.reservations_policy) {
        updates.reservations_policy = extractReservationsPolicy(apifyData);
        if (updates.reservations_policy) console.log('  âœ… Reservations policy extracted');
      }

      // Extract parking info
      if (!restaurant.parking_info) {
        updates.parking_info = extractParkingInfo(apifyData);
        if (updates.parking_info) console.log('  âœ… Parking info extracted');
      }

      // Extract social media and email from Firecrawl
      if (firecrawlData) {
        const socialMedia = extractSocialMediaFromFirecrawl(firecrawlData);
        const email = extractEmailFromFirecrawl(firecrawlData);

        if (socialMedia.instagram && !restaurant.instagram) {
          updates.instagram = socialMedia.instagram;
          console.log('  âœ… Instagram extracted');
        }
        if (socialMedia.facebook && !restaurant.facebook) {
          updates.facebook = socialMedia.facebook;
          console.log('  âœ… Facebook extracted');
        }
        if (socialMedia.twitter && !restaurant.twitter) {
          updates.twitter = socialMedia.twitter;
          console.log('  âœ… Twitter extracted');
        }
        if (email && !restaurant.email) {
          updates.email = email;
          console.log('  âœ… Email extracted');
        }
      }

      // Update restaurant if we have any changes
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('restaurants')
          .update(updates)
          .eq('id', restaurant.id);

        if (updateError) {
          console.error(`  âŒ Update failed: ${updateError.message}`);
          errors++;
        } else {
          console.log(`  âœ… Updated ${Object.keys(updates).length} fields`);
          updated++;
        }
      } else {
        console.log('  âš ï¸  No new data to extract');
      }

      console.log(''); // Empty line for readability

    } catch (error) {
      console.error(`âŒ Error processing ${restaurant.name}:`, error.message);
      errors++;
    }
  }

  console.log('ðŸŽ‰ Population complete!');
  console.log(`âœ… Updated: ${updated} restaurants`);
  console.log(`âŒ Errors: ${errors} restaurants`);
}

// Run the script
populateMissingFields().catch(console.error);

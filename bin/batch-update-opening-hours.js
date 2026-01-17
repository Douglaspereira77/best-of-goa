#!/usr/bin/env node
/**
 * Batch Update Opening Hours for Malls
 *
 * Parses Apify opening hours and maps to database fields
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function parseHoursString(hoursStr) {
  try {
    const match = hoursStr.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM))\s*(?:to|-)\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM))/i);
    if (!match) return null;

    const openTime = convertTo24Hour(match[1].trim());
    const closeTime = convertTo24Hour(match[2].trim());

    if (!openTime || !closeTime) return null;

    return { open: openTime, close: closeTime };
  } catch (error) {
    return null;
  }
}

function convertTo24Hour(time12h) {
  try {
    const match = time12h.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
    if (!match) return null;

    let hours = parseInt(match[1]);
    const minutes = match[2] || '00';
    const period = match[3].toUpperCase();

    if (period === 'AM') {
      if (hours === 12) hours = 0;
    } else {
      if (hours !== 12) hours += 12;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  } catch (error) {
    return null;
  }
}

function parseOpeningHours(openingHours) {
  if (!Array.isArray(openingHours) || openingHours.length === 0) {
    return {};
  }

  try {
    const fridayEntry = openingHours.find(entry => entry.day === 'Friday');
    const weekdayEntry = openingHours.find(entry => entry.day === 'Saturday') ||
                        openingHours.find(entry => entry.day === 'Sunday');

    const result = {};

    if (weekdayEntry?.hours) {
      const times = parseHoursString(weekdayEntry.hours);
      if (times) {
        result.weekday_open_time = times.open;
        result.weekday_close_time = times.close;
      }
    }

    if (fridayEntry?.hours) {
      const times = parseHoursString(fridayEntry.hours);
      if (times) {
        result.friday_open_time = times.open;
        result.friday_close_time = times.close;
      }
    }

    // Don't save opening_hours JSON - column doesn't exist
    // Only save the parsed time fields

    return result;
  } catch (error) {
    return { opening_hours: openingHours };
  }
}

async function batchUpdateOpeningHours() {
  console.log('🕐 Batch Update Opening Hours for Malls');
  console.log('='.repeat(60));

  const { data: malls } = await supabase
    .from('malls')
    .select('id, name, apify_output, weekday_open_time')
    .not('apify_output', 'is', null);

  console.log(`Found ${malls.length} malls with Apify data\n`);

  let updated = 0;
  let skipped = 0;

  for (const mall of malls) {
    const openingHours = mall.apify_output?.openingHours;

    if (!openingHours || openingHours.length === 0) {
      console.log(`⏭️  ${mall.name.padEnd(45)} - No opening hours in Apify`);
      skipped++;
      continue;
    }

    const parsedHours = parseOpeningHours(openingHours);

    if (!parsedHours.weekday_open_time && !parsedHours.friday_open_time) {
      console.log(`⚠️  ${mall.name.padEnd(45)} - Failed to parse`);
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from('malls')
      .update(parsedHours)
      .eq('id', mall.id);

    if (error) {
      console.log(`❌ ${mall.name.padEnd(45)} - ${error.message}`);
      skipped++;
    } else {
      const hoursDisplay = parsedHours.weekday_open_time
        ? `${parsedHours.weekday_open_time}-${parsedHours.weekday_close_time}`
        : 'Friday only';
      console.log(`✅ ${mall.name.padEnd(45)} - ${hoursDisplay}`);
      updated++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 UPDATE SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Updated: ${updated}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`📍 Total: ${malls.length}`);
}

batchUpdateOpeningHours().catch(console.error);
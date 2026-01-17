/**
 * Backfill Script: Extract Structured Data for Existing Malls
 * 
 * This script uses AI to extract special features, parking details, and mall stats
 * from existing Firecrawl/Apify data for malls that already completed extraction.
 * 
 * Usage:
 * npx tsx src/scripts/backfill-mall-structured-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import { OpenAIClient } from '../lib/services/openai-client';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function backfillMallStructuredData() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const openaiClient = new OpenAIClient(process.env.OPENAI_API_KEY!);

  console.log('🔄 Starting structured data backfill for existing malls...\n');

  try {
    // Fetch all active malls
    const { data: malls, error } = await supabase
      .from('malls')
      .select('*')
      .eq('active', true)
      .eq('extraction_status', 'completed')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching malls:', error);
      return;
    }

    if (!malls || malls.length === 0) {
      console.log('❌ No malls found.');
      return;
    }

    console.log(`📊 Processing ${malls.length} malls\n`);
    console.log('='.repeat(80));

    let successCount = 0;
    let errorCount = 0;
    let featuresExtracted = 0;
    let parkingExtracted = 0;
    let statsExtracted = 0;

    for (const mall of malls) {
      try {
        console.log(`\n🏬 Processing: ${mall.name} (${mall.area})`);

        // Extract structured data using AI
        const structuredDataPrompt = `Analyze the following data about ${mall.name} shopping mall and extract structured information.

Mall Data:
${JSON.stringify({
  name: mall.name,
  area: mall.area,
  apify: mall.apify_output,
  firecrawl_general: mall.firecrawl_output?.general?.results?.slice(0, 5),
  firecrawl_website: mall.firecrawl_output?.website_scrape?.markdown?.substring(0, 2000),
}, null, 2)}

Extract and provide in JSON format:
{
  "special_features": ["array of special features like: indoor_theme_park, ice_rink, bowling, aquarium, kids_play_area, rooftop_dining, luxury_brands, cinema"],
  "parking_info": {
    "parking_type": "underground|multi_story|open_air|mixed or null",
    "valet_parking": true/false,
    "parking_fee": "free|paid|first_2_hours_free or null",
    "ev_charging_stations": number or 0
  },
  "mall_stats": {
    "total_stores": number or null,
    "total_floors": number or null,
    "total_parking_spaces": number or null,
    "year_opened": year as number or null,
    "mall_type": "regional|super_regional|community|lifestyle|outlet or null"
  }
}

Only include features/data you can confidently extract from the provided information. Use null for unknown values.`;

        const structuredDataResponse = await openaiClient.chat(structuredDataPrompt, 'gpt-4o');
        let structuredData: any = {};
        
        try {
          const jsonMatch = structuredDataResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            structuredData = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.error(`   ⚠️  Failed to parse AI response for ${mall.name}`);
          errorCount++;
          continue;
        }

        // Prepare updates
        const updates: any = {};

        if (structuredData.special_features && structuredData.special_features.length > 0) {
          updates.special_features = structuredData.special_features;
          featuresExtracted++;
          console.log(`   ✅ Special Features: ${structuredData.special_features.join(', ')}`);
        }

        if (structuredData.parking_info) {
          let parkingUpdated = false;
          if (structuredData.parking_info.parking_type) {
            updates.parking_type = structuredData.parking_info.parking_type;
            parkingUpdated = true;
          }
          if (structuredData.parking_info.valet_parking !== undefined && structuredData.parking_info.valet_parking !== null) {
            updates.valet_parking = structuredData.parking_info.valet_parking;
            parkingUpdated = true;
          }
          if (structuredData.parking_info.parking_fee) {
            updates.parking_fee = structuredData.parking_info.parking_fee;
            parkingUpdated = true;
          }
          if (structuredData.parking_info.ev_charging_stations) {
            updates.ev_charging_stations = structuredData.parking_info.ev_charging_stations;
            parkingUpdated = true;
          }
          
          if (parkingUpdated) {
            parkingExtracted++;
            console.log(`   ✅ Parking: ${JSON.stringify(structuredData.parking_info)}`);
          }
        }

        if (structuredData.mall_stats) {
          let statsUpdated = false;
          if (structuredData.mall_stats.total_stores) {
            updates.total_stores = structuredData.mall_stats.total_stores;
            statsUpdated = true;
          }
          if (structuredData.mall_stats.total_floors) {
            updates.total_floors = structuredData.mall_stats.total_floors;
            statsUpdated = true;
          }
          if (structuredData.mall_stats.total_parking_spaces) {
            updates.total_parking_spaces = structuredData.mall_stats.total_parking_spaces;
            statsUpdated = true;
          }
          if (structuredData.mall_stats.year_opened) {
            updates.year_opened = structuredData.mall_stats.year_opened;
            statsUpdated = true;
          }
          if (structuredData.mall_stats.mall_type) {
            updates.mall_type = structuredData.mall_stats.mall_type;
            statsUpdated = true;
          }

          if (statsUpdated) {
            statsExtracted++;
            console.log(`   ✅ Stats: ${JSON.stringify(structuredData.mall_stats)}`);
          }
        }

        // Update database if we have any updates
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('malls')
            .update(updates)
            .eq('id', mall.id);

          if (updateError) {
            console.error(`   ❌ Failed to update: ${updateError.message}`);
            errorCount++;
          } else {
            successCount++;
            console.log(`   ✓ Updated with ${Object.keys(updates).length} fields`);
          }
        } else {
          console.log(`   ⚠️  No structured data could be extracted`);
        }

      } catch (error: any) {
        console.error(`   ❌ Error processing ${mall.name}: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Malls Processed: ${malls.length}`);
    console.log(`✅ Successfully updated: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('');
    console.log(`🎯 Special Features extracted: ${featuresExtracted} malls`);
    console.log(`🅿️  Parking info extracted: ${parkingExtracted} malls`);
    console.log(`📈 Stats extracted: ${statsExtracted} malls`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('Fatal error:', error);
  }
}

// Run the script
backfillMallStructuredData()
  .then(() => {
    console.log('\n✅ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

































/**
 * Backfill Script: Extract Structured Data for Schools
 * 
 * This script extracts structured data for existing schools using AI:
 * - Special Features (boarding, special needs support)
 * - School Details (education levels, gender type, student count, teacher ratio, languages)
 * 
 * Usage:
 * npx tsx src/scripts/backfill-school-structured-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import { OpenAIClient } from '../lib/services/openai-client';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

async function backfillSchoolStructuredData() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const openaiClient = new OpenAIClient(openaiApiKey);

  console.log('ðŸŽ“ Starting School Structured Data Backfill...\n');

  try {
    // 1. Fetch all active schools
    const { data: schools, error: fetchError } = await supabase
      .from('schools')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('âŒ Error fetching schools:', fetchError);
      return;
    }

    if (!schools || schools.length === 0) {
      console.log('âŒ No schools found in the database.');
      return;
    }

    console.log(`ðŸ“Š Found ${schools.length} schools to process\n`);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // 2. Process each school
    for (let i = 0; i < schools.length; i++) {
      const school = schools[i];
      console.log(`\n[${i + 1}/${schools.length}] Processing: ${school.name}`);
      console.log(`   Area: ${school.area}, Type: ${school.school_type || 'N/A'}`);

      // Skip if already has all key structured data
      if (school.education_level && school.education_level.length > 0 && 
          school.gender_type && school.languages_offered && school.languages_offered.length > 0) {
        console.log(`   â­ï¸  Skipping (already has structured data)`);
        skippedCount++;
        continue;
      }

      try {
        // 3. Prepare AI prompt
        const structuredDataPrompt = `Extract the following structured data points for ${school.name} school in ${school.area}, Goa based on the provided information. If a piece of information is not available, use null or an empty array.

School Name: ${school.name}
Location: ${school.area}, Goa
School Type: ${school.school_type || 'N/A'}
Curriculum: ${school.curriculum?.join(', ') || 'N/A'}
Google Rating: ${school.google_rating || 'N/A'} (${school.google_review_count || 0} reviews)
Website: ${school.website || 'N/A'}

Additional info from search results and scraped content:
${JSON.stringify(school.firecrawl_output?.general?.results?.slice(0, 5) || [], null, 2)}
${JSON.stringify(school.firecrawl_output?.website_scrape?.content?.slice(0, 2000) || '', null, 2)}
${JSON.stringify(school.apify_output?.about || '', null, 2)}

Provide the output in JSON format:
{
  "special_features": {
    "has_boarding": "boolean (true/false/null)",
    "accepts_special_needs": "boolean (true/false/null)"
  },
  "school_details": {
    "education_level": "array of strings (e.g., ['kindergarten', 'elementary', 'middle_school', 'high_school'])",
    "gender_type": "string (e.g., 'coeducational', 'boys_only', 'girls_only', null)",
    "total_students": "number (approximate count, or null)",
    "student_teacher_ratio": "number (e.g., 15 for 15:1 ratio, or null)",
    "languages_offered": "array of strings (e.g., ['English', 'Arabic', 'French'], or empty array)"
  }
}`;

        // 4. Call OpenAI
        const structuredDataResponse = await openaiClient.chat(structuredDataPrompt, 'gpt-4o');
        let structuredData: any = {};
        
        try {
          const jsonMatch = structuredDataResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            structuredData = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.error('   âŒ Failed to parse AI response JSON:', e);
          errorCount++;
          continue;
        }

        // 5. Apply updates
        const updates: any = {};

        if (structuredData.special_features) {
          if (structuredData.special_features.has_boarding !== undefined && structuredData.special_features.has_boarding !== null) 
            updates.has_boarding = structuredData.special_features.has_boarding;
          if (structuredData.special_features.accepts_special_needs !== undefined && structuredData.special_features.accepts_special_needs !== null) 
            updates.accepts_special_needs = structuredData.special_features.accepts_special_needs;
        }

        if (structuredData.school_details) {
          if (structuredData.school_details.education_level && structuredData.school_details.education_level.length > 0) 
            updates.education_level = structuredData.school_details.education_level;
          if (structuredData.school_details.gender_type !== undefined && structuredData.school_details.gender_type !== null) 
            updates.gender_type = structuredData.school_details.gender_type;
          if (structuredData.school_details.total_students !== undefined && structuredData.school_details.total_students !== null) 
            updates.total_students = structuredData.school_details.total_students;
          if (structuredData.school_details.student_teacher_ratio !== undefined && structuredData.school_details.student_teacher_ratio !== null) 
            updates.student_teacher_ratio = structuredData.school_details.student_teacher_ratio;
          if (structuredData.school_details.languages_offered && structuredData.school_details.languages_offered.length > 0) 
            updates.languages_offered = structuredData.school_details.languages_offered;
        }

        if (Object.keys(updates).length === 0) {
          console.log('   âš ï¸  No structured data extracted');
          skippedCount++;
          continue;
        }

        // 6. Update database
        const { error: updateError } = await supabase
          .from('schools')
          .update(updates)
          .eq('id', school.id);

        if (updateError) {
          console.error(`   âŒ Error updating school:`, updateError.message);
          errorCount++;
          continue;
        }

        console.log(`   âœ… Updated fields: ${Object.keys(updates).join(', ')}`);
        if (updates.education_level) console.log(`      â€¢ Education Levels: ${updates.education_level.join(', ')}`);
        if (updates.gender_type) console.log(`      â€¢ Gender Type: ${updates.gender_type}`);
        if (updates.total_students) console.log(`      â€¢ Total Students: ${updates.total_students}`);
        if (updates.student_teacher_ratio) console.log(`      â€¢ Student/Teacher Ratio: ${updates.student_teacher_ratio}:1`);
        if (updates.languages_offered) console.log(`      â€¢ Languages: ${updates.languages_offered.join(', ')}`);
        if (updates.has_boarding !== undefined) console.log(`      â€¢ Boarding: ${updates.has_boarding ? 'Yes' : 'No'}`);
        if (updates.accepts_special_needs !== undefined) console.log(`      â€¢ Special Needs: ${updates.accepts_special_needs ? 'Yes' : 'No'}`);

        successCount++;

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.error(`   âŒ Failed to process:`, error.message);
        errorCount++;
      }
    }

    // 7. Summary
    console.log('\n' + '='.repeat(80));
    console.log('ðŸ“ˆ BACKFILL COMPLETE');
    console.log('='.repeat(80));
    console.log(`âœ… Successfully processed: ${successCount} schools`);
    console.log(`â­ï¸  Skipped (already complete): ${skippedCount} schools`);
    if (errorCount > 0) {
      console.log(`âŒ Errors encountered: ${errorCount} schools`);
    }
    console.log(`ðŸ“Š Total: ${schools.length} schools`);

  } catch (error) {
    console.error('ðŸ’¥ Fatal error:', error);
  }
}

// Run the script
backfillSchoolStructuredData()
  .then(() => {
    console.log('\nâœ… Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

































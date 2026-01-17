#!/usr/bin/env node

/**
 * Execute Phase 3a: AI Auto-Classification on Khaneen
 * This script runs the AI classification and displays results
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function callClaudeForClassification(prompt: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Phase 3a] Anthropic API error:', error);
      return null;
    }

    const result = await response.json();
    return result.content?.[0]?.text || null;
  } catch (error) {
    console.error('[Phase 3a] Error calling Claude API:', error);
    return null;
  }
}

function buildClassificationPrompt(restaurant: any, referenceData: any): string {
  const cuisineList = referenceData.cuisines.map((c: any) => c.name).join(', ');
  const categoryList = referenceData.categories.map((c: any) => c.name).join(', ');
  const featureList = referenceData.features.map((f: any) => f.name).join(', ');
  const mealList = referenceData.meals.map((m: any) => m.name).join(', ');
  const goodForList = referenceData.goodFor.map((g: any) => g.name).join(', ');

  const reviewSamples = (restaurant.apify_output?.reviews || [])
    .slice(0, 3)
    .map((r: any) => `"${r.text?.substring(0, 100) || ''}"`)
    .join(' | ');

  return `You are a restaurant classification expert. Classify this restaurant accurately for Best of Goa.

RESTAURANT DATA:
- Name: ${restaurant.name}
- Address: ${restaurant.address}
- Website: ${restaurant.website}
- Rating: ${restaurant.overall_rating || 'Not available'}/5
- Review Samples: ${reviewSamples || 'No samples available'}
- Description: ${restaurant.description || 'Not available'}

AVAILABLE CLASSIFICATIONS:

CUISINES (select 1-3 most relevant):
${cuisineList}

CATEGORIES (select 1-2):
${categoryList}

FEATURES (select 2-5 most relevant):
${featureList}

MEALS (select 1-4 that the restaurant serves):
${mealList}

GOOD FOR (select 1-3 experience types):
${goodForList}

RESPOND WITH THIS EXACT JSON (use exact names from lists, no extra fields):
{
  "cuisines": ["Name1", "Name2"],
  "categories": ["Name1"],
  "features": ["Name1", "Name2"],
  "meals": ["Name1"],
  "good_for": ["Name1"],
  "confidence_score": 0.85,
  "reasoning": "Brief explanation"
}`;
}

function parseClassificationResponse(response: string): any {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Phase 3a] Could not find JSON in response');
      return { cuisines: [], categories: [], features: [], meals: [], good_for: [], confidence_score: 0 };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      cuisines: Array.isArray(parsed.cuisines) ? parsed.cuisines : [],
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      features: Array.isArray(parsed.features) ? parsed.features : [],
      meals: Array.isArray(parsed.meals) ? parsed.meals : [],
      good_for: Array.isArray(parsed.good_for) ? parsed.good_for : [],
      confidence_score: typeof parsed.confidence_score === 'number' ? parsed.confidence_score : 0.8,
      reasoning: parsed.reasoning || ''
    };
  } catch (error) {
    console.error('[Phase 3a] Error parsing Claude response:', error);
    return { cuisines: [], categories: [], features: [], meals: [], good_for: [], confidence_score: 0 };
  }
}

async function mapNamesToIds(table: string, names: string[]): Promise<string[]> {
  if (!names || names.length === 0) return [];

  const { data } = await supabase
    .from(table)
    .select('id')
    .in('name', names);

  return (data || []).map((row: any) => row.id);
}

async function main() {
  console.log('\nâ•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—');
  console.log('â•‘          Phase 3a: Executing AI Classification - Khaneen            â•‘');
  console.log('â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\n');

  try {
    // Step 1: Find Khaneen
    console.log('ðŸ“ Step 1: Finding Khaneen restaurant...');
    const { data: restaurants, error: findError } = await supabase
      .from('restaurants')
      .select('*')
      .ilike('name', '%khaneen%')
      .order('created_at', { ascending: false })
      .limit(1);

    if (findError || !restaurants || restaurants.length === 0) {
      console.error('âŒ Khaneen not found');
      process.exit(1);
    }

    const khaneen = restaurants[0];
    console.log(`âœ… Found: ${khaneen.name}`);
    console.log(`   ID: ${khaneen.id}\n`);

    // Step 2: Fetch reference tables
    console.log('ðŸ“ Step 2: Fetching reference table values...');
    const [cuisines, categories, features, meals, goodFor] = await Promise.all([
      supabase.from('restaurants_cuisines').select('id, name'),
      supabase.from('restaurants_categories').select('id, name'),
      supabase.from('restaurants_features').select('id, name, category'),
      supabase.from('restaurants_meals').select('id, name'),
      supabase.from('restaurants_good_for').select('id, name')
    ]);

    const referenceData = {
      cuisines: cuisines.data || [],
      categories: categories.data || [],
      features: features.data || [],
      meals: meals.data || [],
      goodFor: goodFor.data || []
    };

    console.log(`âœ… Reference tables loaded: ${referenceData.cuisines.length} cuisines, ${referenceData.categories.length} categories, ${referenceData.features.length} features, ${referenceData.meals.length} meals, ${referenceData.goodFor.length} good_for\n`);

    // Step 3: Build prompt and call Claude
    console.log('ðŸ“ Step 3: Building classification prompt...');
    const prompt = buildClassificationPrompt(khaneen, referenceData);
    console.log('âœ… Prompt ready\n');

    console.log('ðŸ“ Step 4: Calling Claude API...');
    const claudeResponse = await callClaudeForClassification(prompt);

    if (!claudeResponse) {
      console.error('âŒ Claude API failed');
      process.exit(1);
    }

    console.log('âœ… Claude response received\n');

    // Step 5: Parse response
    console.log('ðŸ“ Step 5: Parsing classifications...');
    const classifications = parseClassificationResponse(claudeResponse);

    console.log('âœ… Parsed response:');
    console.log(`   Cuisines: ${classifications.cuisines.join(', ')}`);
    console.log(`   Categories: ${classifications.categories.join(', ')}`);
    console.log(`   Features: ${classifications.features.join(', ')}`);
    console.log(`   Meals: ${classifications.meals.join(', ')}`);
    console.log(`   Good For: ${classifications.good_for.join(', ')}`);
    console.log(`   Confidence: ${(classifications.confidence_score * 100).toFixed(0)}%\n`);

    // Step 6: Map to UUIDs
    console.log('ðŸ“ Step 6: Mapping to database UUIDs...');
    const [cuisineIds, categoryIds, featureIds, mealIds, goodForIds] = await Promise.all([
      mapNamesToIds('restaurants_cuisines', classifications.cuisines),
      mapNamesToIds('restaurants_categories', classifications.categories),
      mapNamesToIds('restaurants_features', classifications.features),
      mapNamesToIds('restaurants_meals', classifications.meals),
      mapNamesToIds('restaurants_good_for', classifications.good_for)
    ]);

    console.log('âœ… Mapped to UUIDs:\n');
    console.log(`   Cuisine IDs (${cuisineIds.length}): ${cuisineIds.join(', ') || '(none)'}`);
    console.log(`   Category IDs (${categoryIds.length}): ${categoryIds.join(', ') || '(none)'}`);
    console.log(`   Feature IDs (${featureIds.length}): ${featureIds.join(', ') || '(none)'}`);
    console.log(`   Meal IDs (${mealIds.length}): ${mealIds.join(', ') || '(none)'}`);
    console.log(`   Good For IDs (${goodForIds.length}): ${goodForIds.join(', ') || '(none)'}\n`);

    // Step 7: Update restaurant
    console.log('ðŸ“ Step 7: Updating restaurant record...');
    const updateData = {
      restaurant_cuisine_ids: cuisineIds,
      restaurant_category_ids: categoryIds,
      restaurant_feature_ids: featureIds,
      restaurant_meal_ids: mealIds,
      restaurant_good_for_ids: goodForIds,
      _metadata: {
        ...(khaneen._metadata || {}),
        is_ai_classified: true,
        ai_classification_date: new Date().toISOString(),
        ai_confidence_score: classifications.confidence_score || 0.8,
        ai_reasoning: classifications.reasoning || ''
      }
    };

    const { error: updateError } = await supabase
      .from('restaurants')
      .update(updateData)
      .eq('id', khaneen.id);

    if (updateError) {
      console.error('âŒ Error updating restaurant:', updateError.message);
      process.exit(1);
    }

    console.log('âœ… Restaurant updated!\n');

    // Step 8: Verify update
    console.log('ðŸ“ Step 8: Verifying update...');
    const { data: updated } = await supabase
      .from('restaurants')
      .select('restaurant_cuisine_ids, restaurant_category_ids, restaurant_feature_ids, restaurant_meal_ids, restaurant_good_for_ids, _metadata')
      .eq('id', khaneen.id)
      .single();

    console.log('\nâ•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—');
    console.log('â•‘                       CLASSIFICATION RESULTS                      â•‘');
    console.log('â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\n');

    const totalIds = (updated?.restaurant_cuisine_ids?.length || 0) +
                     (updated?.restaurant_category_ids?.length || 0) +
                     (updated?.restaurant_feature_ids?.length || 0) +
                     (updated?.restaurant_meal_ids?.length || 0) +
                     (updated?.restaurant_good_for_ids?.length || 0);

    console.log(`âœ… SUCCESS! Khaneen has been classified with ${totalIds} reference IDs\n`);

    console.log('Reference IDs Updated:');
    console.log(`  âœ… Cuisines: ${updated?.restaurant_cuisine_ids?.length || 0} IDs`);
    console.log(`  âœ… Categories: ${updated?.restaurant_category_ids?.length || 0} IDs`);
    console.log(`  âœ… Features: ${updated?.restaurant_feature_ids?.length || 0} IDs`);
    console.log(`  âœ… Meals: ${updated?.restaurant_meal_ids?.length || 0} IDs`);
    console.log(`  âœ… Good For: ${updated?.restaurant_good_for_ids?.length || 0} IDs\n`);

    if (updated?._metadata?.is_ai_classified) {
      console.log('Metadata:');
      console.log(`  AI Classified: Yes`);
      console.log(`  Confidence: ${(updated._metadata.ai_confidence_score * 100).toFixed(0)}%`);
      console.log(`  Reasoning: ${updated._metadata.ai_reasoning}\n`);
    }

    console.log('â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—');
    console.log('â•‘                    PHASE 3a EXECUTION COMPLETE                    â•‘');
    console.log('â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\n');

    process.exit(0);
  } catch (error) {
    console.error('\nâŒ Error:', error);
    process.exit(1);
  }
}

main();

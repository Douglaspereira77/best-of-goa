/**
 * BOK Content Quality Audit Script
 * Comprehensive content quality check across all Best of Goa categories
 *
 * Usage: npx tsx scripts/content-quality-audit.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface QualityScore {
  category: string;
  totalRecords: number;
  publishedRecords: number;
  completenessScore: number;
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
  fieldStats: Record<string, { populated: number; percentage: number }>;
}

// Helper function to calculate field population
function calculateFieldStats(records: any[], fields: string[]): Record<string, { populated: number; percentage: number }> {
  const stats: Record<string, { populated: number; percentage: number }> = {};
  const total = records.length;

  fields.forEach(field => {
    const populated = records.filter(r => {
      const value = r[field];
      if (value === null || value === undefined) return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }).length;

    stats[field] = {
      populated,
      percentage: total > 0 ? Math.round((populated / total) * 100) : 0
    };
  });

  return stats;
}

async function auditRestaurants(): Promise<QualityScore> {
  console.log('\nðŸ½ï¸  AUDITING RESTAURANTS...\n');

  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select(`
      name, slug, description, hero_image, google_place_id,
      address, latitude, longitude, phone, website, instagram,
      overall_rating, price_level, hours, meta_title, meta_description,
      status, id
    `);

  if (error) throw error;

  const criticalIssues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  const total = restaurants?.length || 0;
  const published = restaurants?.filter(r => r.status === 'published').length || 0;

  // Critical fields for restaurants
  const criticalFields = [
    'name', 'slug', 'description', 'hero_image',
    'google_place_id', 'address', 'latitude', 'longitude'
  ];

  const importantFields = [
    'phone', 'website', 'instagram', 'overall_rating',
    'price_level', 'hours', 'meta_title', 'meta_description'
  ];

  const allFields = [...criticalFields, ...importantFields];
  const fieldStats = calculateFieldStats(restaurants || [], allFields);

  // Check critical issues
  criticalFields.forEach(field => {
    if (fieldStats[field].percentage < 90) {
      criticalIssues.push(`${field}: Only ${fieldStats[field].percentage}% populated (${fieldStats[field].populated}/${total})`);
    }
  });

  // Check warnings
  importantFields.forEach(field => {
    if (fieldStats[field].percentage < 70) {
      warnings.push(`${field}: Only ${fieldStats[field].percentage}% populated (${fieldStats[field].populated}/${total})`);
    }
  });

  // Get image stats
  const { data: images } = await supabase
    .from('restaurant_images')
    .select('restaurant_id');

  const restaurantsWithImages = new Set(images?.map(i => i.restaurant_id) || []);
  const imagePercentage = Math.round((restaurantsWithImages.size / total) * 100);

  if (imagePercentage < 80) {
    warnings.push(`Only ${imagePercentage}% of restaurants have images (${restaurantsWithImages.size}/${total})`);
  }

  // Get dishes stats
  const { data: dishes } = await supabase
    .from('restaurants_dishes')
    .select('restaurant_id');

  const restaurantsWithDishes = new Set(dishes?.map(d => d.restaurant_id) || []);
  const dishesPercentage = Math.round((restaurantsWithDishes.size / total) * 100);

  if (dishesPercentage < 50) {
    recommendations.push(`Only ${dishesPercentage}% of restaurants have menu items (${restaurantsWithDishes.size}/${total})`);
  }

  // Calculate overall completeness
  const avgCompleteness = Object.values(fieldStats).reduce((sum, stat) => sum + stat.percentage, 0) / allFields.length;

  return {
    category: 'Restaurants',
    totalRecords: total,
    publishedRecords: published,
    completenessScore: Math.round(avgCompleteness),
    criticalIssues,
    warnings,
    recommendations,
    fieldStats
  };
}

async function auditHotels(): Promise<QualityScore> {
  console.log('\nðŸ¨ AUDITING HOTELS...\n');

  const { data: hotels, error } = await supabase
    .from('hotels')
    .select(`
      name, slug, description, hero_image, google_place_id,
      address, latitude, longitude, phone, website,
      star_rating, google_rating, meta_title, meta_description,
      check_in_time, check_out_time, active, id
    `);

  if (error) throw error;

  const criticalIssues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  const total = hotels?.length || 0;
  const published = hotels?.filter(h => h.active === true).length || 0;

  const criticalFields = [
    'name', 'slug', 'description', 'hero_image',
    'google_place_id', 'address', 'latitude', 'longitude'
  ];

  const importantFields = [
    'phone', 'website', 'star_rating', 'google_rating',
    'meta_title', 'meta_description', 'check_in_time', 'check_out_time'
  ];

  const allFields = [...criticalFields, ...importantFields];
  const fieldStats = calculateFieldStats(hotels || [], allFields);

  criticalFields.forEach(field => {
    if (fieldStats[field].percentage < 90) {
      criticalIssues.push(`${field}: Only ${fieldStats[field].percentage}% populated (${fieldStats[field].populated}/${total})`);
    }
  });

  importantFields.forEach(field => {
    if (fieldStats[field].percentage < 70) {
      warnings.push(`${field}: Only ${fieldStats[field].percentage}% populated (${fieldStats[field].populated}/${total})`);
    }
  });

  // Get amenities stats
  const { data: amenities } = await supabase
    .from('hotel_amenities')
    .select('hotel_id');

  const hotelsWithAmenities = new Set(amenities?.map(a => a.hotel_id) || []);
  const amenitiesPercentage = Math.round((hotelsWithAmenities.size / total) * 100);

  if (amenitiesPercentage < 80) {
    warnings.push(`Only ${amenitiesPercentage}% of hotels have amenities (${hotelsWithAmenities.size}/${total})`);
  }

  const avgCompleteness = Object.values(fieldStats).reduce((sum, stat) => sum + stat.percentage, 0) / allFields.length;

  return {
    category: 'Hotels',
    totalRecords: total,
    publishedRecords: published,
    completenessScore: Math.round(avgCompleteness),
    criticalIssues,
    warnings,
    recommendations,
    fieldStats
  };
}

async function auditMalls(): Promise<QualityScore> {
  console.log('\nðŸ›ï¸  AUDITING MALLS...\n');

  const { data: malls, error } = await supabase
    .from('malls')
    .select(`
      name, slug, description, hero_image,
      address, latitude, longitude, phone, website,
      google_rating, google_review_count,
      weekday_open_time, weekday_close_time,
      meta_title, meta_description, total_stores, active, id
    `);

  if (error) throw error;

  const criticalIssues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  const total = malls?.length || 0;
  const published = malls?.filter(m => m.active).length || 0;

  const criticalFields = [
    'name', 'slug', 'description', 'hero_image',
    'address', 'latitude', 'longitude'
  ];

  const importantFields = [
    'phone', 'website', 'google_rating', 'google_review_count',
    'weekday_open_time', 'meta_title', 'meta_description', 'total_stores'
  ];

  const allFields = [...criticalFields, ...importantFields];
  const fieldStats = calculateFieldStats(malls || [], allFields);

  criticalFields.forEach(field => {
    if (fieldStats[field].percentage < 90) {
      criticalIssues.push(`${field}: Only ${fieldStats[field].percentage}% populated (${fieldStats[field].populated}/${total})`);
    }
  });

  importantFields.forEach(field => {
    if (fieldStats[field].percentage < 70) {
      warnings.push(`${field}: Only ${fieldStats[field].percentage}% populated (${fieldStats[field].populated}/${total})`);
    }
  });

  // Get images stats
  const { data: images } = await supabase
    .from('mall_images')
    .select('mall_id');

  const mallsWithImages = new Set(images?.map(i => i.mall_id) || []);
  const imagePercentage = Math.round((mallsWithImages.size / total) * 100);

  if (imagePercentage < 80) {
    warnings.push(`Only ${imagePercentage}% of malls have images (${mallsWithImages.size}/${total})`);
  }

  const avgCompleteness = Object.values(fieldStats).reduce((sum, stat) => sum + stat.percentage, 0) / allFields.length;

  return {
    category: 'Malls',
    totalRecords: total,
    publishedRecords: published,
    completenessScore: Math.round(avgCompleteness),
    criticalIssues,
    warnings,
    recommendations,
    fieldStats
  };
}

async function auditAttractions(): Promise<QualityScore> {
  console.log('\nðŸŽ­ AUDITING ATTRACTIONS...\n');

  const { data: attractions, error } = await supabase
    .from('attractions')
    .select(`
      name, slug, description, hero_image,
      address, latitude, longitude, attraction_type, phone, website,
      google_rating, google_review_count, opening_hours,
      meta_title, meta_description, admission_fee, typical_visit_duration,
      active, id
    `);

  if (error) throw error;

  const criticalIssues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  const total = attractions?.length || 0;
  const published = attractions?.filter(a => a.active).length || 0;

  const criticalFields = [
    'name', 'slug', 'description', 'hero_image',
    'address', 'latitude', 'longitude', 'attraction_type'
  ];

  const importantFields = [
    'phone', 'website', 'google_rating', 'google_review_count',
    'opening_hours', 'meta_title', 'meta_description',
    'admission_fee', 'typical_visit_duration'
  ];

  const allFields = [...criticalFields, ...importantFields];
  const fieldStats = calculateFieldStats(attractions || [], allFields);

  criticalFields.forEach(field => {
    if (fieldStats[field].percentage < 90) {
      criticalIssues.push(`${field}: Only ${fieldStats[field].percentage}% populated (${fieldStats[field].populated}/${total})`);
    }
  });

  importantFields.forEach(field => {
    if (fieldStats[field].percentage < 70) {
      warnings.push(`${field}: Only ${fieldStats[field].percentage}% populated (${fieldStats[field].populated}/${total})`);
    }
  });

  // Get images stats
  const { data: images } = await supabase
    .from('attraction_images')
    .select('attraction_id');

  const attractionsWithImages = new Set(images?.map(i => i.attraction_id) || []);
  const imagePercentage = Math.round((attractionsWithImages.size / total) * 100);

  if (imagePercentage < 80) {
    warnings.push(`Only ${imagePercentage}% of attractions have images (${attractionsWithImages.size}/${total})`);
  }

  const avgCompleteness = Object.values(fieldStats).reduce((sum, stat) => sum + stat.percentage, 0) / allFields.length;

  return {
    category: 'Attractions',
    totalRecords: total,
    publishedRecords: published,
    completenessScore: Math.round(avgCompleteness),
    criticalIssues,
    warnings,
    recommendations,
    fieldStats
  };
}

async function auditSchools(): Promise<QualityScore> {
  console.log('\nðŸŽ“ AUDITING SCHOOLS...\n');

  const { data: schools, error } = await supabase
    .from('schools')
    .select(`
      name, slug, description, hero_image,
      address, latitude, longitude, curriculum,
      phone, website, email, google_rating,
      governorate, area, meta_title, meta_description,
      grade_levels, accreditations, year_established,
      active, id
    `);

  if (error) throw error;

  const criticalIssues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  const total = schools?.length || 0;
  const published = schools?.filter(s => s.active).length || 0;

  const criticalFields = [
    'name', 'slug', 'description', 'hero_image',
    'address', 'latitude', 'longitude', 'curriculum'
  ];

  const importantFields = [
    'phone', 'website', 'email', 'google_rating',
    'governorate', 'area', 'meta_title', 'meta_description',
    'grade_levels', 'accreditations', 'year_established'
  ];

  const allFields = [...criticalFields, ...importantFields];
  const fieldStats = calculateFieldStats(schools || [], allFields);

  criticalFields.forEach(field => {
    if (fieldStats[field].percentage < 90) {
      criticalIssues.push(`${field}: Only ${fieldStats[field].percentage}% populated (${fieldStats[field].populated}/${total})`);
    }
  });

  importantFields.forEach(field => {
    if (fieldStats[field].percentage < 50) {
      warnings.push(`${field}: Only ${fieldStats[field].percentage}% populated (${fieldStats[field].populated}/${total})`);
    }
  });

  // Get images stats
  const { data: images } = await supabase
    .from('school_images')
    .select('school_id');

  const schoolsWithImages = new Set(images?.map(i => i.school_id) || []);
  const imagePercentage = Math.round((schoolsWithImages.size / total) * 100);

  if (imagePercentage < 80) {
    warnings.push(`Only ${imagePercentage}% of schools have images (${schoolsWithImages.size}/${total})`);
  }

  const avgCompleteness = Object.values(fieldStats).reduce((sum, stat) => sum + stat.percentage, 0) / allFields.length;

  return {
    category: 'Schools',
    totalRecords: total,
    publishedRecords: published,
    completenessScore: Math.round(avgCompleteness),
    criticalIssues,
    warnings,
    recommendations,
    fieldStats
  };
}

async function auditFitness(): Promise<QualityScore> {
  console.log('\nðŸ’ª AUDITING FITNESS CENTERS...\n');

  const { data: fitness, error } = await supabase
    .from('fitness_places')
    .select(`
      name, slug, description, hero_image,
      address, latitude, longitude, gender_policy,
      phone, website, google_rating, google_review_count,
      opening_hours, meta_title, meta_description,
      fitness_types, amenities, active, id
    `);

  if (error) throw error;

  const criticalIssues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  const total = fitness?.length || 0;
  const published = fitness?.filter(f => f.active).length || 0;

  const criticalFields = [
    'name', 'slug', 'description', 'hero_image',
    'address', 'latitude', 'longitude', 'gender_policy'
  ];

  const importantFields = [
    'phone', 'website', 'google_rating', 'google_review_count',
    'opening_hours', 'meta_title', 'meta_description',
    'fitness_types', 'amenities'
  ];

  const allFields = [...criticalFields, ...importantFields];
  const fieldStats = calculateFieldStats(fitness || [], allFields);

  criticalFields.forEach(field => {
    if (fieldStats[field].percentage < 90) {
      criticalIssues.push(`${field}: Only ${fieldStats[field].percentage}% populated (${fieldStats[field].populated}/${total})`);
    }
  });

  importantFields.forEach(field => {
    if (fieldStats[field].percentage < 70) {
      warnings.push(`${field}: Only ${fieldStats[field].percentage}% populated (${fieldStats[field].populated}/${total})`);
    }
  });

  const avgCompleteness = Object.values(fieldStats).reduce((sum, stat) => sum + stat.percentage, 0) / allFields.length;

  return {
    category: 'Fitness',
    totalRecords: total,
    publishedRecords: published,
    completenessScore: Math.round(avgCompleteness),
    criticalIssues,
    warnings,
    recommendations,
    fieldStats
  };
}

function printReport(score: QualityScore) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${score.category.toUpperCase()} QUALITY REPORT`);
  console.log(`${'='.repeat(80)}\n`);

  console.log(`ðŸ“Š OVERVIEW:`);
  console.log(`   Total Records: ${score.totalRecords}`);
  console.log(`   Published/Active: ${score.publishedRecords} (${Math.round((score.publishedRecords / score.totalRecords) * 100)}%)`);
  console.log(`   Overall Completeness: ${score.completenessScore}%\n`);

  if (score.criticalIssues.length > 0) {
    console.log(`âŒ CRITICAL ISSUES (${score.criticalIssues.length}):`);
    score.criticalIssues.forEach(issue => console.log(`   - ${issue}`));
    console.log();
  }

  if (score.warnings.length > 0) {
    console.log(`âš ï¸  WARNINGS (${score.warnings.length}):`);
    score.warnings.forEach(warning => console.log(`   - ${warning}`));
    console.log();
  }

  if (score.recommendations.length > 0) {
    console.log(`ðŸ’¡ RECOMMENDATIONS (${score.recommendations.length}):`);
    score.recommendations.forEach(rec => console.log(`   - ${rec}`));
    console.log();
  }

  console.log(`ðŸ“ˆ FIELD COMPLETENESS:`);
  const sortedFields = Object.entries(score.fieldStats)
    .sort((a, b) => a[1].percentage - b[1].percentage);

  sortedFields.forEach(([field, stats]) => {
    const emoji = stats.percentage >= 90 ? 'âœ…' : stats.percentage >= 70 ? 'âš ï¸' : 'âŒ';
    console.log(`   ${emoji} ${field}: ${stats.percentage}% (${stats.populated}/${score.totalRecords})`);
  });
}

async function generateExecutiveSummary(scores: QualityScore[]) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`EXECUTIVE SUMMARY - BEST OF GOA CONTENT QUALITY AUDIT`);
  console.log(`${'='.repeat(80)}\n`);

  const totalRecords = scores.reduce((sum, s) => sum + s.totalRecords, 0);
  const totalPublished = scores.reduce((sum, s) => sum + s.publishedRecords, 0);
  const avgCompleteness = Math.round(scores.reduce((sum, s) => sum + s.completenessScore, 0) / scores.length);
  const totalCritical = scores.reduce((sum, s) => sum + s.criticalIssues.length, 0);
  const totalWarnings = scores.reduce((sum, s) => sum + s.warnings.length, 0);

  console.log(`ðŸ“Š PLATFORM OVERVIEW:`);
  console.log(`   Total Content Items: ${totalRecords}`);
  console.log(`   Published/Active: ${totalPublished} (${Math.round((totalPublished / totalRecords) * 100)}%)`);
  console.log(`   Average Completeness: ${avgCompleteness}%`);
  console.log(`   Critical Issues: ${totalCritical}`);
  console.log(`   Warnings: ${totalWarnings}\n`);

  console.log(`ðŸ“‚ CATEGORY BREAKDOWN:\n`);
  scores.forEach(score => {
    const statusEmoji = score.completenessScore >= 90 ? 'ðŸŸ¢' : score.completenessScore >= 70 ? 'ðŸŸ¡' : 'ðŸ”´';
    console.log(`   ${statusEmoji} ${score.category}:`);
    console.log(`      Records: ${score.totalRecords} | Published: ${score.publishedRecords} | Completeness: ${score.completenessScore}%`);
    console.log(`      Issues: ${score.criticalIssues.length} critical, ${score.warnings.length} warnings\n`);
  });

  // Priority recommendations
  console.log(`\nðŸŽ¯ TOP PRIORITY ACTIONS:\n`);

  const criticalCategories = scores.filter(s => s.completenessScore < 70);
  if (criticalCategories.length > 0) {
    console.log(`   1. Address data completeness in: ${criticalCategories.map(c => c.category).join(', ')}`);
  }

  const unpublished = scores.filter(s => (s.publishedRecords / s.totalRecords) < 0.5);
  if (unpublished.length > 0) {
    console.log(`   2. Increase publication rate for: ${unpublished.map(c => c.category).join(', ')}`);
  }

  console.log(`   3. Review and resolve ${totalCritical} critical field population issues`);
  console.log(`   4. Enhance SEO metadata (meta_title, meta_description) across all categories`);
  console.log(`   5. Ensure all published items have high-quality hero images\n`);
}

async function main() {
  console.log('ðŸ” BOK CONTENT TESTER - COMPREHENSIVE QUALITY AUDIT\n');
  console.log('Starting content quality analysis across all categories...\n');

  try {
    const scores: QualityScore[] = [];

    // Audit each category
    const restaurantScore = await auditRestaurants();
    printReport(restaurantScore);
    scores.push(restaurantScore);

    const hotelScore = await auditHotels();
    printReport(hotelScore);
    scores.push(hotelScore);

    const mallScore = await auditMalls();
    printReport(mallScore);
    scores.push(mallScore);

    const attractionScore = await auditAttractions();
    printReport(attractionScore);
    scores.push(attractionScore);

    const schoolScore = await auditSchools();
    printReport(schoolScore);
    scores.push(schoolScore);

    const fitnessScore = await auditFitness();
    printReport(fitnessScore);
    scores.push(fitnessScore);

    // Generate executive summary
    await generateExecutiveSummary(scores);

    console.log(`\nâœ… Audit complete! Review the reports above for detailed findings.\n`);

  } catch (error) {
    console.error('âŒ Error during audit:', error);
    process.exit(1);
  }
}

main();

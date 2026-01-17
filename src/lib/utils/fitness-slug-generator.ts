/**
 * Fitness Slug Generator
 * 
 * Generates SEO-friendly slugs for fitness centers using name and area
 * with smart duplicate detection (Option 3: Hybrid Approach)
 * 
 * Format: {name}-{area}
 * Example: gorillas-gym-salmiya, f45-training-bnied-al-gar
 * 
 * Features:
 * - Simple name + area combination
 * - Smart duplicate detection (if location already in name, don't add)
 * - Handles edge cases like "F45 Training Goa City"
 * - Automatic uniqueness checking
 * 
 * @see docs/SLUG_GENERATION.md for restaurant slug patterns
 */

/**
 * Clean area name for slug generation
 * 
 * @param area - Raw area name from database
 * @returns Cleaned area name for slug
 */
export function cleanAreaForSlug(area: string): string {
  if (!area) return 'goa';
  
  let cleanArea = area.toLowerCase().trim();
  
  // Filter out numeric-only strings (postal codes)
  const isNumeric = /^\d+$/.test(cleanArea.replace(/\s+/g, ''));
  if (isNumeric && cleanArea.length >= 4 && cleanArea.length <= 6) {
    return 'goa';
  }
  
  // Filter out street names with numbers
  const streetPatternAfter = /\b(street|st|road|rd|avenue|ave|boulevard|blvd|drive|dr|lane|ln)\s*\d+/i;
  const streetPatternBefore = /\d+\s+.*\b(street|st|road|rd|avenue|ave|boulevard|blvd|drive|dr|lane|ln)\b/i;
  if (streetPatternAfter.test(cleanArea) || streetPatternBefore.test(cleanArea)) {
    return 'goa';
  }
  
  // Goa-specific area mappings for better slug generation
  const areaMappings: Record<string, string> = {
    'goa city': 'goa-city',
    'goa-city': 'goa-city',
    'bnied al-gar': 'bnied-al-gar',
    'bnied al gar': 'bnied-al-gar',
    'bneid al gar': 'bnied-al-gar',
    'mubarak al-kabeer': 'mubarak-al-kabeer',
    'mubarak al kabeer': 'mubarak-al-kabeer',
    'al-ahmadi': 'ahmadi',
    'al ahmadi': 'ahmadi',
    'al-jahra': 'jahra',
    'al jahra': 'jahra',
    'al farwaniyah': 'farwaniya',
    'al-farwaniyah': 'farwaniya',
    'al farwaniya': 'farwaniya',
    'al-farwaniya': 'farwaniya'
  };
  
  // Apply area mappings
  if (areaMappings[cleanArea]) {
    cleanArea = areaMappings[cleanArea];
  }
  
  // Remove common articles (the, a, an) for cleaner slugs
  cleanArea = cleanArea.replace(/^(the|a|an)\s+/i, '');
  
  return cleanArea
    .replace(/[^a-z0-9\s-]/g, '')  // Remove special characters
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '')       // Remove leading/trailing hyphens
    .trim() || 'goa';
}

/**
 * Normalize location word for duplicate detection
 * Handles spelling variations and common patterns
 */
function normalizeLocationWord(word: string): string {
  const lowerWord = word.toLowerCase();
  
  // Map common spelling variations to canonical form
  const variations: Record<string, string> = {
    'salmiyah': 'salmiya',
    'salmiya': 'salmiya',
    'goacity': 'goa-city',
    'goa-city': 'goa-city',
    'mahboulah': 'mahboula',
    'mahboula': 'mahboula',
    'jabriyah': 'jabriya',
    'jabriya': 'jabriya',
    'hawalli': 'hawally',
    'hawally': 'hawally',
    'farwaniyah': 'farwaniya',
    'farwaniya': 'farwaniya',
    'al-farwaniyah': 'farwaniya',
    'al-farwaniya': 'farwaniya'
  };
  
  return variations[lowerWord] || lowerWord;
}

/**
 * Check if location is already present in the name slug
 * Uses smart pattern matching to detect duplicates
 */
function isLocationInName(nameSlug: string, locationSlug: string): boolean {
  if (!locationSlug || locationSlug === 'goa') {
    return false;
  }
  
  // Normalize both slugs for comparison
  const normalizedNameSlug = nameSlug
    .split('-')
    .map(word => normalizeLocationWord(word))
    .join('-');
    
  const normalizedLocationSlug = locationSlug
    .split('-')
    .map(word => normalizeLocationWord(word))
    .join('-');
  
  const locationWords = normalizedLocationSlug.split('-');
  
  // Check for consecutive match of all location words in name
  const nameWords = normalizedNameSlug.split('-');
  
  for (let i = 0; i <= nameWords.length - locationWords.length; i++) {
    const nameSlice = nameWords.slice(i, i + locationWords.length).join('-');
    if (nameSlice === normalizedLocationSlug) {
      return true;
    }
  }
  
  // Check for pattern matches
  const locationPatterns = [
    `-${normalizedLocationSlug}-`,   // Middle: "gym-salmiya-fitness"
    `-${normalizedLocationSlug}$`,    // End: "gym-salmiya"
    `^${normalizedLocationSlug}-`,    // Start: "salmiya-gym"
    `^${normalizedLocationSlug}$`     // Exact match: "salmiya"
  ];
  
  return locationPatterns.some(pattern => {
    const regex = new RegExp(pattern);
    return regex.test(normalizedNameSlug);
  });
}

/**
 * Generate fitness slug using name and area
 * 
 * @param name - Fitness place name
 * @param area - Area from database
 * @returns Clean slug with format: {name}-{area}
 * 
 * Examples:
 * - generateFitnessSlugWithArea("Gorillas Gym Goa", "Salmiya") â†’ "gorillas-gym-goa-salmiya"
 * - generateFitnessSlugWithArea("F45 Training Goa City", "Bnied Al-Gar") â†’ "f45-training-goa-city-bnied-al-gar"
 * - generateFitnessSlugWithArea("Salmiya Fitness Center", "Salmiya") â†’ "salmiya-fitness-center" (no duplicate)
 * - generateFitnessSlugWithArea("The Hook Boxing Gym", "Jibla") â†’ "hook-boxing-gym-jibla"
 */
export function generateFitnessSlugWithArea(name: string, area: string): string {
  // Generate base slug from fitness place name
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')  // Remove special characters
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '')       // Remove leading/trailing hyphens
    .trim();
  
  // Clean and normalize area
  const location = cleanAreaForSlug(area);
  
  // Skip generic "goa" location
  if (!location || location === 'goa') {
    return baseSlug;
  }
  
  // Check if location is already in the name (smart duplicate detection)
  if (isLocationInName(baseSlug, location)) {
    console.log(`[FitnessSlugGenerator] Location "${location}" already in name "${name}", not duplicating`);
    return baseSlug;
  }
  
  // Location not in name, add it
  const combined = `${baseSlug}-${location}`;
  return combined.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * Test cases for fitness slug generation
 */
export const fitnessSlugTestCases = [
  {
    name: "Gorillas Gym Goa",
    area: "Salmiya",
    expected: "gorillas-gym-goa-salmiya"
  },
  {
    name: "F45 Training Goa City",
    area: "Bnied Al-Gar",
    expected: "f45-training-goa-city-bnied-al-gar"
  },
  {
    name: "Salmiya Fitness Center",
    area: "Salmiya",
    expected: "salmiya-fitness-center" // Location already in name
  },
  {
    name: "The Hook Boxing Gym",
    area: "Jibla",
    expected: "hook-boxing-gym-jibla"
  },
  {
    name: "Titanium Shark Gym",
    area: "Mahboula",
    expected: "titanium-shark-gym-mahboula"
  },
  {
    name: "CrossFit Goa",
    area: "Goa City",
    expected: "crossfit-goa-goa-city" // "Goa" is part of name, but "Goa City" is specific area
  }
];


/**
 * Restaurant Slug Generator
 * 
 * Generates SEO-friendly slugs for restaurants using name and location
 * from address data. Extracts meaningful location identifiers to create
 * unique slugs for different outlets of the same restaurant chain.
 * 
 * Features:
 * - Simplified format: restaurant-name + area/neighborhood
 * - Duplicate location detection (prevents redundant location in slug)
 * - Spelling variation normalization (Morouj/Murouj/Mrouj)
 * - Mall name detection (The Warehouse Mall, The Avenues)
 * - Multi-word location matching
 * - Neighborhood prioritization over area field
 * 
 * @see docs/SLUG_GENERATION.md for complete documentation
 */

/**
 * Extract location identifier from address for slug generation
 * 
 * Examples:
 * - "Ground Floor, Grand Avenue - The Avenues, Al Rai, Goa" â†’ "avenues"
 * - "Salmiya, Block 12, Salmiya, Goa" â†’ "salmiya"
 * - "Jabriya Land II, Street 105, Jabriya, Goa" â†’ "jabriya"
 * - "The Avenues Mall, Ground Floor, Goa" â†’ "avenues"
 */
export function extractLocationForSlug(address: string): string {
  if (!address) return 'goa';

  // Remove "Goa", "India" from the end
  const cleanAddress = address.replace(/,\s*(Goa|India)\s*$/ig, '').replace(/,\s*India\s*$/i, '').trim();

  // Split by common separators and clean up
  const parts = cleanAddress
    .split(/[,\-â€“â€”]/)
    .map(part => part.trim())
    .filter(part => part.length > 0);

  if (parts.length === 0) return 'goa';

  // Look for meaningful location identifiers (Areas, Beaches, Cities)
  const locationKeywords = [
    // North Goa
    'panjim', 'panaji', 'candolim', 'calangute', 'baga', 'anjuna', 'vagator',
    'siolim', 'morjim', 'ashwem', 'mandrem', 'arambol', 'mapusa', 'porvorim',
    'old goa', 'miramar', 'dona paula', 'nerul', 'sinquerim', 'saligao', 'assagao',
    // South Goa
    'margao', 'madgaon', 'vasco', 'vasco da gama', 'colva', 'benaulim', 'varca',
    'cavelossim', 'mobor', 'agonda', 'palolem', 'patnem', 'majorda', 'utorda',
    'bogmalo', 'canacona', 'quepem', 'ponda'
  ];

  // Hotel names/brands common in Goa
  const hotelKeywords = [
    'taj', 'marriott', 'hilton', 'hyatt', 'radisson', 'novotel',
    'le meridien', 'westin', 'w goa', 'st regis', 'alila', 'itc',
    'fortune', 'ginger', 'lemon tree', 'resort', 'rio', 'cidade',
    'holiday inn', 'doubletree', 'ibis', 'mercure', 'fairfield',
    'grand hyatt', 'zuri', 'lalit', 'kenilworth', 'caravela',
    'hotel', 'resort', 'retreat', 'villa', 'shack', 'cottage'
  ];

  // Find the most relevant location part
  // First pass: Look for specific areas (highest priority for Goa as resorts are often named after location)
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].toLowerCase();

    // Check known locations
    for (const keyword of locationKeywords) {
      if (part.includes(keyword)) {
        // Return canonical slug for duplicates
        if (keyword === 'panaji') return 'panjim';
        if (keyword === 'madgaon') return 'margao';
        if (keyword === 'vasco da gama') return 'vasco';
        return keyword.replace(/\s+/g, '-');
      }
    }

    // Check for hotel names
    for (const hotelKeyword of hotelKeywords) {
      if (part.includes(hotelKeyword)) {
        // ... (Hotel extraction logic could be similar, but for Goa location is usually key)
        // For now, if we find a hotel keyword, we might still prefer the area if found later.
        // But if this part IS the hotel name, we might extract it.
        // Simplified: return hotel name if it's a major chain
        if (['taj', 'marriott', 'hyatt', 'w goa', 'st regis'].includes(hotelKeyword)) {
          return hotelKeyword.replace(/\s+/g, '-');
        }
      }
    }
  }

  // Fallback: use the last meaningful part
  const lastPart = parts[parts.length - 1].toLowerCase();

  // Filter out postal codes (6 digits in India)
  if (/^\d{6}$/.test(lastPart)) {
    if (parts.length >= 2) return cleanAreaForSlug(parts[parts.length - 2]);
    return 'goa';
  }

  return cleanAreaForSlug(lastPart) || 'goa';
}

/**
 * Generate slug from restaurant name and location
 * 
 * @param name - Restaurant name
 * @param location - Location identifier (from extractLocationForSlug)
 * @returns Clean, SEO-friendly slug
 * 
 * Examples:
 * - generateSlug("The Cheesecake Factory", "avenues") â†’ "the-cheesecake-factory-avenues"
 * - generateSlug("McDonald's", "salmiya") â†’ "mcdonalds-salmiya"
 * - generateSlug("Starbucks", "goa-city") â†’ "starbucks-goa-city"
 */
export function generateSlug(name: string, location?: string): string {
  // Clean restaurant name
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')  // Replace multiple dashes with single
    .replace(/^-+|-+$/g, '')  // Remove leading/trailing dashes
    .trim();

  // Add location to make slug unique for different outlets
  if (location && location !== 'goa') {
    const locationSlug = location
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')  // Replace multiple dashes with single
      .replace(/^-+|-+$/g, '')  // Remove leading/trailing dashes
      .trim();

    // Combine and ensure no double dashes
    const combined = `${baseSlug}-${locationSlug}`;
    baseSlug = combined.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  }

  return baseSlug;
}

/**
 * Generate complete slug from restaurant name and address
 * 
 * @param name - Restaurant name
 * @param address - Full address string
 * @returns Complete slug with location
 * 
 * Examples:
 * - generateRestaurantSlug("The Cheesecake Factory", "Ground Floor, Grand Avenue - The Avenues, Al Rai, Goa")
 *   â†’ "the-cheesecake-factory-avenues"
 * - generateRestaurantSlug("McDonald's", "Salmiya, Block 12, Salmiya, Goa")
 *   â†’ "mcdonalds-salmiya"
 */
export function generateRestaurantSlug(name: string, address: string): string {
  const location = extractLocationForSlug(address);
  return generateSlug(name, location);
}

/**
 * Generate restaurant slug using area/neighborhood ONLY
 * Simple format: restaurant-name-area
 * 
 * @param name - Restaurant name
 * @param area - Area/neighborhood from database
 * @param address - Full address (fallback only if area is generic)
 * @param neighborhoodName - Optional neighborhood name from relationship (preferred)
 * @returns Clean, short slug
 * 
 * Examples:
 * - generateRestaurantSlugWithArea("Bazaar gurme", "Salwa") â†’ "bazaar-gurme-salwa"
 * - generateRestaurantSlugWithArea("November & Co", "Rai") â†’ "november-co-rai"
 * - generateRestaurantSlugWithArea("The Cheesecake Factory", "Rai", "...", "The Avenues") â†’ "the-cheesecake-factory-avenues"
 */
export function generateRestaurantSlugWithArea(
  name: string,
  area: string,
  address?: string,
  neighborhoodName?: string,
  neighborhoodSlug?: string
): string {
  // Prefer neighborhood slug if available (most specific and already formatted)
  // Otherwise use neighborhood name, then fall back to area
  let location: string | null = null;

  if (neighborhoodSlug) {
    // Use neighborhood slug directly (already formatted correctly)
    location = neighborhoodSlug;
  } else if (neighborhoodName) {
    // Fallback: clean neighborhood name
    location = cleanAreaForSlug(neighborhoodName);
  }
  // Use area if it's more specific than generic 'Goa'
  // Note: "Panjim" is valid and should be used
  else if (area && area.toLowerCase() !== 'goa') {
    location = cleanAreaForSlug(area);
  }
  // Fallback to simple area extraction from address (only if no area provided)
  else if (address) {
    location = extractSimpleArea(address);
  }

  // Generate base slug from restaurant name
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')  // Replace multiple dashes with single
    .replace(/^-+|-+$/g, '')  // Remove leading/trailing dashes
    .trim();

  // Check if location is already in the restaurant name slug
  if (location && location !== 'goa') {
    const locationSlug = location
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')  // Replace multiple dashes with single
      .replace(/^-+|-+$/g, '')  // Remove leading/trailing dashes
      .trim();

    // Normalize common spelling variations for comparison
    // Handles location names, mall names, and spelling variations
    const normalizeLocationWord = (word: string): string => {
      const lowerWord = word.toLowerCase();

      // Map common spelling variations to canonical form
      const variations: Record<string, string> = {
        // Location spelling variations
        'morouj': 'murouj',
        'mrouj': 'murouj',
        'murouj': 'murouj',
        // Mall name variations (normalize to slug without "the")
        'warehouse': 'warehouse-mall',
        'the-warehouse': 'warehouse-mall',
        'the-warehouse-mall': 'warehouse-mall',
        'warehouse-mall': 'warehouse-mall',
        // Common mall variations
        'the-avenues': 'avenues',
        'avenues': 'avenues',
        'avenue': 'avenues',
        'marina-mall': 'marina-mall',
        'the-marina-mall': 'marina-mall',
      };

      return variations[lowerWord] || lowerWord;
    };

    // Normalize location slug (may be multi-word like "warehouse-mall")
    const normalizedLocationSlug = normalizeLocationWord(locationSlug);
    const locationWords = normalizedLocationSlug.split('-');

    // Split base slug into segments
    const baseSlugSegments = baseSlug.split('-');

    // Normalize each segment, but also handle multi-word patterns
    // For example: "the-avenues" should normalize to "avenues" as a combined unit
    const normalizeBaseSlug = (segments: string[]): string[] => {
      const normalized: string[] = [];
      let i = 0;

      while (i < segments.length) {
        // Check if current segment + next segment(s) form a known location
        let matched = false;

        // Try matching 2-word combinations first (like "the-avenues")
        if (i + 1 < segments.length) {
          const twoWord = `${segments[i]}-${segments[i + 1]}`;
          const normalizedTwoWord = normalizeLocationWord(twoWord);
          if (normalizedTwoWord !== twoWord.toLowerCase()) {
            // It was normalized, so it's a known location
            normalized.push(...normalizedTwoWord.split('-'));
            i += 2;
            matched = true;
          }
        }

        // Try matching 3-word combinations (like "the-warehouse-mall")
        if (!matched && i + 2 < segments.length) {
          const threeWord = `${segments[i]}-${segments[i + 1]}-${segments[i + 2]}`;
          const normalizedThreeWord = normalizeLocationWord(threeWord);
          if (normalizedThreeWord !== threeWord.toLowerCase()) {
            normalized.push(...normalizedThreeWord.split('-'));
            i += 3;
            matched = true;
          }
        }

        // Single word
        if (!matched) {
          normalized.push(normalizeLocationWord(segments[i]));
          i++;
        }
      }

      return normalized;
    };

    const normalizedBaseSlugSegments = normalizeBaseSlug(baseSlugSegments);
    const normalizedBaseSlug = normalizedBaseSlugSegments.join('-');

    // Enhanced duplicate detection: Check for multi-word location matches
    // This handles cases like "the-grove-the-warehouse-mall" vs location "warehouse-mall"

    // 1. Check if all location words appear consecutively in base slug
    const findLocationWordsInSlug = () => {
      if (locationWords.length === 0) return false;

      // Try to find consecutive match of all location words
      for (let i = 0; i <= normalizedBaseSlugSegments.length - locationWords.length; i++) {
        const segmentSlice = normalizedBaseSlugSegments.slice(i, i + locationWords.length);
        const normalizedSlice = segmentSlice.join('-');

        // Check if this slice matches the normalized location
        if (normalizedSlice === normalizedLocationSlug) {
          return true;
        }

        // Also check if all words match individually (in order)
        const allMatch = locationWords.every((locWord, idx) =>
          segmentSlice[idx] === normalizeLocationWord(locWord)
        );
        if (allMatch) {
          return true;
        }
      }
      return false;
    };

    // 2. Check for full pattern match (existing logic)
    const locationPatterns = [
      `-${normalizedLocationSlug}-`,   // Middle: "apiza-restaurant-murouj-something"
      `-${normalizedLocationSlug}$`,    // End: "ubon-murouj" or "the-grove-the-warehouse-mall"
      `^${normalizedLocationSlug}-`,    // Start: "murouj-restaurant"
      `^${normalizedLocationSlug}$`     // Exact match: "murouj"
    ];

    const patternMatch = locationPatterns.some(pattern => {
      const regex = new RegExp(pattern);
      return regex.test(normalizedBaseSlug);
    });

    // 3. Check for partial matches where location words appear in sequence
    const consecutiveMatch = findLocationWordsInSlug();

    const locationAlreadyInSlug = patternMatch || consecutiveMatch;

    if (locationAlreadyInSlug) {
      // Location already in name, don't duplicate
      // Clean up any trailing dashes
      return baseSlug.replace(/-+$/, '').replace(/^-+/, '');
    }

    // Location not in name, add it
    // Ensure no double dashes when combining
    const combined = `${baseSlug}-${locationSlug}`;
    return combined.replace(/-+/g, '-').replace(/^-+|-+$/g, '');  // Clean any double dashes and trim
  }

  // No location or location is 'goa', return base slug (clean up dashes)
  return baseSlug.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * Extract simple area name from address
 * Just gets the area/neighborhood, not street/floor details
 * 
 * @param address - Full address string
 * @returns Simple area name
 */
function extractSimpleArea(address: string): string {
  if (!address) return 'goa';

  // Remove "Goa" from end
  const cleanAddress = address.replace(/,\s*(Goa|India)\s*$/i, '').trim();

  // Split by comma and get the area (usually second-to-last part)
  const parts = cleanAddress.split(',').map(p => p.trim()).filter(p => p.length > 0);

  // Try to find a meaningful area name (not postal codes, not street names with numbers)
  // Check parts from right to left (before "Goa"), skipping postal codes and street references
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];

    // Skip postal codes (numeric-only, 6 digits)
    if (/^\d{6}$/.test(part)) {
      continue;
    }

    // Skip street names with numbers
    const streetPatternAfter = /\b(street|st|road|rd|avenue|ave|boulevard|blvd|drive|dr|lane|ln)\s*\d+/i;
    const streetPatternBefore = /\d+\s+.*\b(street|st|road|rd|avenue|ave|boulevard|blvd|drive|dr|lane|ln)\b/i;
    if (streetPatternAfter.test(part) || streetPatternBefore.test(part)) {
      continue;
    }

    // This looks like an area name - try it
    const cleaned = cleanAreaForSlug(part);
    if (cleaned && cleaned !== 'goa') {
      return cleaned;
    }
  }

  // If all parts were filtered out, check second-to-last (traditional fallback)
  if (parts.length >= 2) {
    const cleaned = cleanAreaForSlug(parts[parts.length - 2]);
    if (cleaned && cleaned !== 'goa') {
      return cleaned;
    }
  }

  // Final fallback: use first part if available
  if (parts.length > 0) {
    const cleaned = cleanAreaForSlug(parts[0]);
    if (cleaned && cleaned !== 'goa') {
      return cleaned;
    }
  }

  return 'goa';
}

/**
 * Clean area name for slug generation
 * 
 * @param area - Raw area name from database
 * @returns Cleaned area name for slug
 */
export function cleanAreaForSlug(area: string): string {
  if (!area) return 'goa';

  let cleanArea = area.toLowerCase().trim();

  // FILTER OUT POSTAL CODES AND NUMERIC-ONLY STRINGS
  const isNumeric = /^\d+$/.test(cleanArea.replace(/\s+/g, ''));
  const isPostalCode = isNumeric && cleanArea.length >= 6; // India PIN codes are 6 digits

  if (isPostalCode) {
    return 'goa';
  }

  // Goa-specific area mappings
  const areaMappings: Record<string, string> = {
    'panaji': 'panjim',
    'panjim': 'panjim',
    'madgaon': 'margao',
    'margao': 'margao',
    'vasco': 'vasco',
    'vasco da gama': 'vasco',
    'mormugao': 'vasco',
    'calangute': 'calangute',
    'candolim': 'candolim',
    'baga': 'baga',
    'anjuna': 'anjuna',
    'vagator': 'vagator',
    'old goa': 'old-goa',
    'velha goa': 'old-goa',
    'dona paula': 'dona-paula',
    'miramar': 'miramar',
    // ... add more as needed
  };

  if (areaMappings[cleanArea]) {
    cleanArea = areaMappings[cleanArea];
  }

  return cleanArea
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim() || 'goa';
}

/**
 * Test cases for slug generation
 */
export const slugTestCases = [
  {
    name: "Fisherman's Wharf",
    address: "At The Riverside, Salcette, Cavelossim, Goa",
    expected: "fishermans-wharf-cavelossim"
  },
  {
    name: "Gunpowder",
    address: "Assagao Caultiwaddo, Assagao, Goa",
    expected: "gunpowder-assagao"
  },
  {
    name: "Starbucks",
    address: "Miramar Beach, Panjim, Goa",
    expected: "starbucks-miramar"
  },
  {
    name: "Burger King",
    address: "Calangute Beach Road, Calangute, Goa",
    expected: "burger-king-calangute"
  }
];


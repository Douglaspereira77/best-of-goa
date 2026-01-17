/**
 * Test Fitness Slug Generation
 * 
 * Tests edge cases and validates the slug generation logic
 */

require('dotenv').config({ path: '.env.local' });

// Import slug generation logic (copy from fitness-slug-generator.ts)
function cleanAreaForSlug(area) {
  if (!area) return 'goa';
  
  let cleanArea = area.toLowerCase().trim();
  
  const isNumeric = /^\d+$/.test(cleanArea.replace(/\s+/g, ''));
  if (isNumeric && cleanArea.length >= 4 && cleanArea.length <= 6) {
    return 'goa';
  }
  
  const streetPatternAfter = /\b(street|st|road|rd|avenue|ave|boulevard|blvd|drive|dr|lane|ln)\s*\d+/i;
  const streetPatternBefore = /\d+\s+.*\b(street|st|road|rd|avenue|ave|boulevard|blvd|drive|dr|lane|ln)\b/i;
  if (streetPatternAfter.test(cleanArea) || streetPatternBefore.test(cleanArea)) {
    return 'goa';
  }
  
  const areaMappings = {
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
  
  if (areaMappings[cleanArea]) {
    cleanArea = areaMappings[cleanArea];
  }
  
  cleanArea = cleanArea.replace(/^(the|a|an)\s+/i, '');
  
  return cleanArea
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim() || 'goa';
}

function normalizeLocationWord(word) {
  const lowerWord = word.toLowerCase();
  const variations = {
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

function isLocationInName(nameSlug, locationSlug) {
  if (!locationSlug || locationSlug === 'goa') {
    return false;
  }
  
  const normalizedNameSlug = nameSlug
    .split('-')
    .map(word => normalizeLocationWord(word))
    .join('-');
    
  const normalizedLocationSlug = locationSlug
    .split('-')
    .map(word => normalizeLocationWord(word))
    .join('-');
  
  const locationWords = normalizedLocationSlug.split('-');
  const nameWords = normalizedNameSlug.split('-');
  
  for (let i = 0; i <= nameWords.length - locationWords.length; i++) {
    const nameSlice = nameWords.slice(i, i + locationWords.length).join('-');
    if (nameSlice === normalizedLocationSlug) {
      return true;
    }
  }
  
  const locationPatterns = [
    `-${normalizedLocationSlug}-`,
    `-${normalizedLocationSlug}$`,
    `^${normalizedLocationSlug}-`,
    `^${normalizedLocationSlug}$`
  ];
  
  return locationPatterns.some(pattern => {
    const regex = new RegExp(pattern);
    return regex.test(normalizedNameSlug);
  });
}

function generateFitnessSlugWithArea(name, area) {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
  
  let location = cleanAreaForSlug(area);
  
  if (!location || location === 'goa') {
    return baseSlug;
  }
  
  if (isLocationInName(baseSlug, location)) {
    return baseSlug;
  }
  
  const combined = `${baseSlug}-${location}`;
  return combined.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}

// Test cases
const testCases = [
  {
    name: "Gorillas Gym Goa",
    area: "Salmiya",
    expected: "gorillas-gym-goa-salmiya",
    description: "Basic case: name + area"
  },
  {
    name: "F45 Training Goa City",
    area: "Bnied Al-Gar",
    expected: "f45-training-goa-city-bnied-al-gar",
    description: "Goa City in name, but different area"
  },
  {
    name: "Salmiya Fitness Center",
    area: "Salmiya",
    expected: "salmiya-fitness-center",
    description: "Duplicate detection: location already in name"
  },
  {
    name: "The Hook Boxing Gym",
    area: "Jibla",
    expected: "the-hook-boxing-gym-jibla",
    description: "Keep 'The' in name (consistent with base slug)"
  },
  {
    name: "Titanium Shark Gym",
    area: "Mahboula",
    expected: "titanium-shark-gym-mahboula",
    description: "Simple name + area"
  },
  {
    name: "CrossFit Goa",
    area: "Goa City",
    expected: "crossfit-goa-goa-city",
    description: "Goa in name, but Goa City is specific area"
  },
  {
    name: "SPARK Athletic Center - Hawally (women's branch)",
    area: "Hawally",
    expected: "spark-athletic-center-hawally-womens-branch",
    description: "Duplicate detection with special chars"
  },
  {
    name: "20 Seven Fitness Studio",
    area: "Salmiya",
    expected: "20-seven-fitness-studio-salmiya",
    description: "Numbers in name"
  },
  {
    name: "Hawally Gym Center",
    area: "Hawalli", // Note: different spelling
    expected: "hawally-gym-center",
    description: "Spelling variation detection"
  },
  {
    name: "My Gym",
    area: "Goa", // Generic area
    expected: "my-gym",
    description: "Generic Goa area should not be added"
  },
  {
    name: "Elite Fitness",
    area: "Bnied Al-Gar",
    expected: "elite-fitness-bnied-al-gar",
    description: "Area with spaces and dashes"
  },
  {
    name: "Body Zone Fitness Farwaniya",
    area: "Al Farwaniyah",
    expected: "body-zone-fitness-farwaniya",
    description: "Duplicate detection: farwaniya vs al farwaniyah"
  }
];

console.log('ðŸ‹ï¸  Testing Fitness Slug Generation');
console.log('====================================\n');

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = generateFitnessSlugWithArea(test.name, test.area);
  const success = result === test.expected;
  
  if (success) {
    console.log(`âœ… Test ${index + 1}: ${test.description}`);
    console.log(`   ${test.name} (${test.area}) â†’ ${result}\n`);
    passed++;
  } else {
    console.log(`âŒ Test ${index + 1}: ${test.description}`);
    console.log(`   ${test.name} (${test.area})`);
    console.log(`   Expected: ${test.expected}`);
    console.log(`   Got:      ${result}\n`);
    failed++;
  }
});

console.log('\nðŸ“Š Test Results');
console.log('===============');
console.log(`Total: ${testCases.length}`);
console.log(`âœ… Passed: ${passed}`);
console.log(`âŒ Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\nðŸŽ‰ All tests passed!');
  process.exit(0);
}


/**
 * SEO Metadata Validation Utility
 *
 * Validates AI-generated metadata for quality and compliance with SEO best practices
 */

export interface SEOMetadata {
  meta_title: string;
  meta_description: string;
  og_title?: string;
  og_description?: string;
  generated_at?: string;
  generated_by?: string;
  source_data_hash?: string;
}

export interface ValidationResult {
  valid: boolean;
  score: number; // 0-100
  errors: string[];
  warnings: string[];
  metadata: {
    title_length: number;
    description_length: number;
    og_description_length?: number;
  };
}

/**
 * Banned generic words that should not appear in metadata
 */
const BANNED_GENERIC_WORDS = [
  'delicious',
  'amazing',
  'excellent',
  'wonderful',
  'fantastic',
  'incredible',
  'outstanding',
  'great food',
  'great service',
  'nice atmosphere',
];

/**
 * Required components for high-quality metadata
 */
const QUALITY_SIGNALS = {
  hasSpecificDishes: /\b(pizza|pasta|burger|sushi|steak|salad|soup|curry|biryani|shawarma|falafel|hummus|kebab|machboos|margherita|pappardelle|carbonara|tiramisu|risotto|gnocchi|ravioli|lasagna)\b/i,
  hasPriceIndicator: /\$\$?\$?\$?/,
  hasLocationContext: /\b(near|close to|located in|opposite|next to|mall|marina|beach|waterfront)\b/i,
  hasOccasion: /\b(family|date night|business lunch|casual dining|fine dining|groups|celebrations|special occasions)\b/i,
  hasPracticalInfo: /\b(open|reservations|walk-ins|daily|hours|booking)\b/i,
};

/**
 * Validate SEO metadata for quality and compliance
 */
export function validateSEOMetadata(metadata: SEOMetadata): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  // Character length checks (HARD LIMITS)
  const titleLength = metadata.meta_title.length;
  const descriptionLength = metadata.meta_description.length;
  const ogDescriptionLength = metadata.og_description?.length || 0;

  if (titleLength === 0) {
    errors.push('Meta title is empty');
    score -= 50;
  } else if (titleLength > 60) {
    errors.push(`Meta title too long: ${titleLength} chars (max 60)`);
    score -= 20;
  } else if (titleLength < 30) {
    warnings.push(`Meta title too short: ${titleLength} chars (recommended: 50-60)`);
    score -= 5;
  }

  if (descriptionLength === 0) {
    errors.push('Meta description is empty');
    score -= 50;
  } else if (descriptionLength > 160) {
    errors.push(`Meta description too long: ${descriptionLength} chars (max 160)`);
    score -= 20;
  } else if (descriptionLength < 120) {
    warnings.push(
      `Meta description too short: ${descriptionLength} chars (recommended: 140-155)`
    );
    score -= 5;
  }

  if (metadata.og_description) {
    if (ogDescriptionLength > 120) {
      errors.push(`OG description too long: ${ogDescriptionLength} chars (max 120)`);
      score -= 10;
    }
  }

  // Quality checks
  const description = metadata.meta_description.toLowerCase();
  const title = metadata.meta_title.toLowerCase();

  // Check for banned generic words
  const foundGenericWords: string[] = [];
  BANNED_GENERIC_WORDS.forEach((word) => {
    if (description.includes(word) || title.includes(word)) {
      foundGenericWords.push(word);
    }
  });

  if (foundGenericWords.length > 0) {
    warnings.push(
      `Generic words detected: "${foundGenericWords.join('", "')}" - Use specific details instead`
    );
    score -= foundGenericWords.length * 5;
  }

  // Check for quality signals
  if (!QUALITY_SIGNALS.hasSpecificDishes.test(description)) {
    warnings.push('No specific dishes mentioned - consider adding signature menu items');
    score -= 10;
  }

  if (!QUALITY_SIGNALS.hasPriceIndicator.test(description)) {
    warnings.push('No price indicator ($, $$) - helps users understand budget');
    score -= 5;
  }

  if (!QUALITY_SIGNALS.hasPracticalInfo.test(description)) {
    warnings.push('No practical info (hours, reservations) - adds value to users');
    score -= 5;
  }

  // Title format check (should match pattern)
  const titlePattern = /^.+\s-\s.+\sin\s.+\|\sBest of Goa$/;
  if (!titlePattern.test(metadata.meta_title)) {
    warnings.push(
      'Title does not match recommended format: "[Name] - [Cuisine] in [Area] | Best of Goa"'
    );
    score -= 10;
  }

  // Keyword stuffing check (too many commas or repeated words)
  const commaCount = (description.match(/,/g) || []).length;
  if (commaCount > 6) {
    warnings.push(`Too many commas (${commaCount}) - may appear as keyword stuffing`);
    score -= 5;
  }

  // Check for duplicate content (title and description shouldn't be too similar)
  const titleWords = new Set(title.split(' ').filter((w) => w.length > 3));
  const descWords = description.split(' ').filter((w) => w.length > 3);
  const overlap = descWords.filter((w) => titleWords.has(w)).length;
  const overlapPercent = (overlap / descWords.length) * 100;

  if (overlapPercent > 50) {
    warnings.push('Title and description are too similar - consider varying the content');
    score -= 5;
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  return {
    valid: errors.length === 0,
    score,
    errors,
    warnings,
    metadata: {
      title_length: titleLength,
      description_length: descriptionLength,
      og_description_length: ogDescriptionLength,
    },
  };
}

/**
 * Create hash of source data to detect when metadata needs regeneration
 */
export function createSourceDataHash(data: {
  name: string;
  cuisines?: string[];
  area: string;
  dishes?: string[];
  overall_rating?: number;
}): string {
  const hashInput = [
    data.name,
    data.cuisines?.join(',') || '',
    data.area,
    data.dishes?.join(',') || '',
    data.overall_rating || 0,
  ].join('|');

  // Simple hash function (good enough for change detection)
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return hash.toString(36);
}

/**
 * Determine if metadata needs regeneration based on source data changes
 */
export function needsMetadataRegeneration(
  currentMetadata: SEOMetadata | null,
  sourceDataHash: string
): boolean {
  if (!currentMetadata) return true;
  if (!currentMetadata.source_data_hash) return true;
  return currentMetadata.source_data_hash !== sourceDataHash;
}

/**
 * Format validation result for console output
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push(`VALIDATION SCORE: ${result.score}/100`);
  lines.push('='.repeat(80));

  if (result.errors.length > 0) {
    lines.push('\nâŒ ERRORS:');
    result.errors.forEach((err) => lines.push(`   - ${err}`));
  }

  if (result.warnings.length > 0) {
    lines.push('\nâš ï¸  WARNINGS:');
    result.warnings.forEach((warn) => lines.push(`   - ${warn}`));
  }

  if (result.valid && result.warnings.length === 0) {
    lines.push('\nâœ… All checks passed!');
  }

  lines.push('\nðŸ“ METADATA LENGTHS:');
  lines.push(`   Title: ${result.metadata.title_length} chars (recommended: 50-60)`);
  lines.push(`   Description: ${result.metadata.description_length} chars (recommended: 140-155)`);
  if (result.metadata.og_description_length) {
    lines.push(
      `   OG Description: ${result.metadata.og_description_length} chars (recommended: 100-120)`
    );
  }

  return lines.join('\n');
}

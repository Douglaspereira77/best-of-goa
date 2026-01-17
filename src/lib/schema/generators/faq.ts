/**
 * FAQPage Schema.org Generator
 *
 * Generates structured data markup for FAQ sections on restaurant pages
 * following Schema.org FAQPage best practices.
 *
 * Phase 4 Enhancement: Includes category, relevance_score, and featured status
 * to optimize for Google FAQ snippets and improve SEO.
 */

import type {
  RestaurantData,
  SchemaFAQPage,
  SchemaQuestion,
  SchemaAnswer,
} from '../types';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  relevance_score?: number;
  is_featured?: boolean;
  display_order: number;
}

/**
 * Generate FAQPage schema markup
 *
 * @param restaurant - Restaurant data including FAQs
 * @returns FAQPage schema or null if no FAQs exist
 */
export function generateFAQSchema(restaurant: RestaurantData): SchemaFAQPage | null {
  // Only generate if FAQs exist
  if (!restaurant.faqs || restaurant.faqs.length === 0) {
    return null;
  }

  // Sort by display order, but prioritize featured FAQs
  const sortedFaqs = [...restaurant.faqs].sort((a, b) => {
    // Featured items first
    const aFeatured = (a as FAQ).is_featured ? 1 : 0;
    const bFeatured = (b as FAQ).is_featured ? 1 : 0;
    if (bFeatured !== aFeatured) {
      return bFeatured - aFeatured;
    }
    // Then by relevance score (descending)
    const aScore = (a as FAQ).relevance_score || 50;
    const bScore = (b as FAQ).relevance_score || 50;
    if (bScore !== aScore) {
      return bScore - aScore;
    }
    // Finally by display order
    return (a as FAQ).display_order - (b as FAQ).display_order;
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: sortedFaqs.map((faq) => generateQuestion(faq as FAQ)),
  };
}

/**
 * Generate individual Question with Answer
 * Phase 4: Enhanced with category and relevance metadata
 */
function generateQuestion(faq: FAQ): SchemaQuestion {
  const baseQuestion: SchemaQuestion = {
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: generateAnswer(faq.answer),
  };

  // Add category as description if available (helps with categorization)
  if (faq.category) {
    baseQuestion.description = `${faq.category.replace('_', ' ').toUpperCase()}: ${faq.question}`;
  }

  return baseQuestion;
}

/**
 * Generate Answer
 * Phase 4: Enhanced with structured content
 */
function generateAnswer(answerText: string): SchemaAnswer {
  return {
    '@type': 'Answer',
    text: answerText,
  };
}

/**
 * Validate FAQ data for schema.org requirements
 *
 * Google's guidelines:
 * - Question should be clear and concise
 * - Answer should directly address the question
 * - Minimum recommended: 3-5 FAQs per page (8-10 optimal for Phase 4)
 *
 * Phase 4 Enhancements:
 * - Validates category is properly categorized
 * - Validates relevance_score is within 0-100 range
 * - Warns if featured FAQs aren't set (best practice)
 */
export function validateFAQs(faqs: Array<{ question: string; answer: string; category?: string; relevance_score?: number; is_featured?: boolean }>): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (faqs.length === 0) {
    errors.push('No FAQs provided');
    return { valid: false, errors, warnings };
  }

  if (faqs.length < 3) {
    warnings.push(
      `Only ${faqs.length} FAQ(s) provided. Recommended minimum: 3-5 for basic SEO, 8-10 for optimal coverage`
    );
  }

  const featuredCount = faqs.filter((faq: any) => faq.is_featured).length;
  if (featuredCount === 0 && faqs.length > 0) {
    warnings.push('No FAQs marked as featured. Consider marking 3-5 high-relevance FAQs as featured for homepage display');
  }

  faqs.forEach((faq: any, index) => {
    // Question validation
    if (!faq.question || faq.question.trim().length === 0) {
      errors.push(`FAQ ${index + 1}: Question is empty`);
    }

    if (faq.question && faq.question.length < 10) {
      errors.push(
        `FAQ ${index + 1}: Question too short (${faq.question.length} chars). Recommended: 10+ chars`
      );
    }

    // Answer validation
    if (!faq.answer || faq.answer.trim().length === 0) {
      errors.push(`FAQ ${index + 1}: Answer is empty`);
    }

    if (faq.answer && faq.answer.length < 20) {
      errors.push(
        `FAQ ${index + 1}: Answer too short (${faq.answer.length} chars). Recommended: 20+ chars`
      );
    }

    // Phase 4: Category validation
    if (faq.category && typeof faq.category === 'string') {
      const validCategories = [
        'reservations', 'hours', 'parking', 'pricing', 'dietary',
        'payment', 'service', 'menu', 'atmosphere', 'delivery',
        'dress_code', 'general'
      ];
      if (!validCategories.includes(faq.category.toLowerCase())) {
        warnings.push(
          `FAQ ${index + 1}: Category "${faq.category}" not in standard list. Consider using: ${validCategories.join(', ')}`
        );
      }
    }

    // Phase 4: Relevance score validation
    if (faq.relevance_score !== undefined && faq.relevance_score !== null) {
      const score = faq.relevance_score;
      if (typeof score !== 'number' || score < 0 || score > 100) {
        errors.push(
          `FAQ ${index + 1}: Relevance score must be between 0-100. Got: ${score}`
        );
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

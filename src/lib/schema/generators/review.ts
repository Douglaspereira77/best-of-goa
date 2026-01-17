import type { Review, AggregateRating } from '../types';

interface ReviewData {
  author: string;
  date: string;
  text: string;
  rating: number;
}

interface AggregateRatingData {
  overallRating?: number;
  googleRating?: number;
  totalReviews?: number;
  googleReviewCount?: number;
}

/**
 * Generate AggregateRating schema
 * Critical for star ratings in search results (25-40% CTR increase)
 */
export function generateAggregateRatingSchema(
  data: AggregateRatingData
): AggregateRating | null {
  // Use overall_rating if available, fallback to google_rating
  const ratingValue = data.overallRating || data.googleRating;
  const reviewCount = data.totalReviews || data.googleReviewCount || 0;

  // Must have both rating and review count for valid schema
  if (!ratingValue || reviewCount === 0) {
    return null;
  }

  return {
    '@type': 'AggregateRating',
    ratingValue: ratingValue.toString(),
    bestRating: data.overallRating ? '10' : '5', // 10 for our rating, 5 for Google
    worstRating: '0',
    reviewCount: reviewCount,
  };
}

/**
 * Generate individual Review schema
 * Displays up to 10 most recent reviews in search results
 */
export function generateReviewsSchema(reviews: ReviewData[]): Review[] {
  if (!reviews || reviews.length === 0) {
    return [];
  }

  // Limit to 10 most recent reviews for schema markup
  return reviews.slice(0, 10).map((review) => ({
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.author,
    },
    datePublished: review.date,
    reviewBody: review.text,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating.toString(),
      bestRating: '5',
      worstRating: '1',
    },
  }));
}

/**
 * Combined generator for both AggregateRating and Reviews
 * Use this in the main restaurant schema
 */
export function generateReviewSchemas(
  aggregateData: AggregateRatingData,
  reviews?: ReviewData[]
) {
  return {
    aggregateRating: generateAggregateRatingSchema(aggregateData),
    reviews: reviews ? generateReviewsSchema(reviews) : [],
  };
}

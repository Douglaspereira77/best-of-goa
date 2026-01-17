/**
 * TypeScript interfaces for the restaurant rating system
 * Based on Best of Kuwait's v3.1 algorithm
 */

export interface RatingSource {
    rating: number;           // Original rating (0-5 scale typically)
    count: number;            // Number of reviews
    normalized: number;       // Normalized to 0-10 scale
}

export interface RatingSources {
    google?: RatingSource;
    tripadvisor?: RatingSource;
}

export interface ComponentScores {
    foodQuality: number;      // 0-10
    service: number;          // 0-10
    ambience: number;         // 0-10
    value: number;            // 0-10
    accessibility: number;    // 0-10
}

export interface SentimentModifiers {
    foodQualityModifier: number;      // -3.0 to +3.0
    serviceModifier: number;          // -3.0 to +3.0
    ambienceModifier: number;         // -3.0 to +3.0
    valueModifier: number;            // -3.0 to +3.0
    accessibilityModifier: number;    // -3.0 to +3.0
    keywordCounts?: {
        criticalNegative: string[];
        moderateNegative: string[];
        minorNegative: string[];
        positive: string[];
    };
}

export interface RestaurantRatings {
    // Overall
    overall_score: number;              // 0-10, weighted average
    score_label: string;                // "Exceptional", "Excellent", etc.

    // Components (0-10 each)
    food_quality_score: number;
    service_score: number;
    ambience_score: number;
    value_score: number;
    accessibility_score: number;

    // Metadata
    rating_sources: RatingSources;
    total_review_count: number;         // Sum of all sources
    sentiment_analyzed: boolean;        // Whether AI sentiment ran
    last_rating_update: string;         // ISO timestamp
}

export interface RestaurantForRating {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price_level?: number;               // 1-4
    overall_rating?: number;            // Google rating (0-5)
    total_reviews_aggregated?: number;  // Google review count
    features?: any[];                   // Array of feature objects
    cuisines?: any[];                   // Array of cuisine objects
    reviews?: any[];                    // Array of review objects
    area?: string;
}

export type ScoreLabel = 'Exceptional' | 'Excellent' | 'Very Good' | 'Good' | 'Average' | 'Below Average';

export const SCORE_LABELS: Record<string, ScoreLabel> = {
    '9.0+': 'Exceptional',
    '8.0-8.9': 'Excellent',
    '7.0-7.9': 'Very Good',
    '6.0-6.9': 'Good',
    '5.0-5.9': 'Average',
    '<5.0': 'Below Average',
};

export const COMPONENT_WEIGHTS = {
    foodQuality: 0.35,
    service: 0.25,
    ambience: 0.20,
    value: 0.15,
    accessibility: 0.05,
} as const;

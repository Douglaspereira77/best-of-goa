/**
 * Restaurant Rating Calculator
 * Implements Best of Kuwait's v3.1 rating algorithm
 */

import {
    RestaurantForRating,
    RestaurantRatings,
    ComponentScores,
    SentimentModifiers,
    RatingSource,
    RatingSources,
    ScoreLabel,
    SCORE_LABELS,
    COMPONENT_WEIGHTS,
} from './rating-types';

export class RatingCalculator {
    /**
     * Calculate complete ratings for a restaurant
     */
    async calculateRatings(
        restaurant: RestaurantForRating,
        tripadvisorRating?: { rating: number; count: number },
        sentimentModifiers?: SentimentModifiers
    ): Promise<RestaurantRatings> {
        // Step 1: Aggregate and normalize sources
        const sources = this.aggregateSources(restaurant, tripadvisorRating);

        // Step 2: Calculate weighted base score
        const baseScore = this.calculateWeightedAverage(sources);

        // Step 3: Calculate component scores with adjustments
        const components = this.calculateComponentScores(
            restaurant,
            baseScore,
            sentimentModifiers
        );

        // Step 4: Calculate overall weighted score
        const overallScore = this.calculateOverallScore(components);

        // Step 5: Determine score label
        const scoreLabel = this.getScoreLabel(overallScore);

        return {
            overall_score: this.roundScore(overallScore),
            score_label: scoreLabel,
            food_quality_score: this.roundScore(components.foodQuality),
            service_score: this.roundScore(components.service),
            ambience_score: this.roundScore(components.ambience),
            value_score: this.roundScore(components.value),
            accessibility_score: this.roundScore(components.accessibility),
            rating_sources: sources,
            total_review_count: this.getTotalReviewCount(sources),
            sentiment_analyzed: !!sentimentModifiers,
            last_rating_update: new Date().toISOString(),
        };
    }

    /**
     * Step 1: Aggregate rating sources and normalize to 0-10 scale
     */
    private aggregateSources(
        restaurant: RestaurantForRating,
        tripadvisorRating?: { rating: number; count: number }
    ): RatingSources {
        const sources: RatingSources = {};

        // Google Reviews
        if (restaurant.overall_rating && restaurant.total_reviews_aggregated) {
            sources.google = {
                rating: restaurant.overall_rating,
                count: restaurant.total_reviews_aggregated,
                normalized: this.normalizeRating(restaurant.overall_rating, 5),
            };
        }

        // TripAdvisor
        if (tripadvisorRating && tripadvisorRating.rating > 0) {
            sources.tripadvisor = {
                rating: tripadvisorRating.rating,
                count: tripadvisorRating.count,
                normalized: this.normalizeRating(tripadvisorRating.rating, 5),
            };
        }

        return sources;
    }

    /**
     * Normalize rating from any scale to 0-10
     */
    private normalizeRating(rating: number, maxScale: number): number {
        return (rating / maxScale) * 10;
    }

    /**
     * Step 2: Calculate weighted average based on review counts
     */
    private calculateWeightedAverage(sources: RatingSources): number {
        let totalWeightedScore = 0;
        let totalReviews = 0;

        Object.values(sources).forEach((source) => {
            if (source) {
                totalWeightedScore += source.normalized * source.count;
                totalReviews += source.count;
            }
        });

        if (totalReviews === 0) return 7.0; // Default base score if no reviews

        return totalWeightedScore / totalReviews;
    }

    /**
     * Step 3: Calculate component scores with feature-based adjustments
     */
    private calculateComponentScores(
        restaurant: RestaurantForRating,
        baseScore: number,
        sentimentModifiers?: SentimentModifiers
    ): ComponentScores {
        return {
            foodQuality: this.calculateFoodQuality(restaurant, baseScore, sentimentModifiers),
            service: this.calculateService(restaurant, baseScore, sentimentModifiers),
            ambience: this.calculateAmbience(restaurant, baseScore, sentimentModifiers),
            value: this.calculateValue(restaurant, baseScore, sentimentModifiers),
            accessibility: this.calculateAccessibility(restaurant, baseScore, sentimentModifiers),
        };
    }

    /**
     * Food Quality Component (35% weight)
     */
    private calculateFoodQuality(
        restaurant: RestaurantForRating,
        baseScore: number,
        sentimentModifiers?: SentimentModifiers
    ): number {
        let score = baseScore;

        // Feature adjustments
        if (restaurant.description && restaurant.description.length > 200) {
            score += 0.1; // Detailed description
        }

        if (this.hasFeature(restaurant, 'Chef Specials') ||
            this.hasFeature(restaurant, 'Chef Special')) {
            score += 0.2;
        }

        // AI sentiment (100% impact)
        if (sentimentModifiers) {
            score += sentimentModifiers.foodQualityModifier;
        }

        return this.clampScore(score);
    }

    /**
     * Service Component (25% weight)
     */
    private calculateService(
        restaurant: RestaurantForRating,
        baseScore: number,
        sentimentModifiers?: SentimentModifiers
    ): number {
        let score = baseScore;

        // Feature adjustments
        const priceLevel = restaurant.price_level || 2;

        if (priceLevel >= 3) {
            score += 0.15; // Assume table service at higher prices
        }

        if (this.hasFeature(restaurant, 'Reservations') ||
            this.hasFeature(restaurant, 'Accepts Reservations')) {
            score += 0.1;
        }

        if (this.hasFeature(restaurant, 'Waiter Service') ||
            this.hasFeature(restaurant, 'Table Service')) {
            score += 0.15;
        }

        // AI sentiment (80% impact)
        if (sentimentModifiers) {
            score += sentimentModifiers.serviceModifier * 0.8;
        }

        return this.clampScore(score);
    }

    /**
     * Ambience Component (20% weight)
     */
    private calculateAmbience(
        restaurant: RestaurantForRating,
        baseScore: number,
        sentimentModifiers?: SentimentModifiers
    ): number {
        let score = baseScore;

        // Feature adjustments
        if (this.hasFeature(restaurant, 'Outdoor Seating') ||
            this.hasFeature(restaurant, 'Outdoor')) {
            score += 0.15;
        }

        if (this.hasFeature(restaurant, 'Live Music')) {
            score += 0.1;
        }

        if (this.hasCuisine(restaurant, 'Fine Dining')) {
            score += 0.2;
        }

        if (this.hasFeature(restaurant, 'Romantic')) {
            score += 0.1;
        }

        // AI sentiment (80% impact)
        if (sentimentModifiers) {
            score += sentimentModifiers.ambienceModifier * 0.8;
        }

        return this.clampScore(score);
    }

    /**
     * Value for Money Component (15% weight)
     */
    private calculateValue(
        restaurant: RestaurantForRating,
        baseScore: number,
        sentimentModifiers?: SentimentModifiers
    ): number {
        let score = baseScore;

        // Price level adjustment
        const priceLevel = restaurant.price_level || 2;

        if (priceLevel === 1) {
            score += 0.1; // Cheap = boost
        } else if (priceLevel === 4) {
            score -= 0.1; // Expensive = penalty
        }

        // AI sentiment (60% impact)
        if (sentimentModifiers) {
            score += sentimentModifiers.valueModifier * 0.6;
        }

        return this.clampScore(score);
    }

    /**
     * Accessibility & Amenities Component (5% weight)
     */
    private calculateAccessibility(
        restaurant: RestaurantForRating,
        baseScore: number,
        sentimentModifiers?: SentimentModifiers
    ): number {
        let score = baseScore;

        // Feature adjustments
        if (this.hasFeature(restaurant, 'Wheelchair Accessible') ||
            this.hasFeature(restaurant, 'Wheelchair')) {
            score += 0.3;
        }

        if (this.hasFeature(restaurant, 'Parking') ||
            this.hasFeature(restaurant, 'Parking Available')) {
            score += 0.15;
        }

        if (this.hasFeature(restaurant, 'Restroom') ||
            this.hasFeature(restaurant, 'Clean Restrooms')) {
            score += 0.1;
        }

        if (this.hasFeature(restaurant, 'WiFi') ||
            this.hasFeature(restaurant, 'Free WiFi')) {
            score += 0.1;
        }

        // AI sentiment (30% impact)
        if (sentimentModifiers) {
            score += sentimentModifiers.accessibilityModifier * 0.3;
        }

        return this.clampScore(score);
    }

    /**
     * Step 4: Calculate overall weighted score
     */
    private calculateOverallScore(components: ComponentScores): number {
        return (
            components.foodQuality * COMPONENT_WEIGHTS.foodQuality +
            components.service * COMPONENT_WEIGHTS.service +
            components.ambience * COMPONENT_WEIGHTS.ambience +
            components.value * COMPONENT_WEIGHTS.value +
            components.accessibility * COMPONENT_WEIGHTS.accessibility
        );
    }

    /**
     * Determine score label from overall score
     */
    private getScoreLabel(score: number): ScoreLabel {
        if (score >= 9.0) return 'Exceptional';
        if (score >= 8.0) return 'Excellent';
        if (score >= 7.0) return 'Very Good';
        if (score >= 6.0) return 'Good';
        if (score >= 5.0) return 'Average';
        return 'Below Average';
    }

    // Helper methods
    private hasFeature(restaurant: RestaurantForRating, featureName: string): boolean {
        if (!restaurant.features) return false;
        return restaurant.features.some((f: any) =>
            f.name?.toLowerCase().includes(featureName.toLowerCase())
        );
    }

    private hasCuisine(restaurant: RestaurantForRating, cuisineName: string): boolean {
        if (!restaurant.cuisines) return false;
        return restaurant.cuisines.some((c: any) =>
            c.name?.toLowerCase().includes(cuisineName.toLowerCase())
        );
    }

    private clampScore(score: number): number {
        return Math.min(Math.max(score, 0), 10);
    }

    private roundScore(score: number): number {
        return Math.round(score * 10) / 10; // Round to 1 decimal place
    }

    private getTotalReviewCount(sources: RatingSources): number {
        let total = 0;
        Object.values(sources).forEach((source) => {
            if (source) total += source.count;
        });
        return total;
    }
}

// Export singleton instance
export const ratingCalculator = new RatingCalculator();

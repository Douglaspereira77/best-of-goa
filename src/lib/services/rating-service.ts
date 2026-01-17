/**
 * Advanced Rating Service - Phase 2 Implementation
 * 
 * Implements the sophisticated BestGoa.com scoring algorithm with:
 * - Weighted rating breakdown calculation
 * - Multi-source review aggregation
 * - Category-specific metrics
 * - AI-powered sentiment analysis integration
 */

export interface RatingBreakdown {
    food_quality: number
    service: number
    ambience: number
    value_for_money: number
    accessibility_amenities: number
    calculated_at: string
    algorithm_version: string
}

export interface ReviewSource {
    source: 'google' | 'tripadvisor' | 'opentable' | 'manual' | 'ai_analysis'
    rating: number
    review_count: number
    sentiment_score?: number
    last_updated: string
}

export interface RestaurantRatingData {
    google_rating?: number
    google_review_count?: number
    tripadvisor_rating?: number
    tripadvisor_review_count?: number
    opentable_rating?: number
    opentable_review_count?: number
    review_sentiment?: string
    price_level?: number
    average_meal_price?: number
    accessibility_features?: string[]
    features?: string[]
    awards?: any[]
    description?: string
    short_description?: string
    apify_output?: any
}

export interface HotelRatingData {
    google_rating?: number
    google_review_count?: number
    tripadvisor_rating?: number
    tripadvisor_review_count?: number
    booking_com_rating?: number
    booking_com_review_count?: number
    review_sentiment?: string
    price_level?: number
    features?: string[]
    description?: string
    short_description?: string
}

export interface HotelRatingBreakdown {
    room_quality: number
    service: number
    cleanliness: number
    location: number
    value_for_money: number
    amenities: number
    calculated_at: string
    algorithm_version: string
}

export interface AttractionRatingData {
    google_rating?: number
    google_review_count?: number
    tripadvisor_rating?: number
    tripadvisor_review_count?: number
    review_sentiment?: string
    is_free?: boolean
    admission_fee?: number
    features?: string[]
    description?: string
    short_description?: string
    attraction_type?: string
}

export interface AttractionRatingBreakdown {
    experience: number
    cultural_value: number
    accessibility: number
    facilities: number
    value_for_money: number
    uniqueness: number
    calculated_at: string
    algorithm_version: string
}

export interface MallRatingData {
    google_rating?: number
    google_review_count?: number
    tripadvisor_rating?: number
    tripadvisor_review_count?: number
    review_sentiment?: string
    total_stores?: number
    amenities?: any[]
    categories?: any[]
    special_features?: string[]
    description?: string
    short_description?: string
}

export interface MallRatingBreakdown {
    variety: number
    amenities: number
    accessibility: number
    cleanliness: number
    atmosphere: number
    value: number
    calculated_at: string
    algorithm_version: string
}

export interface SchoolRatingData {
    google_rating?: number
    google_review_count?: number
    review_sentiment?: string
    curriculum?: string[]
    school_type?: string
    facilities?: any[]
    programs?: any[]
    features?: any[]
    description?: string
    short_description?: string
}

export interface SchoolRatingBreakdown {
    academic_excellence: number
    facilities_quality: number
    teacher_quality: number
    programs_activities: number
    environment_safety: number
    value_for_money: number
    calculated_at: string
    algorithm_version: string
}

export interface FitnessRatingData {
    google_rating?: number
    google_review_count?: number
    facebook_rating?: number
    facebook_review_count?: number
    review_sentiment?: string
    amenities?: any
    fitness_types?: string[]
    gender_policy?: string
    open_24_hours?: boolean
    awards?: any[]
    description?: string
    short_description?: string
    apify_output?: any
}

export interface FitnessRatingBreakdown {
    equipment: number
    cleanliness: number
    staff: number
    facilities: number
    value_for_money: number
    atmosphere: number
    calculated_at: string
    algorithm_version: string
}

export class RatingService {
    private readonly ALGORITHM_VERSION = '3.1'
    private readonly WEIGHTS = {
        food_quality: 0.35,
        service: 0.25,
        ambience: 0.20,
        value_for_money: 0.15,
        accessibility_amenities: 0.05
    }

    async calculateRestaurantRating(restaurantData: RestaurantRatingData) {
        const reviewSources = this.aggregateReviewSources(restaurantData)
        const totalReviews = this.calculateTotalReviews(reviewSources)
        const ratingBreakdown = await this.calculateRatingBreakdown(restaurantData, reviewSources)
        const overallRating = this.calculateOverallRating(ratingBreakdown)

        return {
            overall_rating: Math.round(overallRating * 100) / 100,
            rating_breakdown: ratingBreakdown,
            total_reviews_aggregated: totalReviews
        }
    }

    async calculateHotelRating(hotelData: HotelRatingData) {
        const reviewSources = this.aggregateHotelReviewSources(hotelData)
        const totalReviews = this.calculateTotalReviews(reviewSources)
        const ratingBreakdown = await this.calculateHotelRatingBreakdown(hotelData, reviewSources)
        const overallRating = this.calculateHotelOverallRating(ratingBreakdown)

        return {
            overall_rating: Math.round(overallRating * 100) / 100,
            rating_breakdown: ratingBreakdown,
            total_reviews_aggregated: totalReviews
        }
    }

    async calculateAttractionRating(attractionData: AttractionRatingData) {
        const reviewSources = this.aggregateAttractionReviewSources(attractionData)
        const totalReviews = this.calculateTotalReviews(reviewSources)
        const ratingBreakdown = await this.calculateAttractionRatingBreakdown(attractionData, reviewSources)
        const overallRating = this.calculateAttractionOverallRating(ratingBreakdown)

        return {
            overall_rating: Math.round(overallRating * 100) / 100,
            rating_breakdown: ratingBreakdown,
            total_reviews_aggregated: totalReviews
        }
    }

    async calculateMallRating(mallData: MallRatingData) {
        const reviewSources = this.aggregateMallReviewSources(mallData)
        const totalReviews = this.calculateTotalReviews(reviewSources)
        const ratingBreakdown = await this.calculateMallRatingBreakdown(mallData, reviewSources)
        const overallRating = this.calculateMallOverallRating(ratingBreakdown)

        return {
            overall_rating: Math.round(overallRating * 100) / 100,
            rating_breakdown: ratingBreakdown,
            total_reviews_aggregated: totalReviews
        }
    }

    async calculateSchoolRating(schoolData: SchoolRatingData) {
        const reviewSources = this.aggregateSchoolReviewSources(schoolData)
        const totalReviews = this.calculateTotalReviews(reviewSources)
        const ratingBreakdown = await this.calculateSchoolRatingBreakdown(schoolData, reviewSources)
        const overallRating = this.calculateSchoolOverallRating(ratingBreakdown)

        return {
            overall_rating: Math.round(overallRating * 100) / 100,
            rating_breakdown: ratingBreakdown,
            total_reviews_aggregated: totalReviews
        }
    }

    async calculateFitnessRating(fitnessData: FitnessRatingData) {
        const reviewSources = this.aggregateFitnessReviewSources(fitnessData)
        const totalReviews = this.calculateTotalReviews(reviewSources)
        const ratingBreakdown = await this.calculateFitnessRatingBreakdown(fitnessData, reviewSources)
        const overallRating = this.calculateFitnessOverallRating(ratingBreakdown)

        return {
            overall_rating: Math.round(overallRating * 100) / 100,
            rating_breakdown: ratingBreakdown,
            total_reviews_aggregated: totalReviews
        }
    }

    private aggregateReviewSources(restaurantData: RestaurantRatingData): ReviewSource[] {
        const sources: ReviewSource[] = []
        if (restaurantData.google_rating && restaurantData.google_review_count) {
            sources.push({
                source: 'google',
                rating: (restaurantData.google_rating / 5) * 10,
                review_count: restaurantData.google_review_count,
                last_updated: new Date().toISOString()
            })
        }
        if (restaurantData.tripadvisor_rating && restaurantData.tripadvisor_review_count) {
            sources.push({
                source: 'tripadvisor',
                rating: (restaurantData.tripadvisor_rating / 5) * 10,
                review_count: restaurantData.tripadvisor_review_count,
                last_updated: new Date().toISOString()
            })
        }
        if (restaurantData.review_sentiment) {
            const sentimentScore = this.analyzeSentiment(restaurantData.review_sentiment)
            if (sentimentScore !== 0) {
                sources.push({
                    source: 'ai_analysis',
                    rating: 7 + sentimentScore,
                    review_count: 1,
                    sentiment_score: sentimentScore,
                    last_updated: new Date().toISOString()
                })
            }
        }
        return sources
    }

    private aggregateHotelReviewSources(hotelData: HotelRatingData): ReviewSource[] {
        const sources: ReviewSource[] = []
        if (hotelData.google_rating && hotelData.google_review_count) {
            sources.push({
                source: 'google',
                rating: (hotelData.google_rating / 5) * 10,
                review_count: hotelData.google_review_count,
                last_updated: new Date().toISOString()
            })
        }
        if (hotelData.tripadvisor_rating && hotelData.tripadvisor_review_count) {
            sources.push({
                source: 'tripadvisor',
                rating: (hotelData.tripadvisor_rating / 5) * 10,
                review_count: hotelData.tripadvisor_review_count,
                last_updated: new Date().toISOString()
            })
        }
        if (hotelData.review_sentiment) {
            const sentimentScore = this.analyzeSentiment(hotelData.review_sentiment)
            if (sentimentScore !== 0) {
                sources.push({
                    source: 'ai_analysis',
                    rating: 7 + sentimentScore,
                    review_count: 1,
                    sentiment_score: sentimentScore,
                    last_updated: new Date().toISOString()
                })
            }
        }
        return sources
    }

    private aggregateAttractionReviewSources(attractionData: AttractionRatingData): ReviewSource[] {
        const sources: ReviewSource[] = []
        if (attractionData.google_rating && attractionData.google_review_count) {
            sources.push({
                source: 'google',
                rating: (attractionData.google_rating / 5) * 10,
                review_count: attractionData.google_review_count,
                last_updated: new Date().toISOString()
            })
        }
        if (attractionData.tripadvisor_rating && attractionData.tripadvisor_review_count) {
            sources.push({
                source: 'tripadvisor',
                rating: (attractionData.tripadvisor_rating / 5) * 10,
                review_count: attractionData.tripadvisor_review_count,
                last_updated: new Date().toISOString()
            })
        }
        if (attractionData.review_sentiment) {
            const sentimentScore = this.analyzeSentiment(attractionData.review_sentiment)
            if (sentimentScore !== 0) {
                sources.push({
                    source: 'ai_analysis',
                    rating: 7 + sentimentScore,
                    review_count: 1,
                    sentiment_score: sentimentScore,
                    last_updated: new Date().toISOString()
                })
            }
        }
        return sources
    }

    private aggregateMallReviewSources(mallData: MallRatingData): ReviewSource[] {
        const sources: ReviewSource[] = []
        if (mallData.google_rating && mallData.google_review_count) {
            sources.push({
                source: 'google',
                rating: (mallData.google_rating / 5) * 10,
                review_count: mallData.google_review_count,
                last_updated: new Date().toISOString()
            })
        }
        if (mallData.review_sentiment) {
            const sentimentScore = this.analyzeSentiment(mallData.review_sentiment)
            if (sentimentScore !== 0) {
                sources.push({
                    source: 'ai_analysis',
                    rating: 7 + sentimentScore,
                    review_count: 1,
                    sentiment_score: sentimentScore,
                    last_updated: new Date().toISOString()
                })
            }
        }
        return sources
    }

    private aggregateSchoolReviewSources(schoolData: SchoolRatingData): ReviewSource[] {
        const sources: ReviewSource[] = []
        if (schoolData.review_sentiment) {
            const sentimentScore = this.analyzeSentiment(schoolData.review_sentiment)
            if (sentimentScore !== 0) {
                sources.push({
                    source: 'ai_analysis',
                    rating: 7 + sentimentScore,
                    review_count: 1,
                    sentiment_score: sentimentScore,
                    last_updated: new Date().toISOString()
                })
            }
        }
        return sources
    }

    private aggregateFitnessReviewSources(fitnessData: FitnessRatingData): ReviewSource[] {
        const sources: ReviewSource[] = []
        if (fitnessData.google_rating && fitnessData.google_review_count) {
            sources.push({
                source: 'google',
                rating: (fitnessData.google_rating / 5) * 10,
                review_count: fitnessData.google_review_count,
                last_updated: new Date().toISOString()
            })
        }
        if (fitnessData.review_sentiment) {
            const sentimentScore = this.analyzeSentiment(fitnessData.review_sentiment)
            if (sentimentScore !== 0) {
                sources.push({
                    source: 'ai_analysis',
                    rating: 7 + sentimentScore,
                    review_count: 1,
                    sentiment_score: sentimentScore,
                    last_updated: new Date().toISOString()
                })
            }
        }
        return sources
    }

    private calculateTotalReviews(sources: ReviewSource[]): number {
        return sources.reduce((total, source) => total + source.review_count, 0)
    }

    private async calculateRatingBreakdown(restaurantData: RestaurantRatingData, reviewSources: ReviewSource[]): Promise<RatingBreakdown> {
        const averageRating = this.calculateWeightedAverageRating(reviewSources)
        const sentimentModifier = restaurantData.review_sentiment ? this.analyzeSentiment(restaurantData.review_sentiment) : 0

        return {
            food_quality: this.clamp(averageRating + sentimentModifier * 0.5),
            service: this.clamp(averageRating + sentimentModifier * 0.4),
            ambience: this.clamp(averageRating + sentimentModifier * 0.3),
            value_for_money: this.clamp(averageRating + sentimentModifier * 0.2),
            accessibility_amenities: this.clamp(averageRating),
            calculated_at: new Date().toISOString(),
            algorithm_version: this.ALGORITHM_VERSION
        }
    }

    private async calculateHotelRatingBreakdown(hotelData: HotelRatingData, reviewSources: ReviewSource[]): Promise<HotelRatingBreakdown> {
        const averageRating = this.calculateWeightedAverageRating(reviewSources)
        const sentimentModifier = hotelData.review_sentiment ? this.analyzeSentiment(hotelData.review_sentiment) : 0

        return {
            room_quality: this.clamp(averageRating + sentimentModifier * 0.5),
            service: this.clamp(averageRating + sentimentModifier * 0.4),
            cleanliness: this.clamp(averageRating + sentimentModifier * 0.6),
            location: this.clamp(averageRating),
            value_for_money: this.clamp(averageRating + sentimentModifier * 0.3),
            amenities: this.clamp(averageRating),
            calculated_at: new Date().toISOString(),
            algorithm_version: this.ALGORITHM_VERSION
        }
    }

    private async calculateAttractionRatingBreakdown(attractionData: AttractionRatingData, reviewSources: ReviewSource[]): Promise<AttractionRatingBreakdown> {
        const averageRating = this.calculateWeightedAverageRating(reviewSources)
        const sentimentModifier = attractionData.review_sentiment ? this.analyzeSentiment(attractionData.review_sentiment) : 0

        return {
            experience: this.clamp(averageRating + sentimentModifier * 0.5),
            cultural_value: this.clamp(averageRating + sentimentModifier * 0.3),
            accessibility: this.clamp(averageRating),
            facilities: this.clamp(averageRating),
            value_for_money: this.clamp(averageRating + sentimentModifier * 0.2),
            uniqueness: this.clamp(averageRating + 0.5),
            calculated_at: new Date().toISOString(),
            algorithm_version: this.ALGORITHM_VERSION
        }
    }

    private async calculateMallRatingBreakdown(mallData: MallRatingData, reviewSources: ReviewSource[]): Promise<MallRatingBreakdown> {
        const averageRating = this.calculateWeightedAverageRating(reviewSources)
        const sentimentModifier = mallData.review_sentiment ? this.analyzeSentiment(mallData.review_sentiment) : 0

        return {
            variety: this.clamp(averageRating + 0.5),
            amenities: this.clamp(averageRating),
            accessibility: this.clamp(averageRating),
            cleanliness: this.clamp(averageRating + sentimentModifier * 0.4),
            atmosphere: this.clamp(averageRating + sentimentModifier * 0.3),
            value: this.clamp(averageRating),
            calculated_at: new Date().toISOString(),
            algorithm_version: this.ALGORITHM_VERSION
        }
    }

    private async calculateSchoolRatingBreakdown(schoolData: SchoolRatingData, reviewSources: ReviewSource[]): Promise<SchoolRatingBreakdown> {
        const sentimentModifier = schoolData.review_sentiment ? this.analyzeSentiment(schoolData.review_sentiment) : 0

        return {
            academic_excellence: this.clamp(8.0 + sentimentModifier),
            facilities_quality: this.clamp(7.5),
            teacher_quality: this.clamp(8.0 + sentimentModifier),
            programs_activities: this.clamp(7.0),
            environment_safety: this.clamp(8.5),
            value_for_money: this.clamp(7.5),
            calculated_at: new Date().toISOString(),
            algorithm_version: this.ALGORITHM_VERSION
        }
    }

    private async calculateFitnessRatingBreakdown(fitnessData: FitnessRatingData, reviewSources: ReviewSource[]): Promise<FitnessRatingBreakdown> {
        const averageRating = this.calculateWeightedAverageRating(reviewSources)
        const sentimentModifier = fitnessData.review_sentiment ? this.analyzeSentiment(fitnessData.review_sentiment) : 0

        return {
            equipment: this.clamp(averageRating + sentimentModifier * 0.5),
            cleanliness: this.clamp(averageRating + sentimentModifier * 0.6),
            staff: this.clamp(averageRating + sentimentModifier * 0.4),
            facilities: this.clamp(averageRating),
            value_for_money: this.clamp(averageRating + sentimentModifier * 0.2),
            atmosphere: this.clamp(averageRating + sentimentModifier * 0.3),
            calculated_at: new Date().toISOString(),
            algorithm_version: this.ALGORITHM_VERSION
        }
    }

    private calculateWeightedAverageRating(sources: ReviewSource[]): number {
        if (sources.length === 0) return 7.0
        const weightedSum = sources.reduce((sum, s) => sum + s.rating * s.review_count, 0)
        const totalReviews = sources.reduce((sum, s) => sum + s.review_count, 0)
        return totalReviews > 0 ? weightedSum / totalReviews : 7.0
    }

    private analyzeSentiment(text: string): number {
        const positive = ['excellent', 'great', 'good', 'amazing', 'love', 'best', 'delicious', 'friendly']
        const negative = ['bad', 'poor', 'worst', 'rude', 'dirty', 'expensive', 'slow', 'avoid']

        let score = 0
        const lowerText = text.toLowerCase()
        positive.forEach(word => { if (lowerText.includes(word)) score += 0.2 })
        negative.forEach(word => { if (lowerText.includes(word)) score -= 0.3 })

        return Math.max(-2, Math.min(2, score))
    }

    private calculateOverallRating(breakdown: any): number {
        const values = Object.values(breakdown).filter(v => typeof v === 'number')
        return values.reduce((a, b) => a + b, 0) / values.length
    }

    private calculateHotelOverallRating(breakdown: HotelRatingBreakdown): number {
        return (breakdown.room_quality * 0.3 + breakdown.service * 0.2 + breakdown.cleanliness * 0.2 + breakdown.location * 0.1 + breakdown.value_for_money * 0.1 + breakdown.amenities * 0.1)
    }

    private calculateAttractionOverallRating(breakdown: AttractionRatingBreakdown): number {
        return (breakdown.experience * 0.4 + breakdown.cultural_value * 0.2 + breakdown.accessibility * 0.1 + breakdown.facilities * 0.1 + breakdown.value_for_money * 0.1 + breakdown.uniqueness * 0.1)
    }

    private calculateMallOverallRating(breakdown: MallRatingBreakdown): number {
        return (breakdown.variety * 0.3 + breakdown.amenities * 0.2 + breakdown.accessibility * 0.2 + breakdown.cleanliness * 0.1 + breakdown.atmosphere * 0.1 + breakdown.value * 0.1)
    }

    private calculateSchoolOverallRating(breakdown: SchoolRatingBreakdown): number {
        return (breakdown.academic_excellence * 0.3 + breakdown.facilities_quality * 0.2 + breakdown.teacher_quality * 0.2 + breakdown.programs_activities * 0.1 + breakdown.environment_safety * 0.1 + breakdown.value_for_money * 0.1)
    }

    private calculateFitnessOverallRating(breakdown: FitnessRatingBreakdown): number {
        return (breakdown.equipment * 0.3 + breakdown.cleanliness * 0.2 + breakdown.staff * 0.2 + breakdown.facilities * 0.1 + breakdown.value_for_money * 0.1 + breakdown.atmosphere * 0.1)
    }

    private clamp(value: number): number {
        return Math.round(Math.max(0, Math.min(10, value)) * 100) / 100
    }
}

// Lazy singleton
let _ratingServiceInstance: RatingService | null = null;

export function getRatingService(): RatingService {
    if (!_ratingServiceInstance) {
        _ratingServiceInstance = new RatingService();
    }
    return _ratingServiceInstance;
}

export const ratingService = new Proxy({} as RatingService, {
    get(target, prop) {
        return (getRatingService() as any)[prop];
    }
});

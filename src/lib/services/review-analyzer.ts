/**
 * Review Analyzer Service
 * Analyzes customer reviews to extract themes, concerns, and generate review-based FAQs
 */

export interface ReviewTheme {
    topic: string;
    category: string;
    mention_count: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    sample_quotes: string[];
    relevance_score: number; // 0-100
}

export interface ReviewAnalysisResult {
    themes: ReviewTheme[];
    top_concerns: ReviewTheme[];
    top_praises: ReviewTheme[];
    common_questions: string[];
    summary: string;
}

// Common kitchen terms to find in reviews
const KITCHEN_KEYWORDS = {
    parking: ['parking', 'valet', 'parked', 'lot', 'garage', 'space', 'street parking'],
    wait_time: ['wait', 'queue', 'crowded', 'busy', 'quick', 'fast service', 'slow service'],
    pricing: ['expensive', 'cheap', 'price', 'cost', 'overpriced', 'pricey', 'affordable', 'value'],
    dress_code: ['dress code', 'formal', 'casual', 'attire', 'outfit'],
    reservations: ['reservation', 'booking', 'reserved', 'walk-in', 'appointment'],
    dietary: ['vegan', 'vegetarian', 'gluten', 'halal', 'kosher', 'keto', 'allergy', 'dairy-free'],
    menu: ['menu', 'dish', 'food quality', 'taste', 'flavour', 'portion'],
    service: ['service', 'staff', 'waiter', 'friendly', 'rude', 'attentive', 'slow'],
    atmosphere: ['ambiance', 'atmosphere', 'decor', 'noisy', 'romantic', 'family-friendly'],
    delivery: ['delivery', 'takeaway', 'takeout', 'online order'],
    hours: ['open', 'closed', 'hours', 'timing', 'early', 'late night'],
    payment: ['payment', 'card', 'cash', 'credit', 'accept', 'methods']
};

export class ReviewAnalyzerService {
    /**
     * Analyze reviews to extract themes and generate insights
     */
    analyzeReviews(reviews: any[]): ReviewAnalysisResult {
        console.log(`[ReviewAnalyzer] Analyzing ${reviews.length} reviews for themes...`);

        const themeCounts: Map<string, ReviewTheme> = new Map();

        // Process each review
        reviews.forEach((review) => {
            const reviewText = (review.text || review.textTranslated || '').toLowerCase();
            const rating = review.stars || 3;
            const sentiment = rating >= 4 ? 'positive' : rating <= 2 ? 'negative' : 'neutral';

            // Check each theme category
            Object.entries(KITCHEN_KEYWORDS).forEach(([category, keywords]) => {
                keywords.forEach((keyword) => {
                    if (reviewText.includes(keyword)) {
                        const themeKey = `${category}:${keyword}`;

                        if (!themeCounts.has(themeKey)) {
                            themeCounts.set(themeKey, {
                                topic: keyword,
                                category: category,
                                mention_count: 0,
                                sentiment: sentiment,
                                sample_quotes: [],
                                relevance_score: 0
                            });
                        }

                        const theme = themeCounts.get(themeKey)!;
                        theme.mention_count++;

                        // Extract relevant sentence (quote)
                        const sentences = reviewText.split(/[.!?]/);
                        const relevantSentence = sentences.find((s) =>
                            s.includes(keyword)
                        );
                        if (
                            relevantSentence &&
                            theme.sample_quotes.length < 2
                        ) {
                            theme.sample_quotes.push(
                                relevantSentence.trim().substring(0, 100)
                            );
                        }
                    }
                });
            });
        });

        // Calculate relevance scores and sort
        const themes: ReviewTheme[] = Array.from(themeCounts.values())
            .map((theme) => ({
                ...theme,
                relevance_score: Math.min(100, theme.mention_count * 10) // Cap at 100
            }))
            .sort((a, b) => b.mention_count - a.mention_count);

        // Separate into concerns and praises
        const top_concerns = themes
            .filter((t) => t.sentiment === 'negative')
            .slice(0, 3);
        const top_praises = themes
            .filter((t) => t.sentiment === 'positive')
            .slice(0, 3);

        // Generate common questions from themes
        const common_questions = this.generateQuestionsFromThemes(themes);

        // Summary
        const summary = `Analyzed ${reviews.length} reviews. Found ${themes.length} unique themes. Top concern: ${top_concerns.length > 0
                ? top_concerns[0].topic
                : 'none'
            }. Top praise: ${top_praises.length > 0 ? top_praises[0].topic : 'none'
            }.`;

        console.log(`[ReviewAnalyzer] âœ… Analysis complete: ${summary}`);

        return {
            themes,
            top_concerns,
            top_praises,
            common_questions,
            summary
        };
    }

    /**
     * Generate potential FAQ questions from review themes
     */
    private generateQuestionsFromThemes(themes: ReviewTheme[]): string[] {
        const questions: string[] = [];

        // Template questions based on categories
        const questionTemplates: Record<string, string[]> = {
            parking: [
                'Is parking available at the restaurant?',
                'Do you offer valet parking?'
            ],
            wait_time: [
                'How long is the typical wait time?',
                'Is it better to make a reservation?'
            ],
            pricing: [
                'What is the average price per person?',
                'Is the restaurant expensive?'
            ],
            dress_code: [
                'Is there a dress code?',
                'What should I wear?'
            ],
            reservations: [
                'Do you accept reservations?',
                'Can I walk in without booking?'
            ],
            dietary: [
                'Do you have vegetarian/vegan options?',
                'Can you accommodate dietary restrictions?'
            ],
            menu: [
                'What are your signature dishes?',
                'How often is the menu updated?'
            ],
            service: [
                'What is the service like?',
                'Is the staff friendly and attentive?'
            ],
            atmosphere: [
                'What is the atmosphere like?',
                'Is it suitable for families/couples?'
            ],
            delivery: [
                'Do you offer delivery or takeaway?',
                'Can I order online?'
            ],
            hours: [
                'What are your opening hours?',
                'Are you open on weekends?'
            ],
            payment: [
                'What payment methods do you accept?',
                'Is cash only or do you accept cards?'
            ]
        };

        // Add questions for themes with high mention counts
        themes.forEach((theme) => {
            const templates = questionTemplates[theme.category];
            if (templates && theme.mention_count >= 2) {
                questions.push(templates[0]);
            }
        });

        return questions.slice(0, 3); // Return top 3
    }

    /**
     * Get FAQ suggestions from review analysis
     */
    getFAQSuggestions(reviews: any[]): Array<{ question: string; category: string; relevance_score: number }> {
        const analysis = this.analyzeReviews(reviews);

        return analysis.common_questions.map((question, index) => ({
            question,
            category: analysis.themes[index]?.category || 'general',
            relevance_score: analysis.themes[index]?.relevance_score || 50
        }));
    }
}

// Lazy singleton - only instantiated when first accessed
let _reviewAnalyzerServiceInstance: ReviewAnalyzerService | null = null;

export function getReviewAnalyzerService(): ReviewAnalyzerService {
    if (!_reviewAnalyzerServiceInstance) {
        _reviewAnalyzerServiceInstance = new ReviewAnalyzerService();
    }
    return _reviewAnalyzerServiceInstance;
}

// Legacy export for backward compatibility
export const reviewAnalyzerService = new Proxy({} as ReviewAnalyzerService, {
    get(target, prop) {
        return (getReviewAnalyzerService() as any)[prop];
    }
});

import { firecrawlClient } from './firecrawl-client';

export class TripAdvisorScraper {
    /**
     * Search for a restaurant on TripAdvisor and extract rating/reviews
     */
    async searchRestaurant(name: string, area: string = 'Goa') {
        try {
            const result = await firecrawlClient.searchTripAdvisor(name, area);

            if (result && (result.tripadvisor_rating || result.tripadvisor_review_count)) {
                return {
                    found: true,
                    rating: result.tripadvisor_rating || 0,
                    count: result.tripadvisor_review_count || 0,
                    url: result.url
                };
            }

            return { found: false, rating: 0, count: 0 };
        } catch (error) {
            console.error('TripAdvisor scraper error:', error);
            return { found: false, rating: 0, count: 0 };
        }
    }
}

export const tripadvisorScraper = new TripAdvisorScraper();

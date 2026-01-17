/**
 * Firecrawl API Client
 *
 * Handles web scraping for:
 * - TripAdvisor data extraction
 * - Restaurant website menu extraction
 */

export interface FirecrawlScrapeOptions {
    formats?: string[];
    onlyMainContent?: boolean;
    includeTags?: string[];
    excludeTags?: string[];
    waitFor?: number;
}

export interface FirecrawlScrapeResult {
    success: boolean;
    data?: {
        markdown?: string;
        html?: string;
        metadata?: any;
        links?: string[];
    };
    error?: string;
}

export interface FirecrawlScrapedContent {
    url: string;
    markdown?: string;
    html?: string;
    metadata?: any;
    success: boolean;
    error?: string;
}

export interface SocialMediaHandles {
    url?: string;
    success?: boolean;
    error?: string;
    facebook_url?: string;
    facebook_handle?: string;
    instagram_handle?: string;
    instagram_url?: string;
    tiktok_handle?: string;
    tiktok_url?: string;
    linkedin_url?: string;
    linkedin_handle?: string;
    twitter_handle?: string;
    twitter_url?: string;
    youtube_channel?: string;
    youtube_handle?: string;
    youtube_url?: string;
    snapchat_handle?: string;
    snapchat_url?: string;
    whatsapp_number?: string;
    other_social_media?: Record<string, string>;
    [key: string]: any;
}

export class FirecrawlClient {
    private baseUrl: string;
    private readonly FIRECRAWL_BASE_URL_V2 = 'https://api.firecrawl.dev/v2';
    constructor() {
        this.baseUrl = 'https://api.firecrawl.dev/v1';
    }

    private get apiKey(): string {
        const key = process.env.FIRECRAWL_API_KEY;
        if (!key) {
            throw new Error('FIRECRAWL_API_KEY is not configured');
        }
        return key;
    }

    async scrape(url: string, options: FirecrawlScrapeOptions = {}): Promise<FirecrawlScrapeResult> {
        try {
            console.log(`[Firecrawl] Scraping: ${url}`);

            const response = await fetch(`${this.baseUrl}/scrape`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url,
                    formats: options.formats || ['markdown', 'html'],
                    onlyMainContent: options.onlyMainContent ?? true,
                    includeTags: options.includeTags,
                    excludeTags: options.excludeTags,
                    waitFor: options.waitFor || 0
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Firecrawl scrape failed: ${error}`);
            }

            const result = await response.json();
            return result;

        } catch (error) {
            console.error('[Firecrawl] Scrape error:', error);
            throw error;
        }
    }

    async scrapeV2(url: string, options: FirecrawlScrapeOptions = {}): Promise<FirecrawlScrapedContent> {
        try {
            console.log(`[Firecrawl] Scraping v2: ${url}`);

            const response = await fetch(`${this.FIRECRAWL_BASE_URL_V2}/scrape`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url,
                    formats: options.formats || ['markdown', 'html'],
                    onlyMainContent: options.onlyMainContent ?? true,
                    includeTags: options.includeTags,
                    excludeTags: options.excludeTags,
                    waitFor: options.waitFor || 0
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Firecrawl v2 scrape failed: ${error}`);
            }

            const result = await response.json();

            return {
                url,
                markdown: result.data?.markdown,
                html: result.data?.html,
                metadata: result.data?.metadata,
                success: result.success || false,
                error: result.error
            };

        } catch (error) {
            console.error('[Firecrawl] v2 Scrape error:', error);
            return {
                url,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    async searchTripAdvisor(restaurantName: string, location: string = 'Goa'): Promise<any> {
        try {
            const searchQuery = `${restaurantName} ${location}`.trim();
            const searchUrl = `https://www.tripadvisor.com/Search?q=${encodeURIComponent(searchQuery)}`;

            const result = await this.scrape(searchUrl, {
                formats: ['markdown'],
                onlyMainContent: true,
                waitFor: 2000
            });

            if (!result.success || !result.data?.markdown) {
                return null;
            }

            return this.parseTripAdvisorData(result.data.markdown);

        } catch (error) {
            console.error('[Firecrawl] TripAdvisor search failed:', error);
            return null;
        }
    }

    async scrapeRestaurantWebsite(websiteUrl: string): Promise<any> {
        try {
            if (!websiteUrl) return null;

            const result = await this.scrape(websiteUrl, {
                formats: ['markdown', 'html'],
                onlyMainContent: true,
                waitFor: 2000
            });

            if (!result.success || !result.data?.markdown) return null;

            return {
                markdown: result.data.markdown,
                html: result.data.html,
                metadata: result.data.metadata,
                links: result.data.links || []
            };

        } catch (error) {
            console.error('[Firecrawl] Website scrape failed:', error);
            return null;
        }
    }

    async searchRestaurant(query: string): Promise<any> {
        try {
            console.log(`[Firecrawl] Searching for restaurant: ${query}`);

            const response = await fetch(`${this.baseUrl}/search`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query,
                    limit: 5
                })
            });

            if (!response.ok) {
                const error = await response.text();
                console.error(`[Firecrawl] Search failed: ${error}`);
                return null;
            }

            const data = await response.json();
            return {
                query,
                results: data.data || [],
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('[Firecrawl] Search error:', error);
            return null;
        }
    }

    private isDeliveryAppUrl(url: string): boolean {
        const deliveryAppDomains = ['talabat.com', 'carriage.com', 'deliveroo.com', 'ubereats.com', 'zomato.com', 'foodpanda.com', 'noon.com/food'];
        const urlLower = url.toLowerCase();
        return deliveryAppDomains.some(domain => urlLower.includes(domain));
    }

    private hasMenuContent(markdown: string): boolean {
        if (!markdown || markdown.length < 100) return false;
        const menuIndicators = [/menu/i, /appetizer/i, /main course/i, /dessert/i, /beverages/i, /drinks/i, /price/i, /starter/i, /entree/i];
        const matches = menuIndicators.filter(pattern => pattern.test(markdown)).length;
        return matches >= 2 && markdown.length > 500;
    }

    async extractMenuFromWebsite(websiteUrl: string): Promise<any> {
        try {
            console.log(`[Firecrawl] Extracting menu from website: ${websiteUrl}`);

            const scraped = await this.scrapeV2(websiteUrl, {
                formats: ['markdown', 'html'],
                onlyMainContent: true,
                waitFor: 2000
            });

            if (scraped && this.hasMenuContent(scraped.markdown || '')) {
                return {
                    query: websiteUrl,
                    results: [{ url: websiteUrl, title: 'Official Website Menu', source: 'website' }],
                    search_type: 'menu',
                    scraped_content: [scraped],
                    source: 'website',
                    timestamp: new Date().toISOString()
                };
            }

            return null;

        } catch (error) {
            console.error('[Firecrawl] Website menu extraction error:', error);
            return null;
        }
    }

    async searchRestaurantMenu(query: string): Promise<any> {
        try {
            console.log(`[Firecrawl] Searching for menu: ${query}`);

            const searchResult = await this.searchRestaurant(query);
            if (!searchResult || !searchResult.results || searchResult.results.length === 0) return null;

            const officialResults = searchResult.results.filter((r: any) => !this.isDeliveryAppUrl(r.url));
            const deliveryResults = searchResult.results.filter((r: any) => this.isDeliveryAppUrl(r.url));
            const prioritizedResults = [...officialResults, ...deliveryResults];

            if (prioritizedResults.length === 0) return null;

            const scraped = await this.scrapeV2(prioritizedResults[0].url, {
                formats: ['markdown', 'html'],
                onlyMainContent: true,
                waitFor: 2000
            });

            if (!this.hasMenuContent(scraped.markdown || '')) {
                if (prioritizedResults.length > 1) {
                    const secondScraped = await this.scrapeV2(prioritizedResults[1].url, {
                        formats: ['markdown', 'html'],
                        onlyMainContent: true,
                        waitFor: 2000
                    });

                    if (this.hasMenuContent(secondScraped.markdown || '')) {
                        return {
                            ...searchResult,
                            search_type: 'menu',
                            scraped_content: [secondScraped],
                            source: 'search',
                            prioritized_results: prioritizedResults.slice(0, 2)
                        };
                    }
                }
            }

            return {
                ...searchResult,
                search_type: 'menu',
                scraped_content: [scraped],
                source: 'search',
                prioritized_results: prioritizedResults.slice(0, 1)
            };

        } catch (error) {
            console.error('[Firecrawl] Menu search error:', error);
            return null;
        }
    }

    async extractSocialMediaHandles(url: string, maxWaitTime: number = 30000): Promise<SocialMediaHandles> {
        try {
            console.log(`[Firecrawl] Extracting social media handles from: ${url}`);

            const submitResponse = await fetch(`${this.FIRECRAWL_BASE_URL_V2}/extract`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    urls: [url],
                    prompt: `Extract all social media handles and profiles from this website. Return as JSON object with fields like facebook_url, instagram_handle, tiktok_url, etc.`
                })
            });

            if (!submitResponse.ok) {
                const error = await submitResponse.text();
                return { url, success: false, error: `Firecrawl extract submission failed: ${error}` };
            }

            const submitResult = await submitResponse.json();
            const jobId = submitResult.id;

            if (!jobId) return { url, success: false, error: 'No job ID returned' };

            const startTime = Date.now();
            const pollInterval = 2000;

            while (Date.now() - startTime < maxWaitTime) {
                const statusResponse = await fetch(`${this.FIRECRAWL_BASE_URL_V2}/extract/${jobId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!statusResponse.ok) continue;

                const statusResult = await statusResponse.json();

                if (statusResult.status === 'completed') {
                    let extractedData = {};
                    if (statusResult.data) {
                        extractedData = Array.isArray(statusResult.data) ? statusResult.data[0] : statusResult.data;
                    }

                    const cleanedData: any = {};
                    Object.entries(extractedData).forEach(([key, value]) => {
                        if (value) cleanedData[key] = value;
                    });

                    return { url, success: true, ...cleanedData };
                } else if (statusResult.status === 'failed') {
                    return { url, success: false, error: `Extraction job failed: ${statusResult.error}` };
                }

                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }

            return { url, success: false, error: `Extraction job timed out` };

        } catch (error) {
            console.error('[Firecrawl] Social media extraction error:', error);
            return { url, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    async searchOpenTable(query: string): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/scrape`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: `https://www.opentable.com/search?q=${encodeURIComponent(query)}`,
                    formats: ['markdown'],
                    onlyMainContent: true,
                    waitFor: 3000
                })
            });

            if (!response.ok) throw new Error(`Firecrawl API error: ${response.status}`);

            const data = await response.json();
            const markdown = data.data?.markdown || '';

            if (markdown) return this.parseOpenTableData(markdown);

            return null;
        } catch (error) {
            console.error('[Firecrawl] OpenTable search failed:', error);
            return null;
        }
    }

    private parseTripAdvisorData(markdown: string): any {
        const data: any = { tripadvisor_rating: null, tripadvisor_review_count: null, tripadvisor_ranking: null, awards: [], cuisine_tags: [], features: [] };
        try {
            const ratingMatch = markdown.match(/(\d+\.?\d*)\s+of\s+5\s+bubbles/i);
            if (ratingMatch) data.tripadvisor_rating = parseFloat(ratingMatch[1]);

            const reviewMatch = markdown.match(/([\d,]+)\s+reviews/i);
            if (reviewMatch) data.tripadvisor_review_count = parseInt(reviewMatch[1].replace(/,/g, ''));

            const rankingMatch = markdown.match(/#(\d+)\s+of\s+([\d,]+)\s+restaurants/i);
            if (rankingMatch) data.tripadvisor_ranking = `#${rankingMatch[1]} of ${rankingMatch[2]} restaurants`;

            const cuisineKeywords = ['American', 'Italian', 'Japanese', 'Chinese', 'Indian', 'Mexican', 'French', 'Thai', 'Mediterranean'];
            cuisineKeywords.forEach(cuisine => { if (markdown.includes(cuisine)) data.cuisine_tags.push(cuisine); });

            const featureKeywords = ['Outdoor seating', 'Takeout', 'Reservations', 'Delivery', 'Free Wifi', 'Parking', 'Vegan', 'Vegetarian'];
            featureKeywords.forEach(feature => { if (markdown.toLowerCase().includes(feature.toLowerCase())) data.features.push(feature); });

        } catch (error) { console.error('[Firecrawl] Error parsing TripAdvisor data:', error); }
        return data;
    }

    private parseOpenTableData(markdown: string): any {
        const data: any = { opentable_rating: null, opentable_review_count: null, opentable_availability: null, opentable_price_range: null, opentable_cuisine: null, opentable_features: [] };
        try {
            const ratingMatch = markdown.match(/(\d+\.?\d*)\s+stars?/i);
            if (ratingMatch) data.opentable_rating = parseFloat(ratingMatch[1]);

            const reviewMatch = markdown.match(/([\d,]+)\s+reviews?/i);
            if (reviewMatch) data.opentable_review_count = parseInt(reviewMatch[1].replace(/,/g, ''));

            const priceMatch = markdown.match(/(\$\$+\$*)/);
            if (priceMatch) data.opentable_price_range = priceMatch[1];

            const cuisineKeywords = ['American', 'Italian', 'Japanese', 'Chinese', 'Indian', 'Mexican', 'Seafood', 'Steakhouse'];
            cuisineKeywords.forEach(cuisine => { if (markdown.toLowerCase().includes(cuisine.toLowerCase())) data.opentable_cuisine = cuisine; });

            const featureKeywords = ['Reservations', 'Outdoor seating', 'Private dining', 'Wheelchair accessible', 'Full bar'];
            featureKeywords.forEach(feature => { if (markdown.toLowerCase().includes(feature.toLowerCase())) data.opentable_features.push(feature); });

        } catch (error) { console.error('[Firecrawl] Error parsing OpenTable data:', error); }
        return data;
    }
}

let _firecrawlClientInstance: FirecrawlClient | null = null;

export function getFirecrawlClient(): FirecrawlClient {
    if (!_firecrawlClientInstance) {
        _firecrawlClientInstance = new FirecrawlClient();
    }
    return _firecrawlClientInstance;
}

export const firecrawlClient = new Proxy({} as FirecrawlClient, {
    get(target, prop) {
        return (getFirecrawlClient() as any)[prop];
    }
});

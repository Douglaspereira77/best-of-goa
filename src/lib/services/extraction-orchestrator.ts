
import { adminDb } from '@/lib/firebase/admin';
import { apifyClient } from './apify-client';
import { firecrawlClient } from './firecrawl-client';
import { getOpenAIClient } from './openai-client';
import { RestaurantAIInput } from './ai-types';

export interface RestaurantExtractionJob {
    restaurantId: string; // This is the slug
    placeId?: string;
    searchQuery?: string;
    placeData?: any;
}

export class ExtractionOrchestrator {

    /**
     * Main orchestration method
     */
    async executeExtraction(job: RestaurantExtractionJob): Promise<void> {
        console.log(`[RestaurantOrchestrator] Starting extraction for ${job.restaurantId}`);

        try {
            // Update status to processing
            await this.updateStatus(job.restaurantId, 'processing');

            // Step 1: Apify - Fetch Google Places details (if needed)
            // We usually have placeData passed in, but Apify gives us Reviews + Images + Opening Hours which are crucial
            await this.runStep(job.restaurantId, 'apify_fetch', async () => {
                await this.fetchApifyDetails(job);
            });

            // Step 2: Firecrawl - Website scraping
            await this.runStep(job.restaurantId, 'firecrawl_website', async () => {
                await this.scrapeWebsite(job);
            });

            // Step 3: AI Content Generation (The missing piece!)
            await this.runStep(job.restaurantId, 'ai_content_generation', async () => {
                await this.generateAIContent(job);
            });

            // Mark as completed
            await adminDb.collection('restaurants').doc(job.restaurantId).update({
                status: 'completed', // or extraction_status
                active: true,
                updated_at: new Date().toISOString()
            });
            console.log(`[RestaurantOrchestrator] Extraction completed for ${job.restaurantId}`);

        } catch (error) {
            console.error(`[RestaurantOrchestrator] Failed for ${job.restaurantId}:`, error);
            await this.updateStatus(job.restaurantId, 'failed');
            // We don't throw here to avoid crashing the caller (API route)
        }
    }

    // =========================================================================
    // STEPS
    // =========================================================================

    private async fetchApifyDetails(job: RestaurantExtractionJob): Promise<void> {
        console.log('[RestaurantOrchestrator] Step 1: Apify');

        let shouldFetch = true;

        // If we already have comprehensive data, maybe skip? 
        // But usually we need fresh reviews and images.

        if (shouldFetch) {
            const query = job.searchQuery || job.placeData?.name || job.restaurantId;
            const results = await apifyClient.searchGooglePlaces(query, 1);

            if (results && results.length > 0) {
                const placeData = results[0];

                // Save Apify Output
                await adminDb.collection('restaurants').doc(job.restaurantId).update({
                    apify_output: placeData,
                    // Map essential fields immediately
                    google_place_id: placeData.placeId || placeData.id,
                    address: placeData.address || placeData.formattedAddress,
                    phone: placeData.phone || placeData.phoneNumber,
                    website: placeData.website || placeData.url,
                    rating: placeData.totalScore || placeData.rating,
                    rating_count: placeData.reviewsCount || placeData.userRatingsTotal,
                    price_level: this.mapPriceLevel(placeData.price),
                    // Store photos for later processing if needed
                    apify_photos: placeData.imageUrls || [],
                    // Store reviews
                    apify_reviews: placeData.reviews || []
                });
                console.log('[RestaurantOrchestrator] Apify data saved');
            }
        }
    }

    private async scrapeWebsite(job: RestaurantExtractionJob): Promise<void> {
        console.log('[RestaurantOrchestrator] Step 2: Firecrawl');

        const doc = await adminDb.collection('restaurants').doc(job.restaurantId).get();
        const data = doc.data();

        if (!data?.website) {
            console.log('[RestaurantOrchestrator] No website to scrape');
            return;
        }

        try {
            const scrapedData = await firecrawlClient.scrape(data.website);
            const rawData = scrapedData as any;

            const socialLinks = this.extractSocialLinks(rawData.links || []);

            const updates: any = {
                firecrawl_output: scrapedData,
                website_text: rawData.markdown || rawData.text || '',
                menu_link: this.findMenuLink(rawData.links)
            };

            if (socialLinks.instagram || socialLinks.facebook || socialLinks.twitter) {
                const currentContact = data.contact_info || {};
                updates.contact_info = {
                    ...currentContact,
                    ...(socialLinks.instagram && { instagram: socialLinks.instagram }),
                    ...(socialLinks.facebook && { facebook: socialLinks.facebook }),
                    ...(socialLinks.twitter && { twitter: socialLinks.twitter })
                };
            }

            await adminDb.collection('restaurants').doc(job.restaurantId).update(updates);
            console.log('[RestaurantOrchestrator] Firecrawl data saved (with socials)');
        } catch (e) {
            console.warn('[RestaurantOrchestrator] Firecrawl failed (non-fatal):', e);
        }
    }

    private extractSocialLinks(links: string[]): { instagram?: string, facebook?: string, twitter?: string } {
        const result: { instagram?: string, facebook?: string, twitter?: string } = {};
        if (!links || !Array.isArray(links)) return result;

        // Simple Clean & Find
        const findLink = (domain: string) => links.find(l => l.includes(domain));

        result.instagram = findLink('instagram.com/');
        result.facebook = findLink('facebook.com/');
        result.twitter = findLink('twitter.com/') || findLink('x.com/');

        return result;
    }

    private async generateAIContent(job: RestaurantExtractionJob): Promise<void> {
        console.log('[RestaurantOrchestrator] Step 3: AI Generation');

        const doc = await adminDb.collection('restaurants').doc(job.restaurantId).get();
        const restaurant = doc.data();

        if (!restaurant) throw new Error('Restaurant data not found');

        const openaiClient = getOpenAIClient();
        if (!openaiClient) throw new Error('OpenAI Client not initialized');

        // Prepare input (copied mapping logic from generate-restaurant-content.ts)
        const input: RestaurantAIInput = {
            name: restaurant.name,
            address: restaurant.address,
            area: restaurant.area,
            place_data: {
                google_rating: restaurant.rating,
                price_level: restaurant.price_level
            },
            reviews: restaurant.apify_reviews || restaurant.reviews || [],
            menu_items: [],
            website_content: restaurant.website_text || '',
            apify_data: restaurant.apify_output || {},
            firecrawl_data: restaurant.firecrawl_output || {},
            menu_data: restaurant.menu_data || {},
            firecrawl_menu_data: restaurant.firecrawl_menu_data || {}
        };

        const aiContent = await openaiClient.generateRestaurantContent(input);

        // Update Firestore
        await adminDb.collection('restaurants').doc(job.restaurantId).update({
            description: aiContent.description,
            short_description: aiContent.short_description,
            seo_metadata: {
                meta_title: aiContent.meta_title,
                meta_description: aiContent.meta_description,
                generated_at: new Date().toISOString()
            },
            review_sentiment: aiContent.review_sentiment,
            faqs: aiContent.faqs,
            // Fallback to suggestions if current arrays are empty
            cuisines: restaurant.cuisines?.length ? restaurant.cuisines : aiContent.cuisine_suggestions.map(c => ({ name: c, slug: c.toLowerCase().replace(/\s+/g, '-') })),
            features: restaurant.features?.length ? restaurant.features : aiContent.feature_suggestions.map(f => ({ name: f, id: f.toLowerCase().replace(/\s+/g, '-') })),

            dishes: aiContent.dishes,
            popular_dishes: aiContent.popular_dishes,
            location_details: aiContent.location_details,
            operational: aiContent.operational,
            contact_info: { ...restaurant.contact_info, ...aiContent.contact_info },
            special_features: aiContent.special_features,

            // Flag as AI enhanced
            ai_enhanced: true,
            ai_enhanced_at: new Date().toISOString()
        });

        console.log('[RestaurantOrchestrator] AI Content saved');
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private async updateStatus(id: string, status: string) {
        await adminDb.collection('restaurants').doc(id).update({
            status: status
        });
    }

    private async runStep(id: string, stepName: string, fn: () => Promise<void>) {
        // Update progress
        const updateKey = `job_progress.${stepName}`;
        await adminDb.collection('restaurants').doc(id).update({
            [updateKey]: { status: 'running', started_at: new Date().toISOString() }
        });

        try {
            await fn();

            await adminDb.collection('restaurants').doc(id).update({
                [updateKey]: { status: 'completed', completed_at: new Date().toISOString() }
            });
        } catch (error: any) {
            await adminDb.collection('restaurants').doc(id).update({
                [updateKey]: { status: 'failed', error: error.message, failed_at: new Date().toISOString() }
            });
            throw error;
        }
    }

    private mapPriceLevel(priceStr: string): number {
        if (!priceStr) return 1;
        return priceStr.length; // "$$" -> 2
    }

    private findMenuLink(links: string[]): string | null {
        if (!links) return null;
        return links.find(l => l.includes('menu') || l.includes('food')) || null;
    }
}

// Singleton export
let _instance: ExtractionOrchestrator | null = null;
export function getExtractionOrchestrator() {
    if (!_instance) _instance = new ExtractionOrchestrator();
    return _instance;
}

export const extractionOrchestrator = new Proxy({} as ExtractionOrchestrator, {
    get(target, prop) {
        return (getExtractionOrchestrator() as any)[prop];
    }
});

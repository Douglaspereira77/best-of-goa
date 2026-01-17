
/**
 * Apify API Client
 *
 * Handles interactions with Apify actors for:
 * - Google Places Details extraction
 * - Google Reviews scraping
 * - Google Images downloading
 */

export interface ApifyRunResult {
    id: string;
    actId: string;
    status: string;
    defaultDatasetId?: string;
}

export class ApifyClient {
    private baseUrl: string;
    constructor() {
        this.baseUrl = process.env.APIFY_BASE_URL || 'https://api.apify.com/v2';
    }

    private get apiToken(): string {
        const token = process.env.APIFY_API_TOKEN;
        if (!token) {
            console.warn('APIFY_API_TOKEN is not configured');
        }
        return token || '';
    }

    /**
     * Run an Apify actor and wait for completion
     */
    async runActor(actorId: string, input: any, timeout = 300000): Promise<any> {
        if (!this.apiToken) throw new Error('Apify API Token missing');

        try {
            // Apify API uses tilde (~) instead of slash (/) in actor IDs
            const normalizedActorId = actorId.replace('/', '~');

            console.log(`[Apify] Starting actor: ${normalizedActorId}`);
            // console.log(`[Apify] Input:`, JSON.stringify(input, null, 2));

            const url = `${this.baseUrl}/acts/${normalizedActorId}/runs?token=${this.apiToken}`;

            // Start the actor run
            const runResponse = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input)
            });

            if (!runResponse.ok) {
                const error = await runResponse.text();
                console.error('[Apify] Actor start failed. Status:', runResponse.status);
                console.error('[Apify] Response body:', error);
                throw new Error(`Failed to start actor (${runResponse.status}): ${error}`);
            }

            const runData = await runResponse.json();

            // Apify API returns data in { data: { id, ... } } format
            const runId = runData.data?.id;

            if (!runId) {
                throw new Error('No run ID returned from Apify.');
            }

            console.log(`[Apify] Run started: ${runId}`);

            // Poll for completion
            const result = await this.waitForRun(normalizedActorId, runId, timeout);

            // Get dataset results
            if (result.defaultDatasetId) {
                return await this.getDatasetItems(result.defaultDatasetId);
            }

            return null;

        } catch (error) {
            console.error('[Apify] Actor run failed:', error);
            throw error;
        }
    }

    /**
     * Wait for actor run to complete
     */
    private async waitForRun(actorId: string, runId: string, timeout: number): Promise<any> {
        const startTime = Date.now();
        const pollInterval = 5000; // 5 seconds

        while (Date.now() - startTime < timeout) {
            const statusResponse = await fetch(
                `${this.baseUrl}/acts/${actorId}/runs/${runId}?token=${this.apiToken}`
            );

            if (!statusResponse.ok) {
                throw new Error('Failed to check run status');
            }

            const statusData = await statusResponse.json();
            const status = statusData.data?.status;

            // console.log(`[Apify] Run status: ${status}`);

            if (status === 'SUCCEEDED') {
                return statusData.data;
            }

            if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
                throw new Error(`Actor run ${status.toLowerCase()}`);
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

        throw new Error('Actor run timeout');
    }

    /**
     * Get items from dataset
     */
    private async getDatasetItems(datasetId: string): Promise<any[]> {
        try {
            const response = await fetch(
                `${this.baseUrl}/datasets/${datasetId}/items?token=${this.apiToken}&format=json`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch dataset items');
            }

            const items = await response.json();
            console.log(`[Apify] Retrieved ${items.length} items from dataset`);
            return items;

        } catch (error) {
            console.error('[Apify] Failed to get dataset items:', error);
            throw error;
        }
    }

    /**
     * Search and Extract Google Places details
     */
    async searchGooglePlaces(searchQuery: string, maxPlaces = 5): Promise<any[]> {
        const actorId = process.env.APIFY_GOOGLE_PLACES_ACTOR_ID || 'compass/crawler-google-places';

        const input = {
            searchStringsArray: [searchQuery], // Updated parameter name per user feedback
            maxCrawledPlaces: maxPlaces,
            language: 'en',
            maxReviews: 5,
            maxImages: 5
        };

        console.log(`[Apify] Searching Google Places: "${searchQuery}" (Max: ${maxPlaces})`);

        const results = await this.runActor(actorId, input);
        return results || [];
    }
}

// Singleton
// Singleton logic
let _instance: ApifyClient | null = null;
export function getApifyClient(): ApifyClient {
    if (!_instance) _instance = new ApifyClient();
    return _instance;
}

export const apifyClient = new Proxy({} as ApifyClient, {
    get(target, prop) {
        return (getApifyClient() as any)[prop];
    }
});

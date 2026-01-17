/**
 * Social Media Search Service
 *
 * Multi-stage social media discovery:
 * Stage 1: Website-based extraction
 * Stage 2: Firecrawl Search with optimized queries
 * Stage 3: Google Maps/TripAdvisor parsing
 * Stage 4: Web search fallback
 */

export interface FirecrawlSearchItem {
    url: string;
    title?: string;
    description?: string;
}

export interface SocialMediaResult {
    handle?: string;
    url?: string;
    found: boolean;
    source: 'website' | 'firecrawl_search' | 'google_maps' | 'web_search' | 'none';
    confidence?: number;
}

export interface SocialMediaSearchResults {
    instagram: SocialMediaResult;
    facebook: SocialMediaResult;
    tiktok: SocialMediaResult;
    twitter: SocialMediaResult;
    youtube: SocialMediaResult;
    linkedin: SocialMediaResult;
    snapchat: SocialMediaResult;
    whatsapp?: SocialMediaResult;
    timestamp: string;
    searchQuery?: string;
}

export class SocialMediaSearchService {
    private apiKey: string;
    private readonly FIRECRAWL_BASE_URL_V2 = 'https://api.firecrawl.dev/v2';

    constructor() {
        const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
        if (!FIRECRAWL_API_KEY) {
            throw new Error('FIRECRAWL_API_KEY is not configured');
        }
        this.apiKey = FIRECRAWL_API_KEY;
    }

    private extractHandle(url: string, platform: string): string | null {
        try {
            const patterns: Record<string, RegExp> = {
                instagram: /instagram\.com\/([^\/?#&]+)/i,
                facebook: /facebook\.com\/([^\/?#&]+)/i,
                tiktok: /tiktok\.com\/@?([^\/?#&]+)/i,
                twitter: /(?:twitter\.com|x\.com)\/([^\/?#&]+)/i,
                youtube: /youtube\.com\/@?([^\/?#&]+)|youtube\.com\/c\/([^\/?#&]+)/i,
                linkedin: /linkedin\.com\/(company|in)\/([^\/?#&]+)/i,
                snapchat: /snapchat\.com\/add\/([^\/?#&]+)/i,
            };

            const pattern = patterns[platform.toLowerCase()];
            if (!pattern) return null;

            const match = url.match(pattern);
            return match ? (match[1] || match[2] || null) : null;
        } catch (error) {
            console.error(`Error extracting ${platform} handle:`, error);
            return null;
        }
    }

    private isValidSocialMediaUrl(url: string, platform: string, entityName: string): boolean {
        const platformDomains: Record<string, string> = {
            instagram: 'instagram.com',
            facebook: 'facebook.com',
            tiktok: 'tiktok.com',
            twitter: 'twitter.com',
            youtube: 'youtube.com',
            linkedin: 'linkedin.com',
            snapchat: 'snapchat.com'
        };

        const domain = platformDomains[platform.toLowerCase()];
        if (!domain || !url.includes(domain)) return false;

        const urlLower = url.toLowerCase();
        if (platform === 'instagram') {
            if (['/p/', '/reel/', '/explore/', '/stories/'].some(p => urlLower.includes(p))) return false;
        }
        if (platform === 'tiktok') {
            if (['/discover/', '/search/', '/tag/', '/video/'].some(p => urlLower.includes(p))) return false;
        }

        const nameWords = entityName.toLowerCase().split(/\s+/).filter(word =>
            !['the', 'a', 'an', 'hotel', 'restaurant', 'cafe', 'goa'].includes(word)
        );

        return nameWords.some(word => word.length >= 3 && urlLower.includes(word)) || nameWords.length === 0;
    }

    private emptyResult(): SocialMediaResult {
        return { found: false, source: 'none' };
    }

    async extractFromWebsiteOrMaps(entityName: string, websiteUrl?: string, googleMapsUrl?: string): Promise<Partial<Record<string, SocialMediaResult>>> {
        const found: Partial<Record<string, SocialMediaResult>> = {};

        if (websiteUrl) {
            try {
                const response = await fetch(`${this.FIRECRAWL_BASE_URL_V2}/scrape`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: websiteUrl, formats: ['markdown'], onlyMainContent: false, waitFor: 2000 })
                });

                if (response.ok) {
                    const result = await response.json();
                    const socialLinks = this.extractSocialLinksFromMarkdown(result.data?.markdown || '');
                    for (const [platform, data] of Object.entries(socialLinks)) {
                        found[platform] = { ...data, source: 'website', confidence: 95 };
                    }
                }
            } catch (error) { console.error('[SocialMediaSearch] Website scrape error:', error); }
        }

        return found;
    }

    private extractSocialLinksFromMarkdown(markdown: string): Partial<Record<string, { handle?: string; url: string; found: boolean }>> {
        const links: Partial<Record<string, { handle?: string; url: string; found: boolean }>> = {};
        const patterns = [
            { platform: 'instagram', regex: /instagram\.com\/([^\s\/?#"']+)/gi },
            { platform: 'facebook', regex: /facebook\.com\/([^\s\/?#"']+)/gi },
            { platform: 'tiktok', regex: /tiktok\.com\/@?([^\s\/?#"']+)/gi },
            { platform: 'twitter', regex: /(?:twitter\.com|x\.com)\/([^\s\/?#"']+)/gi },
            { platform: 'youtube', regex: /youtube\.com\/(?:@|c\/|channel\/)([^\s\/?#"']+)/gi },
        ];

        for (const { platform, regex } of patterns) {
            const matches = [...markdown.matchAll(regex)];
            if (matches.length > 0) {
                const url = matches[0][0].startsWith('http') ? matches[0][0] : `https://${matches[0][0]}`;
                links[platform] = { handle: this.extractHandle(url, platform) || undefined, url, found: true };
            }
        }
        return links;
    }

    async searchAllPlatforms(entityName: string, location: string, websiteUrl?: string, googleMapsUrl?: string): Promise<SocialMediaSearchResults> {
        const results: SocialMediaSearchResults = {
            instagram: this.emptyResult(), facebook: this.emptyResult(), tiktok: this.emptyResult(),
            twitter: this.emptyResult(), youtube: this.emptyResult(), linkedin: this.emptyResult(),
            snapchat: this.emptyResult(), timestamp: new Date().toISOString(), searchQuery: entityName
        };

        const foundFromEntry = await this.extractFromWebsiteOrMaps(entityName, websiteUrl, googleMapsUrl);
        for (const [platform, data] of Object.entries(foundFromEntry)) {
            if (data && data.found) results[platform as keyof SocialMediaSearchResults] = data;
        }

        const platforms = ['instagram', 'facebook', 'tiktok'];
        for (const platform of platforms) {
            if (!results[platform as keyof SocialMediaSearchResults].found) {
                const result = await this.searchSinglePlatform(entityName, location, platform);
                if (result) results[platform as keyof SocialMediaSearchResults] = result;
            }
        }

        return results;
    }

    private async searchSinglePlatform(entityName: string, location: string, platform: string): Promise<SocialMediaResult | null> {
        const query = `"${entityName}" ${platform} ${location}`;
        const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

        try {
            const response = await fetch(`${this.FIRECRAWL_BASE_URL_V2}/scrape`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: googleSearchUrl, formats: ['markdown'], waitFor: 3000, onlyMainContent: false })
            });

            if (!response.ok) return null;

            const result = await response.json();
            const markdown = result.data?.markdown || '';
            const urlPattern = /https?:\/\/[^\s\)]+/g;
            const urls = markdown.match(urlPattern) || [];

            for (const url of urls) {
                const cleanUrl = url.replace(/[,;.!?]$/, '');
                if (this.isValidSocialMediaUrl(cleanUrl, platform, entityName)) {
                    return { handle: this.extractHandle(cleanUrl, platform) || undefined, url: cleanUrl, found: true, source: 'web_search', confidence: 80 };
                }
            }
        } catch (error) { console.error(`[SocialMediaSearch] Search error for ${platform}:`, error); }
        return null;
    }
}

let _socialMediaSearchServiceInstance: SocialMediaSearchService | null = null;

export function getSocialMediaSearchService(): SocialMediaSearchService {
    if (!_socialMediaSearchServiceInstance) {
        _socialMediaSearchServiceInstance = new SocialMediaSearchService();
    }
    return _socialMediaSearchServiceInstance;
}

export const socialMediaSearchService = new Proxy({} as SocialMediaSearchService, {
    get(target, prop) {
        return (getSocialMediaSearchService() as any)[prop];
    }
});

/**
 * Attraction Image Extractor
 *
 * Uses OpenAI Vision API for AI-powered image analysis and metadata generation
 * Refactored for Firebase Admin SDK and Firebase Storage.
 */

import { adminDb, adminStorage } from '@/lib/firebase/admin';
import OpenAI from 'openai';
import axios from 'axios';

// Timeout constants
const DOWNLOAD_TIMEOUT = 30000;
const VISION_API_TIMEOUT = 45000;
const UPLOAD_TIMEOUT = 30000;

interface VisionAnalysisResult {
    alt: string;
    title: string;
    description: string;
    contentDescriptor: string;
    contentClassification: string[];
    heroScore: number;
    heroReason: string;
    isAbstractArt: boolean;
    showsActualAttraction: boolean;
}

/**
 * Timeout wrapper utility
 */
function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    operationName: string
): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(
                () => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)),
                timeoutMs
            )
        ),
    ]);
}

export class AttractionImageExtractor {
    private _openai: OpenAI | null = null;
    private _googlePlacesApiKey: string | null = null;

    constructor() { }

    private get openai(): OpenAI {
        if (!this._openai) {
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
            this._openai = new OpenAI({ apiKey });
        }
        return this._openai;
    }

    private get googlePlacesApiKey(): string {
        if (!this._googlePlacesApiKey) {
            const apiKey = process.env.GOOGLE_PLACES_API_KEY;
            if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY is not configured');
            this._googlePlacesApiKey = apiKey;
        }
        return this._googlePlacesApiKey;
    }

    /**
     * Main method: Extract and upload attraction images with AI analysis
     */
    async extractAndUploadAttractionImages(attractionId: string): Promise<void> {
        console.log('[AttractionImageExtractor] Starting AI-powered attraction image extraction');

        if (!adminDb || !adminStorage) {
            throw new Error('Firebase Admin not initialized');
        }

        try {
            // 1. Get attraction data
            const attractionRef = adminDb.collection('attractions').doc(attractionId);
            const attractionDoc = await attractionRef.get();

            if (!attractionDoc.exists) {
                throw new Error('Attraction not found');
            }

            const attraction = attractionDoc.data()!;

            if (!attraction.google_place_id) {
                console.log('[AttractionImageExtractor] No Google Place ID found for attraction');
                return;
            }

            // 2. Fetch images from Google Places API
            console.log('[AttractionImageExtractor] Fetching images from Google Places API');
            const googleImages = await this.fetchGooglePlacesImages(attraction, 10);

            if (googleImages.length === 0) {
                console.log('[AttractionImageExtractor] No images found from Google Places');
                return;
            }

            console.log(`[AttractionImageExtractor] Found ${googleImages.length} images to process with Vision API`);

            // 3. Process images
            const processedImages: any[] = [];

            for (let i = 0; i < googleImages.length; i++) {
                const img = googleImages[i];
                console.log(`[AttractionImageExtractor] Processing image ${i + 1}/${googleImages.length}`);

                try {
                    const imageBuffer = await withTimeout(
                        this.downloadImage(img.url),
                        DOWNLOAD_TIMEOUT,
                        `Image download ${i + 1}`
                    );

                    const analysis = await withTimeout(
                        this.analyzeImageWithVision(imageBuffer, attraction),
                        VISION_API_TIMEOUT,
                        `Vision API analysis ${i + 1}`
                    );

                    const filename = this.generateSEOFilename(attraction, analysis.contentDescriptor, i);

                    const uploadResult = await withTimeout(
                        this.uploadToFirebase(imageBuffer, filename, attraction.slug || 'unknown'),
                        UPLOAD_TIMEOUT,
                        `Firebase upload ${i + 1}`
                    );

                    processedImages.push({
                        url: uploadResult.url,
                        filename: uploadResult.filename,
                        path: uploadResult.path,
                        alt_text: analysis.alt,
                        title: analysis.title,
                        description: analysis.description,
                        width: img.width,
                        height: img.height,
                        source: 'google_places',
                        type: analysis.contentClassification[0] || 'other',
                        content_classification: analysis.contentClassification,
                        hero_score: analysis.heroScore,
                        hero_reason: analysis.heroReason,
                        is_abstract_art: analysis.isAbstractArt,
                        shows_actual_attraction: analysis.showsActualAttraction,
                        display_order: i + 1,
                        is_hero: false
                    });

                    console.log(`[AttractionImageExtractor] ✅ Processed image ${i + 1}/${googleImages.length}`);

                } catch (imgError) {
                    console.error(`[AttractionImageExtractor] ❌ Failed to process image ${i + 1}:`, imgError);
                }
            }

            // 4. Select hero image
            if (processedImages.length > 0) {
                const suitableHeroes = processedImages.filter(img =>
                    img.hero_score >= 50 && !img.is_abstract_art && img.shows_actual_attraction
                );

                if (suitableHeroes.length > 0) {
                    suitableHeroes.sort((a, b) => b.hero_score - a.hero_score);
                    const heroIndex = processedImages.findIndex(img => img.url === suitableHeroes[0].url);
                    processedImages[heroIndex].is_hero = true;
                    console.log(`[AttractionImageExtractor] Hero selected: ${suitableHeroes[0].filename} (Score: ${suitableHeroes[0].hero_score})`);
                } else {
                    processedImages[0].is_hero = true;
                }

                // 5. Store in database
                await this.storeImagesInDatabase(attractionId, processedImages);

                // 6. Update attraction with hero image
                const heroImage = processedImages.find(img => img.is_hero);
                if (heroImage) {
                    await attractionRef.update({ hero_image: heroImage.url });
                }
            }

        } catch (error) {
            console.error('[AttractionImageExtractor] Image extraction failed:', error);
            throw error;
        }
    }

    private async analyzeImageWithVision(imageBuffer: Buffer, attraction: any): Promise<VisionAnalysisResult> {
        const base64Image = imageBuffer.toString('base64');

        const prompt = `Analyze this attraction image for "${attraction.name}" in Goa. Provide JSON:
    {
      "alt": "Accessible alt text",
      "title": "Short descriptive title",
      "description": "2-3 sentences about what's shown",
      "contentDescriptor": "3-6 words specific unique descriptor",
      "contentClassification": ["tag1", "tag2"],
      "heroScore": 0-100,
      "heroReason": "Why this score",
      "isAbstractArt": boolean,
      "showsActualAttraction": boolean
    }`;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
                    ],
                },
            ],
        });

        const content = response.choices[0].message.content || '{}';
        const jsonMatch = content.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            return this.getDefaultVisionResult(attraction);
        }

        try {
            const result = JSON.parse(jsonMatch[0]);
            return {
                alt: result.alt || `Image of ${attraction.name}`,
                title: result.title || attraction.name,
                description: result.description || `A view of ${attraction.name} in Goa.`,
                contentDescriptor: result.contentDescriptor || 'attraction view',
                contentClassification: result.contentClassification || ['general'],
                heroScore: result.heroScore || 0,
                heroReason: result.heroReason || 'No reason provided',
                isAbstractArt: !!result.isAbstractArt,
                showsActualAttraction: result.showsActualAttraction !== false
            };
        } catch (e) {
            console.error('[AttractionImageExtractor] Failed to parse Vision JSON:', e);
            return this.getDefaultVisionResult(attraction);
        }
    }

    private getDefaultVisionResult(attraction: any): VisionAnalysisResult {
        return {
            alt: `Image of ${attraction.name}`,
            title: attraction.name,
            description: `A view of ${attraction.name}, an attraction in Goa.`,
            contentDescriptor: 'attraction view',
            contentClassification: ['general'],
            heroScore: 0,
            heroReason: 'Failed to analyze',
            isAbstractArt: false,
            showsActualAttraction: true
        };
    }

    private async fetchGooglePlacesImages(attraction: any, maxImages: number): Promise<any[]> {
        if (!this.googlePlacesApiKey) return [];
        try {
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${attraction.google_place_id}&fields=photos&key=${this.googlePlacesApiKey}`;
            const response = await axios.get(detailsUrl);
            const photos = response.data.result?.photos?.slice(0, maxImages) || [];

            return photos.map((p: any) => ({
                url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photo_reference=${p.photo_reference}&key=${this.googlePlacesApiKey}`,
                width: p.width || 1600,
                height: p.height || 1200
            }));
        } catch (error) {
            console.error('[AttractionImageExtractor] Google Places API error:', error);
            return [];
        }
    }

    private async downloadImage(url: string): Promise<Buffer> {
        const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
        return Buffer.from(response.data);
    }

    private generateSEOFilename(attraction: any, descriptor: string, index: number): string {
        const base = (attraction.slug || attraction.name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const desc = descriptor.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return `${base}-${desc}-${index}.jpg`;
    }

    private async uploadToFirebase(buffer: Buffer, filename: string, slug: string): Promise<any> {
        const bucket = adminStorage!.bucket();
        const path = `attractions/${slug}/images/${filename}`;
        const file = bucket.file(path);

        await file.save(buffer, { metadata: { contentType: 'image/jpeg' } });
        await file.makePublic();

        const url = `https://storage.googleapis.com/${bucket.name}/${path}`;
        return { url, filename, path };
    }

    private async storeImagesInDatabase(attractionId: string, images: any[]): Promise<void> {
        const batch = adminDb!.batch();
        for (const img of images) {
            const docRef = adminDb!.collection('attraction_images').doc();
            batch.set(docRef, {
                attraction_id: attractionId,
                url: img.url,
                alt_text: img.alt_text,
                type: img.type,
                is_hero: img.is_hero,
                display_order: img.display_order,
                metadata: {
                    title: img.title,
                    description: img.description,
                    hero_score: img.hero_score,
                    hero_reason: img.hero_reason
                },
                created_at: new Date().toISOString()
            });
        }
        await batch.commit();
        console.log(`[AttractionImageExtractor] Stored ${images.length} image records in Firestore`);
    }
}

let _instance: AttractionImageExtractor | null = null;
export function getAttractionImageExtractor() {
    if (!_instance) _instance = new AttractionImageExtractor();
    return _instance;
}

export const attractionImageExtractor = new Proxy({} as AttractionImageExtractor, {
    get(target, prop) {
        return (getAttractionImageExtractor() as any)[prop];
    }
});

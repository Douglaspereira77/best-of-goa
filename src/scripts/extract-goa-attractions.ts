/**
 * Goa Attraction Extraction Script
 *
 * Initiates the extraction process for Goa attractions using the migrated orchestrator.
 * Refactored for Firebase Admin SDK.
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { adminDb } from '@/lib/firebase/admin';
import { attractionExtractionOrchestrator } from '@/lib/services/attraction-extraction-orchestrator';
import axios from 'axios';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const DELAY_MS = 3000;

interface AttractionSeed {
    name: string;
    searchQuery: string;
}

const SAMPLE_ATTRACTIONS: AttractionSeed[] = [
    { name: 'Fort Aguada', searchQuery: 'Fort Aguada, Candolim, Goa' },
    { name: 'Basilica of Bom Jesus', searchQuery: 'Basilica of Bom Jesus, Old Goa, Goa' },
    { name: 'Dudhsagar Falls', searchQuery: 'Dudhsagar Falls, Sanguem, Goa' }
];

/**
 * Search for Google Place ID
 */
async function searchPlaceId(query: string): Promise<string | null> {
    try {
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;
        const response = await axios.get(url);
        if (response.data.status === 'OK' && response.data.results.length > 0) {
            return response.data.results[0].place_id;
        }
        return null;
    } catch (error) {
        console.error(`[Script] Error searching Place ID for "${query}":`, error);
        return null;
    }
}

/**
 * Create or Update Attraction Record in Firestore
 */
async function getOrCreateAttraction(seed: AttractionSeed, placeId: string): Promise<string> {
    const slug = seed.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    // Check if exists by slug
    const snapshot = await adminDb!.collection('attractions').where('slug', '==', slug).get();

    if (!snapshot.empty) {
        const docId = snapshot.docs[0].id;
        await adminDb!.collection('attractions').doc(docId).update({
            google_place_id: placeId,
            extraction_status: 'pending'
        });
        return docId;
    }

    // Create new
    const docRef = await adminDb!.collection('attractions').add({
        name: seed.name,
        slug: slug,
        google_place_id: placeId,
        extraction_status: 'pending',
        extraction_source: 'manual_seed',
        active: false,
        verified: false,
        created_at: new Date().toISOString()
    });

    return docRef.id;
}

const FULL_DISCOVERY_LOCATIONS = [
    'Panjim', 'Old Goa', 'Calangute', 'Candolim', 'Baga', 'Anjuna', 'Vagator',
    'Mapusa', 'Margao', 'Colva', 'Benaulim', 'Palolem', 'Vasco da Gama', 'Ponda'
];

/**
 * Discover and Extract Attractions from a Location
 */
async function discoverAndExtract(location: string, limit: number = 20) {
    console.log(`\n>>> Discovering attractions in: ${location}`);
    const query = `Top attractions in ${location}, Goa`;

    // Use Apify to find places
    // We instantiate ApifyClient directly here to use its search capability
    const { apifyClient } = require('@/lib/services/apify-client');
    const results = await apifyClient.searchGooglePlaces(query, limit);

    console.log(`[Script] Found ${results.length} places for ${location}`);

    for (const place of results) {
        if (!place.placeId) continue;

        console.log(`\n> Processing discovered: ${place.title} (${place.placeId})`);

        const seed: AttractionSeed = {
            name: place.title,
            searchQuery: `${place.title}, ${location}, Goa`
        };

        const attractionId = await getOrCreateAttraction(seed, place.placeId);
        console.log(`[Script] Firestore ID: ${attractionId}`);

        try {
            await attractionExtractionOrchestrator.executeExtraction({
                attractionId,
                placeId: place.placeId,
                searchQuery: seed.searchQuery
            });
            console.log(`[Script] ✅ Successfully extracted: ${place.title}`);
        } catch (error) {
            console.error(`[Script] ❌ Failed extraction for ${place.title}:`, error);
        }

        // Delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
}

async function main() {
    console.log('=== GOA ATTRACTION EXTRACTION START ===\n');

    if (!GOOGLE_PLACES_API_KEY) {
        console.error('Error: GOOGLE_PLACES_API_KEY is missing');
        process.exit(1);
    }

    const args = process.argv.slice(2);
    const isFullRun = args.includes('--full');

    // Parse limit argument (e.g. --limit 10)
    let limit = 20;
    const limitIndex = args.indexOf('--limit');
    if (limitIndex !== -1 && args[limitIndex + 1]) {
        const parsed = parseInt(args[limitIndex + 1], 10);
        if (!isNaN(parsed)) limit = parsed;
    }

    // Parse location argument (e.g. --location "Anjuna")
    const locationIndex = args.indexOf('--location');
    const targetLocation = locationIndex !== -1 ? args[locationIndex + 1] : null;

    if (isFullRun || targetLocation) {
        let locationsToRun = FULL_DISCOVERY_LOCATIONS;

        if (targetLocation) {
            locationsToRun = [targetLocation];
            console.log(`!!! RUNNING SINGLE LOCATION MODE: ${targetLocation} (Limit: ${limit}) !!!`);
        } else {
            console.log(`!!! RUNNING FULL DISCOVERY MODE (Limit: ${limit} per location) !!!`);
        }

        for (const loc of locationsToRun) {
            await discoverAndExtract(loc, limit);
        }
    } else {
        console.log('--- Running Sample Mode (Use --full for all areas) ---');
        for (const seed of SAMPLE_ATTRACTIONS) {
            console.log(`\n>>> Processing: ${seed.name}`);
            const placeId = await searchPlaceId(seed.searchQuery);
            if (!placeId) { console.error(`!!! Failed to find Place ID for ${seed.name}`); continue; }

            const attractionId = await getOrCreateAttraction(seed, placeId);
            try {
                await attractionExtractionOrchestrator.executeExtraction({
                    attractionId,
                    placeId,
                    searchQuery: seed.searchQuery
                });
                console.log(`[Script] ✅ Successfully extracted: ${seed.name}`);
            } catch (error) {
                console.error(`[Script] ❌ Failed extraction for ${seed.name}:`, error);
            }
            await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }
    }

    console.log('\n=== GOA ATTRACTION EXTRACTION COMPLETE ===');
}

main().catch(err => {
    console.error('[Script] Fatal Error:', err);
    process.exit(1);
});

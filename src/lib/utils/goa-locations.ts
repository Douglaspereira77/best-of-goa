/**
 * Goa Location Utilities
 *
 * Mapping of Goa areas to Districts (North/South) for address schema enhancement
 */

/**
 * Goa's 2 Districts
 */
export const GOA_DISTRICTS = {
    NORTH_GOA: 'North Goa',
    SOUTH_GOA: 'South Goa',
} as const;

/**
 * Comprehensive area to district mapping
 */
export const AREA_TO_DISTRICT: Record<string, string> = {
    // ============================================================================
    // NORTH GOA
    // ============================================================================
    'Panjim': GOA_DISTRICTS.NORTH_GOA,
    'Panaji': GOA_DISTRICTS.NORTH_GOA,
    'Candolim': GOA_DISTRICTS.NORTH_GOA,
    'Calangute': GOA_DISTRICTS.NORTH_GOA,
    'Baga': GOA_DISTRICTS.NORTH_GOA,
    'Anjuna': GOA_DISTRICTS.NORTH_GOA,
    'Vagator': GOA_DISTRICTS.NORTH_GOA,
    'Siolim': GOA_DISTRICTS.NORTH_GOA,
    'Morjim': GOA_DISTRICTS.NORTH_GOA,
    'Ashwem': GOA_DISTRICTS.NORTH_GOA,
    'Mandrem': GOA_DISTRICTS.NORTH_GOA,
    'Arambol': GOA_DISTRICTS.NORTH_GOA,
    'Mapusa': GOA_DISTRICTS.NORTH_GOA,
    'Porvorim': GOA_DISTRICTS.NORTH_GOA,
    'Old Goa': GOA_DISTRICTS.NORTH_GOA,
    'Miramar': GOA_DISTRICTS.NORTH_GOA,
    'Dona Paula': GOA_DISTRICTS.NORTH_GOA,
    'Nerul': GOA_DISTRICTS.NORTH_GOA,
    'Sinquerim': GOA_DISTRICTS.NORTH_GOA,
    'Saligao': GOA_DISTRICTS.NORTH_GOA,
    'Assagao': GOA_DISTRICTS.NORTH_GOA,

    // ============================================================================
    // SOUTH GOA
    // ============================================================================
    'Margao': GOA_DISTRICTS.SOUTH_GOA,
    'Madgaon': GOA_DISTRICTS.SOUTH_GOA,
    'Vasco': GOA_DISTRICTS.SOUTH_GOA,
    'Vasco da Gama': GOA_DISTRICTS.SOUTH_GOA,
    'Colva': GOA_DISTRICTS.SOUTH_GOA,
    'Benaulim': GOA_DISTRICTS.SOUTH_GOA,
    'Varca': GOA_DISTRICTS.SOUTH_GOA,
    'Cavelossim': GOA_DISTRICTS.SOUTH_GOA,
    'Mobor': GOA_DISTRICTS.SOUTH_GOA,
    'Agonda': GOA_DISTRICTS.SOUTH_GOA,
    'Palolem': GOA_DISTRICTS.SOUTH_GOA,
    'Patnem': GOA_DISTRICTS.SOUTH_GOA,
    'Majorda': GOA_DISTRICTS.SOUTH_GOA,
    'Utorda': GOA_DISTRICTS.SOUTH_GOA,
    'Bogmalo': GOA_DISTRICTS.SOUTH_GOA,
    'Canacona': GOA_DISTRICTS.SOUTH_GOA,
    'Quepem': GOA_DISTRICTS.SOUTH_GOA,
    'Ponda': GOA_DISTRICTS.SOUTH_GOA, // Often argued, but administratively South
};

/**
 * Get district from area name
 *
 * @param area - Area/neighborhood name (e.g., "Calangute", "Panjim")
 * @returns District name or 'Goa' if not found
 */
export function getDistrictFromArea(area: string): string {
    if (!area) return 'Goa';

    // Direct lookup
    const district = AREA_TO_DISTRICT[area];
    if (district) return district;

    // Try case-insensitive lookup
    const areaLower = area.toLowerCase();
    const match = Object.keys(AREA_TO_DISTRICT).find(
        (key) => key.toLowerCase() === areaLower
    );

    return match ? AREA_TO_DISTRICT[match] : 'Goa';
}

/**
 * Get all areas for a specific district
 */
export function getAreasByDistrict(district: string): string[] {
    return Object.entries(AREA_TO_DISTRICT)
        .filter(([_, dist]) => dist === district)
        .map(([area]) => area);
}

/**
 * Validate if an area exists in Goa mapping
 */
export function isValidGoaArea(area: string): boolean {
    return getDistrictFromArea(area) !== 'Goa';
}

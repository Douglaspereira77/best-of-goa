/**
 * AI Input/Output Types for Content Generation
 */

export interface RestaurantAIInput {
    name: string;
    address?: string;
    area?: string;
    place_data?: any;
    reviews?: any[];
    menu_items?: any[];
    website_content?: string;
    tripadvisor_data?: any;
    apify_data?: any;
    firecrawl_data?: any;
    firecrawl_menu_data?: any;
    menu_data?: any;
    review_analysis?: any; // Added for Phase 4
}

export interface AttractionAIInput {
    name: string;
    address?: string;
    area?: string;
    attraction_type?: string;
    google_rating?: number;
    google_review_count?: number;
    website?: string;
    apify_data?: any;
    firecrawl_data?: any;
}

export interface RestaurantAIOutput {
    description: string;
    short_description: string;
    meta_title: string;
    meta_description: string;
    review_sentiment: string;
    faqs: Array<{
        question: string;
        answer: string;
        category: string;
        relevance_score: number;
        source?: string;
    }>;
    cuisine_suggestions: string[];
    category_suggestions: string[];
    feature_suggestions: string[];
    meal_suggestions: string[];
    good_for_suggestions: string[];
    neighborhood_suggestion: string | null;
    michelin_award_suggestion: string | null;
    popular_dishes: string[];
    dishes: Array<{
        name: string;
        description: string;
        price: string;
        category: string;
    }>;
    location_details: {
        mall_name: string | null;
        mall_floor: string | null;
        mall_gate: string | null;
        nearby_landmarks: string[];
    };
    contact_info: {
        email: string | null;
        website: string | null;
        instagram: string | null;
        facebook: string | null;
        twitter: string | null;
    };
    pricing: {
        average_meal_price: number;
    };
    operational: {
        dress_code: string;
        reservations_policy: string;
        parking_info: string | null;
        public_transport: string[];
        average_visit_time_mins: number;
        payment_methods: string[];
    };
    seo_keywords: string[];
    special_features: {
        secret_menu_items: Array<{ name: string; description: string }>;
        staff_picks: Array<{ name: string; description: string }>;
        kids_promotions: string | null;
        awards: Array<{ name: string; year: number; organization: string }>;
    };
}

export interface AttractionAIOutput {
    description: string;
    short_description: string;
    meta_title: string;
    meta_description: string;
    meta_keywords: string[];
    og_title: string;
    og_description: string;
    attraction_type: string;
    typical_visit_duration: string;
    age_suitability: string;
    best_time_to_visit: string;
    historical_significance?: string;
    suggested_categories: string[];
    suggested_amenities: string[];
    suggested_features: string[];
    fun_facts: string[];
    faqs: Array<{
        question: string;
        answer: string;
        category: string;
    }>;
}

export interface ReferenceData {
    cuisines: Array<{ id: number; name: string; slug: string }>;
    categories: Array<{ id: number; name: string; slug: string }>;
    features: Array<{ id: number; name: string; slug: string; category: string }>;
    meals: Array<{ id: number; name: string; slug: string }>;
    good_for: Array<{ id: number; name: string; slug: string }>;
    neighborhoods: Array<{ id: number; name: string; slug: string }>;
    michelin_awards: Array<{ id: number; name: string; stars: number }>;
}

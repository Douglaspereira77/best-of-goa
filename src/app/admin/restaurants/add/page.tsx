'use client'

import { useState, useRef, useEffect } from 'react'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { ThreeColumnLayout } from '@/components/admin/layout/ThreeColumnLayout'
import { ProgressSidebar, StepStatus } from '@/components/admin/layout/ProgressSidebar'
import { SearchContext } from '@/components/admin/add/SearchContext'
import { ExtractedDataView } from '@/components/admin/add/ExtractedDataView'
import { MenuView } from '@/components/admin/add/MenuView'
import { DuplicateWarning } from '@/components/admin/shared/DuplicateWarning'

type PlaceResult = {
  place_id: string
  name: string
  formatted_address: string
  rating: number | null
  user_ratings_total: number
  price_level: number | null
  photos: Array<{ url: string }>
  geometry: {
    location: {
      lat: number | null
      lng: number | null
    }
  }
}

type ExtractionStep = {
  name: string
  displayName: string
  status: StepStatus
  startedAt?: string
  completedAt?: string
  error?: string
  progress?: {
    current: number
    total: number
    cost: number
  }
}

type RestaurantData = {
  placeId?: string
  name?: string
  name_ar?: string
  slug?: string
  cuisine?: string
  address?: string
  neighborhood?: string
  phone?: string
  coordinates?: string
  priceLevel?: number
  website?: string
  instagram?: string
  facebook?: string
  rating?: number
  reviewCount?: number
  hours?: string
  photos?: Array<{ url: string; alt?: string }>
  [key: string]: any  // Allow additional database fields
}

type Category = {
  name: string
  type: 'cuisine' | 'feature'
}

interface MenuItem {
  id?: string
  name: string
  description?: string
  price?: string
  mentions: number
  category: 'popular' | 'main' | 'side' | 'appetizer' | 'dessert' | 'beverage'
  is_popular?: boolean
  confidence_score?: number
  source?: string
}

interface MenuSection {
  name: string
  dishes: MenuItem[]
  display_order?: number
}

interface MenuMetadata {
  source?: string
  last_updated?: string
  total_dishes?: number
  popular_dishes?: number
  sections?: number
}

export default function AddRestaurantPage() {
  // Hydration state
  const [isHydrated, setIsHydrated] = useState(false)

  // Search state
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<PlaceResult | null>(null)

  // Extraction state
  const [isExtracting, setIsExtracting] = useState(false)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [extractionSteps, setExtractionSteps] = useState<ExtractionStep[]>([
    { name: 'initial_creation', displayName: 'Initial Creation', status: 'pending' },
    { name: 'apify_fetch', displayName: 'Google Places Data', status: 'pending' },
    { name: 'firecrawl_general', displayName: 'General Info Search', status: 'pending' },
    { name: 'firecrawl_menu', displayName: 'Menu Search', status: 'pending' },
    { name: 'firecrawl_website', displayName: 'Website Scraping', status: 'pending' },
    { name: 'firecrawl_social_media_search', displayName: 'Social Media Search', status: 'pending' },
    { name: 'apify_reviews', displayName: 'Reviews Extraction', status: 'pending' },
    { name: 'firecrawl_tripadvisor', displayName: 'TripAdvisor Search', status: 'pending' },
    { name: 'firecrawl_opentable', displayName: 'OpenTable Search', status: 'pending' },
    { name: 'process_images', displayName: 'Processing Images', status: 'pending', progress: { current: 0, total: 10, cost: 0 } },
    { name: 'ai_sentiment', displayName: 'AI Sentiment Analysis', status: 'pending' },
    { name: 'ai_enhancement', displayName: 'AI Content Enhancement', status: 'pending' },
    { name: 'data_mapping', displayName: 'Database Mapping', status: 'pending' },
  ])
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)
  const pollingStartTime = useRef<number | null>(null)
  const MAX_POLLING_DURATION = 10 * 60 * 1000 // 10 minutes

  // Restaurant data state
  const [restaurantData, setRestaurantData] = useState<RestaurantData>({})
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [menuSections, setMenuSections] = useState<MenuSection[]>([])
  const [menuMetadata, setMenuMetadata] = useState<MenuMetadata | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  // Relationship display fields (for UI display only)
  const [cuisines, setCuisines] = useState<string>('')
  const [features, setFeatures] = useState<string>('')
  const [meals, setMeals] = useState<string>('')
  const [goodFor, setGoodFor] = useState<string>('')
  const [neighborhood, setNeighborhood] = useState<string>('')
  const [michelinAward, setMichelinAward] = useState<string>('')
  const [categoriesNames, setCategoriesNames] = useState<string>('')

  // Counts for extraction report
  const [dishesCount, setDishesCount] = useState<number>(0)
  const [faqsCount, setFaqsCount] = useState<number>(0)
  const [reviewCount, setReviewCount] = useState<number>(0)

  // Error state
  const [error, setError] = useState<string | null>(null)

  // Duplicate detection state
  const [duplicates, setDuplicates] = useState<any[]>([])
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)
  const [duplicateMatchType, setDuplicateMatchType] = useState<'exact' | 'fuzzy' | null>(null)

  // Hydration effect
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, [])

  // Search for restaurants
  const handleSearch = async (query: string) => {
    setIsSearching(true)
    setError(null)
    setSelectedRestaurant(null)
    setSearchResults([])
    setRestaurantData({})
    setMenuItems([])
    setCategories([])

    try {
      const response = await fetch('/api/admin/search-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      if (data.results && data.results.length > 0) {
        setSearchResults(data.results)
      } else {
        setError('No restaurants found for this search')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  // Handle restaurant selection (selection only, no extraction)
  const handleSelectRestaurant = async (restaurant: PlaceResult) => {
    setSelectedRestaurant(restaurant)
    
    // Clear any previous duplicate warnings
    setDuplicates([])
    setShowDuplicateWarning(false)
    setDuplicateMatchType(null)
    
    // Don't check for duplicates at selection time
    // Duplicate check will happen when user clicks "Run"
  }

  // Handle Run button click (starts extraction)
  const handleRunExtraction = async () => {
    if (!selectedRestaurant) return
    
    // Check for duplicates before starting extraction
    const hasDuplicates = await checkForDuplicates(selectedRestaurant)
    
    // If duplicates exist, show warning and don't start extraction
    if (!hasDuplicates) {
      setShowDuplicateWarning(true)
      return
    }
    
    // Start extraction
    await startExtraction(selectedRestaurant)
  }

  // Check for duplicates before starting extraction
  const checkForDuplicates = async (restaurant: PlaceResult) => {
    try {
      const response = await fetch('/api/admin/restaurants/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: restaurant.place_id,
          name: restaurant.name,
          area: restaurant.formatted_address.split(',')[0]
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check for duplicates')
      }

      if (data.exists) {
        setDuplicates(data.restaurants)
        setDuplicateMatchType(data.match_type)
        return false // Duplicates found
      }

      return true // No duplicates found
    } catch (err) {
      console.error('Duplicate check error:', err)
      return true // On error, allow extraction to proceed
    }
  }

  // Start extraction process
  const startExtraction = async (restaurant: PlaceResult, override: boolean = false) => {
    setIsExtracting(true)
    setError(null)
    setRestaurantId(null)

    // Reset steps
    setExtractionSteps(prev => prev.map(step => ({ ...step, status: 'pending' as StepStatus })))

    try {
      const response = await fetch('/api/admin/start-extraction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          place_id: restaurant.place_id,
          search_query: restaurant.name,
          place_data: restaurant,
          override: override
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start extraction')
      }

      setRestaurantId(data.restaurant_id)

      // Start polling for status
      startPolling(data.restaurant_id)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start extraction')
      setIsExtracting(false)
    }
  }

  const startPolling = (restaurantId: string) => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current)
    }

    pollingStartTime.current = Date.now()
    pollStatus(restaurantId)

    pollingInterval.current = setInterval(() => {
      pollStatus(restaurantId)
    }, 2000)
  }

  const pollStatus = async (restaurantId: string) => {
    try {
      // Check for timeout
      if (pollingStartTime.current && Date.now() - pollingStartTime.current > MAX_POLLING_DURATION) {
        console.warn('Polling timeout reached, stopping extraction monitoring')
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current)
          pollingInterval.current = null
        }
        setIsExtracting(false)
        setError('Extraction monitoring timed out after 10 minutes')
        return
      }

      const response = await fetch(`/api/admin/extraction-status/${restaurantId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch status')
      }

      // Debug: Log status to help diagnose polling issues
      console.log('[Polling] Status:', data.status, '| Progress:', data.progress_percentage + '%')

      // Update extraction steps with direct mapping from backend job_progress
      if (data.steps) {
        setExtractionSteps(prev => prev.map(step => {
          // Find exact matching step from backend
          const stepData = data.steps.find((s: any) => s.name === step.name)

          if (!stepData) return step

          // Special handling for process_images step with progress tracking
          if (step.name === 'process_images') {
            return {
              ...step,
              status: stepData.status,
              startedAt: stepData.started_at,
              completedAt: stepData.completed_at,
              error: stepData.error,
              progress: {
                current: stepData.images_processed || 0,
                total: stepData.images_total || 10,
                cost: stepData.current_cost || 0
              }
            }
          }

          // Standard mapping for all other steps
          return {
            ...step,
            status: stepData.status,
            startedAt: stepData.started_at,
            completedAt: stepData.completed_at,
            error: stepData.error
          }
        }))
      }

      // Update restaurant data as it becomes available
      if (data.status === 'in_progress' || data.status === 'completed') {
        updateRestaurantData(data)
      }

      // Stop polling if completed or failed
      if (data.status === 'completed' || data.status === 'failed') {
        console.log('[Polling] Extraction finished! Stopping polling. Status:', data.status)

        // Load comprehensive data when extraction completes successfully
        if (data.status === 'completed' && restaurantId) {
          console.log('[Polling] Loading comprehensive restaurant data...')
          await loadComprehensiveData(restaurantId)
          await fetchReviewCount(restaurantId)
        }

        // Ensure final state update happens before stopping
        // Give React a moment to flush state updates
        setTimeout(() => {
          if (pollingInterval.current) {
            clearInterval(pollingInterval.current)
            pollingInterval.current = null
          }
          setIsExtracting(false)
        }, 100)
      }
    } catch (err) {
      console.error('Status polling error:', err)
    }
  }

  // Load comprehensive restaurant data from review API
  const loadComprehensiveData = async (restaurantId: string) => {
    try {
      console.log('[LoadData] Fetching comprehensive restaurant data from review API...')

      const response = await fetch(`/api/admin/restaurants/${restaurantId}/review`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load restaurant data')
      }

      console.log('[LoadData] âœ… Comprehensive data loaded successfully')

      // Update all state with fully resolved data
      setRestaurantData(data.restaurant)
      setMenuItems(data.menuItems || [])
      setCategories(data.categories || [])
      // Note: Images are in data.restaurant.photos array, no separate state needed

      // Update display strings for relationships
      if (data.restaurant.allCuisines) {
        setCuisines(data.restaurant.allCuisines.map((c: any) => c.name).join(', '))
      }
      if (data.restaurant.categories) {
        setCategoriesNames(data.restaurant.categories.map((c: any) => c.name).join(', '))
      }
      if (data.restaurant.allFeatures) {
        setFeatures(data.restaurant.allFeatures.map((f: any) => f.name).join(', '))
      }
      if (data.restaurant.meals) {
        setMeals(data.restaurant.meals.map((m: any) => m.name).join(', '))
      }
      if (data.restaurant.goodFor) {
        setGoodFor(data.restaurant.goodFor.map((g: any) => g.name).join(', '))
      }
      if (data.restaurant.neighborhood) {
        setNeighborhood(data.restaurant.neighborhood)
      }

      // Note: Images count comes from restaurantData.photos array length
      // No separate state needed

    } catch (err) {
      console.error('[LoadData] Failed to load comprehensive data:', err)
      // Don't fail extraction - data is still in database
      console.warn('[LoadData] âš ï¸  Continuing with incremental data from extraction')
    }
  }

  const updateRestaurantData = (statusData: any) => {
    // Use extracted_data from status response
    const extractionData = statusData.extracted_data || statusData
    
    // Update ALL 84 database fields to UI state
    setRestaurantData(prev => ({
      ...prev,
      // Basic Identity
      placeId: extractionData.google_place_id || statusData.restaurant_id,
      id: extractionData.id || statusData.restaurant_id,
      name: extractionData.name || prev.name,
      slug: extractionData.slug || prev.slug,
      name_ar: extractionData.name_ar || prev.name_ar,
      
      // Location
      address: extractionData.address || prev.address,
      area: extractionData.area || prev.area,
      neighborhood: extractionData.neighborhood || prev.neighborhood,
      neighborhood_id: extractionData.neighborhood_id || prev.neighborhood_id,
      latitude: extractionData.latitude || prev.latitude,
      longitude: extractionData.longitude?.toString() || prev.longitude,
      coordinates: extractionData.latitude && extractionData.longitude 
        ? `${extractionData.latitude}, ${extractionData.longitude}` 
        : prev.coordinates,
      mall_name: extractionData.mall_name || prev.mall_name,
      mall_floor: extractionData.mall_floor || prev.mall_floor,
      mall_gate: extractionData.mall_gate || prev.mall_gate,
      nearby_landmarks: extractionData.nearby_landmarks || prev.nearby_landmarks,
      public_transport: extractionData.public_transport || prev.public_transport,
      
      // Contact
      phone: extractionData.phone || prev.phone,
      email: extractionData.email || prev.email,
      website: extractionData.website || prev.website,
      instagram: extractionData.instagram || prev.instagram,
      facebook: extractionData.facebook || prev.facebook,
      twitter: extractionData.twitter || prev.twitter,
      
      // Pricing
      priceLevel: mapPriceLevel(extractionData.price_level) || prev.priceLevel,
      price_level: extractionData.price_level || prev.price_level,
      currency: extractionData.currency || prev.currency,
      averageMealPrice: extractionData.average_meal_price || prev.averageMealPrice,
      average_meal_price: extractionData.average_meal_price || prev.average_meal_price,
      
      // AI-Generated Content (already populated)
      description: extractionData.description || prev.description,
      short_description: extractionData.short_description || prev.short_description,
      meta_title: extractionData.meta_title || prev.meta_title,
      meta_description: extractionData.meta_description || prev.meta_description,
      review_sentiment: extractionData.review_sentiment || prev.review_sentiment,
      
      // Ratings (exist but empty)
      overall_rating: extractionData.overall_rating || prev.overall_rating,
      rating_breakdown: extractionData.rating_breakdown || prev.rating_breakdown,
      google_rating: extractionData.google_rating || prev.google_rating,
      google_review_count: extractionData.google_review_count || prev.google_review_count,
      tripadvisor_rating: extractionData.tripadvisor_rating || prev.tripadvisor_rating,
      tripadvisor_review_count: extractionData.tripadvisor_review_count || prev.tripadvisor_review_count,
      opentable_rating: extractionData.opentable_rating || prev.opentable_rating,
      opentable_review_count: extractionData.opentable_review_count || prev.opentable_review_count,
      total_reviews_aggregated: extractionData.total_reviews_aggregated || prev.total_reviews_aggregated,
      
      // Legacy rating fields for compatibility
      rating: extractionData.google_rating || prev.rating,
      reviewCount: extractionData.google_review_count || prev.reviewCount,
      
      // Operational (exist but empty)
      hours: extractionData.hours || prev.hours,
      dress_code: extractionData.dress_code || prev.dress_code,
      reservations_policy: extractionData.reservations_policy || prev.reservations_policy,
      parking_info: extractionData.parking_info || prev.parking_info,
      average_visit_time_mins: extractionData.average_visit_time_mins || prev.average_visit_time_mins,
      payment_methods: extractionData.payment_methods || prev.payment_methods,
      
      // Best Times (exist but empty)
      best_time_description: extractionData.best_time_description || prev.best_time_description,
      busy_times: extractionData.busy_times || prev.busy_times,
      quiet_times: extractionData.quiet_times || prev.quiet_times,
      
      // Awards (exist but empty)
      awards: extractionData.awards || prev.awards,
      michelin_stars: extractionData.michelin_stars || prev.michelin_stars,
      michelin_guide_award_id: extractionData.michelin_guide_award_id || prev.michelin_guide_award_id,
      
      // Special Content (exist but empty)
      secret_menu_items: extractionData.secret_menu_items || prev.secret_menu_items,
      staff_picks: extractionData.staff_picks || prev.staff_picks,
      kids_promotions: extractionData.kids_promotions || prev.kids_promotions,
      
      // Menu (exist but empty)
      menu_data: extractionData.menu_data || prev.menu_data,
      menu_source: extractionData.menu_source || prev.menu_source,
      menu_last_updated: extractionData.menu_last_updated || prev.menu_last_updated,
      menu_url: extractionData.menu_url || prev.menu_url,
      
      // Array Relationships (exist but empty)
      restaurant_cuisine_ids: extractionData.restaurant_cuisine_ids || prev.restaurant_cuisine_ids,
      restaurant_category_ids: extractionData.restaurant_category_ids || prev.restaurant_category_ids,
      restaurant_feature_ids: extractionData.restaurant_feature_ids || prev.restaurant_feature_ids,
      restaurant_meal_ids: extractionData.restaurant_meal_ids || prev.restaurant_meal_ids,
      restaurant_good_for_ids: extractionData.restaurant_good_for_ids || prev.restaurant_good_for_ids,
      
      // Images
      photos: extractionData.images?.map((img: any) => ({ url: img.url, alt: img.alt_text })) || extractionData.photos || prev.photos || [],
      hero_image: extractionData.hero_image || prev.hero_image,
      logo_image: extractionData.logo_image || prev.logo_image,
      
      // Google Place ID
      google_place_id: extractionData.google_place_id || prev.google_place_id,
      
      // Legacy fields for compatibility
      cuisine: extractionData.cuisine || prev.cuisine,
      allCuisines: extractionData.cuisines || prev.allCuisines || [],
      meals: extractionData.meals || prev.meals || [],
      allFeatures: extractionData.features || prev.allFeatures || [],
      parkingInfo: extractionData.parking_info || prev.parkingInfo,
      googleDirectionsUrl: extractionData.google_directions_url || prev.googleDirectionsUrl
    }))

    // Extract data from Apify JSON if available
    if (extractionData.apify_output) {
      const apifyData = extractionData.apify_output
      
      setRestaurantData(prev => ({
        ...prev,
        placeId: apifyData.placeId || extractionData.restaurant_id || statusData.restaurant_id,
        name: apifyData.title || apifyData.name || apifyData.placeName || prev.name,
        address: apifyData.address || apifyData.fullAddress || prev.address,
        neighborhood: apifyData.neighborhood || apifyData.city || apifyData.area || prev.neighborhood,
        phone: apifyData.phone || apifyData.phoneUnformatted || prev.phone,
        website: apifyData.website || apifyData.url || prev.website,
        coordinates: apifyData.location ? 
          `${apifyData.location.lat}, ${apifyData.location.lng}` : 
          (apifyData.latitude && apifyData.longitude ? 
            `${apifyData.latitude}, ${apifyData.longitude}` : 
            (extractionData.latitude && extractionData.longitude ?
              `${extractionData.latitude}, ${extractionData.longitude}` : prev.coordinates)),
        priceLevel: apifyData.price ? mapPriceLevel(apifyData.price) : (extractionData.price_level || prev.priceLevel),
        rating: apifyData.totalScore || apifyData.rating || extractionData.google_rating || prev.rating,
        reviewCount: apifyData.reviewsCount || extractionData.google_review_count || prev.reviewCount,
        hours: formatHours(apifyData.openingHours) || formatHours(extractionData.hours) || prev.hours,
        cuisine: apifyData.categoryName || extractionData.primary_category || prev.cuisine,
        photos: apifyData.photos || prev.photos || []
      }))
    }

    // Firecrawl fallback for social links (Instagram/Facebook)
    if (extractionData.firecrawl_output && !restaurantData.instagram && !restaurantData.facebook) {
      const fc = extractionData.firecrawl_output
      const results = Array.isArray(fc.results) ? fc.results : []

      const findUrl = (host: string) =>
        results.find((r: any) => typeof r?.url === 'string' && r.url.includes(host))?.url

      const ig = findUrl('instagram.com')
      const fb = findUrl('facebook.com')

      setRestaurantData(prev => ({
        ...prev,
        instagram: prev.instagram || ig || prev.instagram,
        facebook: prev.facebook || fb || prev.facebook,
      }))
    }

    // Update counts from related data if available
    if (extractionData.dishes && extractionData.dishes.length > 0) {
      setDishesCount(extractionData.dishes.length)
    }
    if (extractionData.faqs && extractionData.faqs.length > 0) {
      setFaqsCount(extractionData.faqs.length)
    }
    if (extractionData.images && extractionData.images.length > 0) {
      // Images count is already set via photos array in restaurantData
    }

    // Process menu items from dishes table (primary source)
    if (extractionData.dishes && extractionData.dishes.length > 0) {
      const menuItems: MenuItem[] = extractionData.dishes.map((dish: any) => ({
        id: dish.id,
        name: dish.name,
        description: dish.description,
        price: dish.price ? `${dish.price} ${dish.currency || 'KWD'}` : undefined,
        mentions: dish.mentions_count || 0,
        category: dish.category || 'main',
        is_popular: dish.is_popular || false,
        confidence_score: dish.confidence_score,
        source: dish.source || 'database'
      }))
      
      setMenuItems(menuItems)
      
      // Update menu metadata
      setMenuMetadata({
        source: extractionData.menu_source || 'database',
        last_updated: extractionData.menu_last_updated,
        total_dishes: extractionData.dishes.length,
        popular_dishes: extractionData.dishes.filter((d: any) => d.is_popular).length,
        sections: 0 // Will be updated when menu sections are implemented
      })
    } else if (extractionData.menu_data) {
      // Fallback: Process menu_data if no dishes in database yet
      const menuData = extractionData.menu_data
      const menuItems: MenuItem[] = []
      
      if (menuData.items && menuData.items.length > 0) {
        menuItems.push(...menuData.items.map((item: any) => ({
          name: item.text || item.name,
          mentions: 0,
          category: 'main',
          is_popular: false,
          source: item.source || 'firecrawl'
        })))
      }
      
      setMenuItems(menuItems)
    }

    // Process menu sections if available
    if (extractionData.menu_data?.sections) {
      const menuSections: MenuSection[] = extractionData.menu_data.sections.map((section: any) => ({
        name: section.name,
        dishes: section.dishes || [],
        display_order: section.display_order
      }))
      setMenuSections(menuSections)
    }

    // Process menu metadata (fallback if no dishes from database)
    if (extractionData.menu_data && (!extractionData.dishes || extractionData.dishes.length === 0)) {
      setMenuMetadata({
        source: extractionData.menu_source,
        last_updated: extractionData.menu_last_updated,
        total_dishes: extractionData.menu_data.items?.length || 0,
        popular_dishes: 0, // No popular dishes info in menu_data
        sections: extractionData.menu_data.sections?.length || 0
      })
      
      // Update counts for extraction report (fallback)
      setDishesCount(extractionData.menu_data.items?.length || 0)
      setFaqsCount(extractionData.faqs?.length || 0)
    }

    // Update individual relationship fields for display (only if full data is available)
    if (extractionData.cuisines && Array.isArray(extractionData.cuisines) && extractionData.cuisines.length > 0) {
      setCuisines(extractionData.cuisines.map((c: any) => c.name).join(', '))
    }

    // Categories: Keep as array for MenuView component
    if (extractionData.categories && Array.isArray(extractionData.categories) && extractionData.categories.length > 0) {
      setCategories(extractionData.categories.map((c: any) => ({
        name: c.name,
        type: c.type || 'cuisine' // Provide default type if missing
      })))
      // Also set names for extraction report
      setCategoriesNames(extractionData.categories.map((c: any) => c.name).join(', '))
    }

    if (extractionData.features && Array.isArray(extractionData.features) && extractionData.features.length > 0) {
      setFeatures(extractionData.features.map((f: any) => f.name).join(', '))
    }

    if (extractionData.meals && Array.isArray(extractionData.meals) && extractionData.meals.length > 0) {
      setMeals(extractionData.meals.map((m: any) => m.name).join(', '))
    }

    if (extractionData.good_for && Array.isArray(extractionData.good_for) && extractionData.good_for.length > 0) {
      setGoodFor(extractionData.good_for.map((g: any) => g.name).join(', '))
    }

    if (extractionData.neighborhood && extractionData.neighborhood.name) {
      setNeighborhood(extractionData.neighborhood.name)
    }

    if (extractionData.michelin_award && extractionData.michelin_award.name) {
      setMichelinAward(extractionData.michelin_award.name)
    }
  }

  // Helper function to map price level
  const mapPriceLevel = (price: string): number => {
    if (!price) return 0
    const priceMap: { [key: string]: number } = {
      '$': 1,
      '$$': 2,
      '$$$': 3,
      '$$$$': 4
    }
    return priceMap[price] || 0
  }

  // Helper function to format hours
  const formatHours = (openingHours: any): string => {
    if (!openingHours || !Array.isArray(openingHours)) return ''
    
    const dayMap: { [key: string]: string } = {
      'monday': 'Mon',
      'tuesday': 'Tue', 
      'wednesday': 'Wed',
      'thursday': 'Thu',
      'friday': 'Fri',
      'saturday': 'Sat',
      'sunday': 'Sun'
    }
    
    const formattedHours = openingHours.map((entry: any) => {
      const day = dayMap[entry.day?.toLowerCase()] || entry.day
      return `${day}: ${entry.hours}`
    }).join(', ')
    
    return formattedHours
  }

  // Fetch review count for the restaurant
  const fetchReviewCount = async (rId: string) => {
    try {
      const response = await fetch(`/api/admin/restaurants/${rId}/review`)
      const data = await response.json()

      if (response.ok && data.restaurant?.reviewCount !== undefined) {
        setReviewCount(data.restaurant.reviewCount)
      }
    } catch (err) {
      console.error('Failed to fetch review count:', err)
    }
  }

  // Duplicate warning handlers
  const handleOverrideDuplicate = () => {
    setShowDuplicateWarning(false)
    setDuplicates([])
    setDuplicateMatchType(null)
    if (selectedRestaurant) {
      startExtraction(selectedRestaurant, true) // Pass override=true
    }
  }

  const handleCancelDuplicate = () => {
    setShowDuplicateWarning(false)
    setDuplicates([])
    setDuplicateMatchType(null)
    setSelectedRestaurant(null)
    setRestaurantData({})
    setMenuItems([])
    setCategories([])
  }

  const handleViewExisting = (restaurantId: string) => {
    window.open(`/admin/restaurants/${restaurantId}/review`, '_blank')
  }

  // Retry image extraction handler
  const handleRetryImages = async () => {
    if (!restaurantId) return

    try {
      const response = await fetch('/api/admin/retry-image-extraction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_id: restaurantId })
      })

      const data = await response.json()

      if (response.ok) {
        // Reset the process_images step and continue polling
        setExtractionSteps(prev => prev.map(step =>
          step.name === 'process_images'
            ? { ...step, status: 'running', error: undefined, progress: { current: 0, total: 10, cost: 0 } }
            : step
        ))
      } else {
        throw new Error(data.error || 'Failed to retry image extraction')
      }
    } catch (err) {
      console.error('Failed to retry image extraction:', err)
      setError(err instanceof Error ? err.message : 'Failed to retry image extraction')
    }
  }

  // Prevent hydration mismatch
  if (!isHydrated) {
    return (
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <h1 className="text-lg font-semibold">Add Restaurant</h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </SidebarInset>
    )
  }

  return (
    <SidebarInset>
      <AdminPageHeader
        title="Add Restaurant"
        description="Add restaurants to the Best of Goa directory"
        breadcrumbs={[
          { label: 'Restaurants', href: '/admin/restaurants' },
          { label: 'Add Restaurant' }
        ]}
      />

      <ThreeColumnLayout
        leftColumn={
          <div className="space-y-6">
            <SearchContext
              onSearch={handleSearch}
              onSelectRestaurant={handleSelectRestaurant}
              onRunExtraction={handleRunExtraction}
              searchResults={searchResults}
              selectedRestaurant={selectedRestaurant}
              isSearching={isSearching}
            />
            <ProgressSidebar
              steps={extractionSteps}
              currentStep={extractionSteps.find(s => s.status === 'running')?.name}
              onRetryImages={handleRetryImages}
            />
          </div>
        }
        centerColumn={
          <ExtractedDataView
            data={restaurantData}
            loading={isExtracting}
            dishesCount={dishesCount}
            faqsCount={faqsCount}
            imagesCount={restaurantData.photos?.length || 0}
            reviewCount={reviewCount}
            cuisinesNames={cuisines}
            categoriesNames={categoriesNames}
            featuresNames={features}
            mealsNames={meals}
            goodForNames={goodFor}
            neighborhoodName={neighborhood}
          />
        }
        rightColumn={
          <MenuView
            menuItems={menuItems}
            menuSections={menuSections}
            menuMetadata={menuMetadata}
            categories={categories}
            loading={isExtracting}
          />
        }
      />

      {/* Duplicate Warning Modal */}
      {showDuplicateWarning && (
        <DuplicateWarning
          duplicates={duplicates}
          matchType={duplicateMatchType || 'exact'}
          onOverride={handleOverrideDuplicate}
          onCancel={handleCancelDuplicate}
          onViewExisting={handleViewExisting}
        />
      )}
    </SidebarInset>
  )
}
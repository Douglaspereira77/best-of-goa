'use client'

import { DataSection } from '../layout/DataSection'
import { SectionCard } from '../layout/SectionCard'
import { Badge } from '@/components/ui/badge'
import { Star, MapPin, Clock, Globe, Instagram, Facebook, CheckCircle, AlertCircle } from 'lucide-react'
import { ExtractionReportCard } from './ExtractionReportCard'

interface RestaurantData {
  // Basic Identity
  placeId?: string
  id?: string
  name?: string
  slug?: string
  name_ar?: string
  
  // Location
  address?: string
  area?: string
  neighborhood?: string | { id: number; name: string; slug: string }  // Can be string or object after comprehensive load
  neighborhood_id?: number
  latitude?: number
  longitude?: string
  coordinates?: string
  mall_name?: string
  mall_floor?: string
  mall_gate?: string
  nearby_landmarks?: string[]
  public_transport?: string[]
  
  // Contact
  phone?: string
  email?: string
  website?: string
  instagram?: string
  facebook?: string
  twitter?: string
  
  // Pricing
  priceLevel?: number
  price_level?: number
  currency?: string
  averageMealPrice?: number
  average_meal_price?: number
  
  // AI-Generated Content (already populated)
  description?: string
  short_description?: string
  meta_title?: string
  meta_description?: string
  review_sentiment?: string
  
  // Ratings (exist but empty)
  overall_rating?: number
  rating_breakdown?: {
    food_quality: number
    service: number
    ambience: number
    value_for_money: number
    accessibility_amenities: number
  }
  google_rating?: number
  google_review_count?: number
  tripadvisor_rating?: number
  tripadvisor_review_count?: number
  opentable_rating?: number
  opentable_review_count?: number
  total_reviews_aggregated?: number
  
  // Operational (exist but empty)
  hours?: Record<string, any>
  dress_code?: string
  reservations_policy?: string
  parking_info?: string
  average_visit_time_mins?: number
  payment_methods?: string[]
  
  // Best Times (exist but empty)
  best_time_description?: string
  busy_times?: Record<string, string[]>
  quiet_times?: Record<string, string[]>
  
  // Awards (exist but empty)
  awards?: Array<{
    name: string
    source: string
    year: number
    badge_url?: string
  }>
  michelin_stars?: number
  michelin_guide_award_id?: number
  
  // Special Content (exist but empty)
  secret_menu_items?: Array<any>
  staff_picks?: Array<any>
  kids_promotions?: string
  
  // Menu (exist but empty)
  menu_data?: any
  menu_source?: string
  menu_last_updated?: string
  menu_url?: string
  
  // Array Relationships (exist but empty)
  restaurant_cuisine_ids?: string[]
  restaurant_category_ids?: string[]
  restaurant_feature_ids?: string[]
  restaurant_meal_ids?: string[]
  restaurant_good_for_ids?: string[]
  
  // Images
  photos?: Array<{ url: string; alt?: string }>
  hero_image?: string
  logo_image?: string
  
  // Legacy fields for compatibility
  cuisine?: string
  rating?: number
  reviewCount?: number
  allCuisines?: Array<{ id: number; name: string; slug: string }>
  meals?: Array<{ id: number; name: string; slug: string }>
  allFeatures?: Array<{ id: number; name: string; slug: string; category: string }>
  parkingInfo?: string
  googleDirectionsUrl?: string
}

interface ExtractedDataViewProps {
  data: RestaurantData
  loading?: boolean
  className?: string
  dishesCount?: number
  faqsCount?: number
  imagesCount?: number
  reviewCount?: number
  cuisinesNames?: string
  categoriesNames?: string
  featuresNames?: string
  mealsNames?: string
  goodForNames?: string
  neighborhoodName?: string
}

export function ExtractedDataView({
  data,
  loading = false,
  className = '',
  dishesCount = 0,
  faqsCount = 0,
  imagesCount = data.photos?.length || 0,
  reviewCount = 0,
  cuisinesNames = '',
  categoriesNames = '',
  featuresNames = '',
  mealsNames = '',
  goodForNames = '',
  neighborhoodName = ''
}: ExtractedDataViewProps) {
  const getPriceLevel = (level?: number) => {
    if (!level || level === 0) return 'N/A'
    return '$'.repeat(level)
  }

  // Helper function to format hours
  const formatHours = (openingHours: any): string => {
    if (!openingHours) return 'N/A'
    
    // Handle JSONB format: { monday: { open: "12:00", close: "23:00", closed: false } }
    if (typeof openingHours === 'object' && !Array.isArray(openingHours)) {
      const dayMap: { [key: string]: string } = {
        'monday': 'Mon',
        'tuesday': 'Tue', 
        'wednesday': 'Wed',
        'thursday': 'Thu',
        'friday': 'Fri',
        'saturday': 'Sat',
        'sunday': 'Sun'
      }
      
      const formattedDays = Object.entries(openingHours).map(([day, hours]: [string, any]) => {
        const dayName = dayMap[day.toLowerCase()] || day
        if (hours?.closed) {
          return `${dayName}: Closed`
        } else if (hours?.open && hours?.close) {
          return `${dayName}: ${hours.open} - ${hours.close}`
        }
        return `${dayName}: N/A`
      }).join(', ')
      
      return formattedDays
    }
    
    // Handle array format (legacy)
    if (Array.isArray(openingHours)) {
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
    
    return 'N/A'
  }

  const basicInfoFields = [
    { label: 'Google Place ID', value: data.placeId || '', copyable: true },
    { label: 'Name', value: data.name || '' },
    { label: 'Slug', value: data.slug || '' },
    { label: 'Cuisine', value: data.cuisine || '' },
    { label: 'Address', value: data.address || '' },
    { label: 'Neighborhood', value: (typeof data.neighborhood === 'object' && data.neighborhood !== null) ? (data.neighborhood as any).name : data.neighborhood || '' },
    { label: 'Phone', value: data.phone || '' },
    { label: 'Co-ordinates', value: data.coordinates || '' },
    { label: 'Price Range', value: getPriceLevel(data.priceLevel) },
    { label: 'Avg Meal Price', value: data.averageMealPrice ? `${data.averageMealPrice} KWD` : 'N/A' },
    { label: 'Website URL', value: data.website || '', link: data.website },
    { label: 'Instagram', value: data.instagram || '', link: data.instagram },
    { label: 'Facebook', value: data.facebook || '', link: data.facebook },
  ]

  const ratingsFields = [
    { 
      label: 'Google', 
      value: data.rating ? `${data.rating} (${data.reviewCount || 0} reviews)` : 'N/A' 
    },
    { label: 'TripAdvisor', value: 'N/A' },
    { label: 'OpenTable', value: 'N/A' },
  ]

  const operationalDetailedFields = [
    { label: 'Hours', value: formatHours(data.hours) },
    { label: 'Dress Code', value: data.dress_code || 'N/A' },
    { label: 'Reservations', value: data.reservations_policy || 'N/A' },
    { label: 'Avg Visit Time', value: data.average_visit_time_mins ? `${data.average_visit_time_mins} mins` : 'N/A' },
    { label: 'Parking', value: data.parking_info || data.parkingInfo || 'N/A' },
    { label: 'Payment Methods', value: data.payment_methods?.join(', ') || 'N/A' },
  ]

  const locationDetailedFields = [
    { label: 'Address', value: data.address || 'N/A' },
    { label: 'Area', value: data.area || 'N/A' },
    { label: 'Neighborhood', value: (typeof data.neighborhood === 'object' && data.neighborhood !== null) ? (data.neighborhood as any).name || 'N/A' : data.neighborhood || 'N/A' },
    { label: 'Mall', value: data.mall_name || 'N/A' },
    { label: 'Floor', value: data.mall_floor || 'N/A' },
    { label: 'Gate', value: data.mall_gate || 'N/A' },
    { label: 'Landmarks', value: data.nearby_landmarks?.join(', ') || 'N/A' },
    { label: 'Public Transport', value: data.public_transport?.join(', ') || 'N/A' },
    { label: 'Coordinates', value: data.latitude && data.longitude ? `${data.latitude}, ${data.longitude}` : 'N/A' },
  ]

  const socialMediaDetailedFields = [
    { label: 'Website', value: data.website || '', link: data.website },
    { label: 'Phone', value: data.phone || 'N/A' },
    { label: 'Email', value: data.email || 'N/A', link: data.email ? `mailto:${data.email}` : undefined },
    { label: 'Instagram', value: data.instagram || 'N/A', link: data.instagram },
    { label: 'Facebook', value: data.facebook || 'N/A', link: data.facebook },
    { label: 'Twitter', value: data.twitter || 'N/A', link: data.twitter },
  ]

  const menuInfoFields = [
    { label: 'Menu Source', value: data.menu_source || 'N/A' },
    { label: 'Last Updated', value: data.menu_last_updated ? new Date(data.menu_last_updated).toLocaleDateString() : 'N/A' },
    { label: 'Menu URL', value: data.menu_url || 'N/A', link: data.menu_url },
    { label: 'Total Dishes', value: data.menu_data?.items?.length || 0 },
  ]

  // Data completeness score calculation
  const getDataCompletenessScore = (data: RestaurantData): number => {
    const fields = [
      data.hours, data.dress_code, data.reservations_policy,
      data.parking_info, data.instagram, data.facebook,
      data.email, data.menu_url, data.average_visit_time_mins
    ];
    const completedFields = fields.filter(f => f !== null && f !== undefined && f !== 'N/A').length;
    return Math.round((completedFields / fields.length) * 100);
  }

  const pricingFields = [
    { label: 'Price Level', value: getPriceLevel(data.price_level || data.priceLevel) },
    { label: 'Avg Meal Price', value: data.average_meal_price || data.averageMealPrice ? `${data.average_meal_price || data.averageMealPrice} ${data.currency || 'KWD'}` : 'N/A' },
    { label: 'Currency', value: data.currency || 'KWD' },
  ]

  const socialFields = [
    { label: 'Website', value: data.website || '', link: data.website },
    { label: 'Phone', value: data.phone || '' },
    { label: 'Email', value: data.email || '' },
    { label: 'Instagram', value: data.instagram || '', link: data.instagram },
    { label: 'Facebook', value: data.facebook || '', link: data.facebook },
    { label: 'Twitter', value: data.twitter || '', link: data.twitter },
  ]

  const locationFields = [
    { label: 'Mall', value: data.mall_name || 'N/A' },
    { label: 'Floor', value: data.mall_floor || 'N/A' },
    { label: 'Gate', value: data.mall_gate || 'N/A' },
    { label: 'Landmarks', value: data.nearby_landmarks?.join(', ') || 'N/A' },
    { label: 'Public Transport', value: data.public_transport?.join(', ') || 'N/A' },
  ]

  const menuFields = [
    { label: 'Menu Source', value: data.menu_source || 'N/A' },
    { label: 'Last Updated', value: data.menu_last_updated || 'N/A' },
    { label: 'Menu URL', value: data.menu_url || '', link: data.menu_url },
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Extraction Report */}
      <ExtractionReportCard
        data={data}
        dishesCount={dishesCount}
        faqsCount={faqsCount}
        imagesCount={imagesCount}
        cuisinesNames={cuisinesNames}
        categoriesNames={categoriesNames}
        featuresNames={featuresNames}
        mealsNames={mealsNames}
        goodForNames={goodForNames}
        neighborhoodName={neighborhoodName}
      />

      {/* Basic Information */}
      <DataSection
        title="Basic Information"
        icon="ℹ️"
        fields={basicInfoFields}
        loading={loading}
      />

      {/* Photos */}
      <SectionCard
        title="Photos"
        icon="📸"
        defaultCollapsed={false}
      >
        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : data.photos && data.photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {data.photos.slice(0, 6).map((photo, index) => (
              <div key={index} className="aspect-square bg-gray-100 rounded overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.alt || `Restaurant photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No photos available</p>
          </div>
        )}
      </SectionCard>

      {/* Reviews Linked */}
      <SectionCard
        title="Reviews Linked"
        icon="💬"
        defaultCollapsed={false}
      >
        <div className="space-y-3">
          {reviewCount ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Google Reviews</span>
                <span className="text-lg font-semibold text-gray-900">
                  {reviewCount}
                </span>
              </div>

              <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-900">Reviews Linked</p>
                  <p className="text-xs text-green-700">All reviews in database and indexed for LLM</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center p-3 bg-gray-100 rounded-lg border border-gray-200">
              <AlertCircle className="w-5 h-5 text-gray-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">No Reviews Yet</p>
                <p className="text-xs text-gray-700">Reviews will be linked after extraction completes</p>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Ratings */}
      <DataSection
        title="Ratings"
        icon="⭐"
        fields={ratingsFields}
        loading={loading}
      />

      {/* Operational Details */}
      <DataSection
        title="Operational Details"
        icon="⚙️"
        badge={`${getDataCompletenessScore(data)}% Complete`}
        fields={operationalDetailedFields}
        loading={loading}
      />

      {/* Cuisines */}
      {data.allCuisines && data.allCuisines.length > 0 && (
        <SectionCard
          title="Cuisines"
          icon="🍴"
          defaultCollapsed={false}
        >
          <div className="flex flex-wrap gap-2">
            {data.allCuisines.map(cuisine => (
              <Badge key={cuisine.id} variant="secondary">
                {cuisine.name}
              </Badge>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Meals */}
      {data.meals && data.meals.length > 0 && (
        <SectionCard
          title="Restaurant Meals"
          icon="🍽️"
          defaultCollapsed={false}
        >
          <div className="flex flex-wrap gap-2">
            {data.meals.map(meal => (
              <Badge key={meal.id} variant="outline">
                {meal.name}
              </Badge>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Features */}
      {data.allFeatures && data.allFeatures.length > 0 && (
        <SectionCard
          title="Features"
          icon="✨"
          defaultCollapsed={false}
        >
          <div className="flex flex-wrap gap-2">
            {data.allFeatures.slice(0, 8).map(feature => (
              <Badge key={feature.id} variant="secondary">
                {feature.name}
              </Badge>
            ))}
            {data.allFeatures.length > 8 && (
              <span className="text-sm text-gray-500">+{data.allFeatures.length - 8} more</span>
            )}
          </div>
        </SectionCard>
      )}

      {/* Payment & Parking */}
      {(data.paymentMethods?.length > 0 || data.parkingInfo) && (
        <SectionCard
          title="Payment & Parking"
          icon="💳"
          defaultCollapsed={false}
        >
          <div className="space-y-3">
            {data.paymentMethods && data.paymentMethods.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Payment Methods</h4>
                <div className="flex flex-wrap gap-2">
                  {data.paymentMethods.map(method => (
                    <Badge key={method} variant="outline">
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {data.parkingInfo && (
              <div>
                <h4 className="text-sm font-medium mb-2">Parking</h4>
                <p className="text-sm text-gray-600">{data.parkingInfo}</p>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* AI-Generated Content */}
      <SectionCard
        title="AI-Generated Content"
        icon="🤖"
        defaultCollapsed={false}
      >
        <div className="space-y-4">
          {data.description && (
            <div>
              <h4 className="text-sm font-medium mb-2">Description</h4>
              <p className="text-sm text-gray-700">{data.description}</p>
            </div>
          )}
          {data.short_description && (
            <div>
              <h4 className="text-sm font-medium mb-2">Short Description</h4>
              <p className="text-sm text-gray-700">{data.short_description}</p>
            </div>
          )}
          {data.meta_title && (
            <div>
              <h4 className="text-sm font-medium mb-2">Meta Title</h4>
              <p className="text-sm text-gray-700">{data.meta_title}</p>
            </div>
          )}
          {data.meta_description && (
            <div>
              <h4 className="text-sm font-medium mb-2">Meta Description</h4>
              <p className="text-sm text-gray-700">{data.meta_description}</p>
            </div>
          )}
          {data.review_sentiment && (
            <div>
              <h4 className="text-sm font-medium mb-2">Review Sentiment</h4>
              <p className="text-sm text-gray-700">{data.review_sentiment}</p>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Detailed Ratings Breakdown */}
      <SectionCard
        title="Detailed Ratings Breakdown"
        icon="⭐"
        defaultCollapsed={false}
      >
        <div className="space-y-4">
          {data.overall_rating && (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{data.overall_rating.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Overall Rating</div>
            </div>
          )}
          
          {data.rating_breakdown && (
            <div className="space-y-3">
              {Object.entries(data.rating_breakdown).map(([key, value]) => {
                if (typeof value === 'number' && key !== 'calculated_at' && key !== 'algorithm_version') {
                  const displayName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{displayName}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(value / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-8">{value.toFixed(1)}</span>
                      </div>
                    </div>
                  )
                }
                return null
              })}
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            {data.google_rating && (
              <div className="text-center">
                <div className="text-lg font-bold">{data.google_rating}</div>
                <div className="text-xs text-gray-600">Google ({data.google_review_count || 0})</div>
              </div>
            )}
            {data.tripadvisor_rating && (
              <div className="text-center">
                <div className="text-lg font-bold">{data.tripadvisor_rating}</div>
                <div className="text-xs text-gray-600">TripAdvisor ({data.tripadvisor_review_count || 0})</div>
              </div>
            )}
            {data.opentable_rating && (
              <div className="text-center">
                <div className="text-lg font-bold">{data.opentable_rating}</div>
                <div className="text-xs text-gray-600">OpenTable ({data.opentable_review_count || 0})</div>
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Pricing Information */}
      <DataSection
        title="Pricing Information"
        icon="💰"
        fields={pricingFields}
        loading={loading}
      />

      {/* Best Times to Visit */}
      {(data.best_time_description || data.busy_times || data.quiet_times) && (
        <SectionCard
          title="Best Times to Visit"
          icon="⏰"
          defaultCollapsed={false}
        >
          <div className="space-y-4">
            {data.best_time_description && (
              <div>
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <p className="text-sm text-gray-700">{data.best_time_description}</p>
              </div>
            )}
            
            {data.busy_times && Object.keys(data.busy_times).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-red-600">Busy Times</h4>
                <div className="space-y-1">
                  {Object.entries(data.busy_times).map(([day, times]) => (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="capitalize">{day}</span>
                      <span className="text-red-600">{Array.isArray(times) ? times.join(', ') : times}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {data.quiet_times && Object.keys(data.quiet_times).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-green-600">Quiet Times</h4>
                <div className="space-y-1">
                  {Object.entries(data.quiet_times).map(([day, times]) => (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="capitalize">{day}</span>
                      <span className="text-green-600">{Array.isArray(times) ? times.join(', ') : times}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Awards & Recognition */}
      {(data.awards?.length > 0 || data.michelin_stars) && (
        <SectionCard
          title="Awards & Recognition"
          icon="🏆"
          defaultCollapsed={false}
        >
          <div className="space-y-4">
            {data.michelin_stars && data.michelin_stars > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-2xl">⭐</span>
                <span className="font-medium">{data.michelin_stars} Michelin Star{data.michelin_stars > 1 ? 's' : ''}</span>
              </div>
            )}
            
            {data.awards && data.awards.length > 0 && (
              <div className="space-y-2">
                {data.awards.map((award, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium text-sm">{award.name}</div>
                      <div className="text-xs text-gray-600">{award.source} • {award.year}</div>
                    </div>
                    {award.badge_url && (
                      <img src={award.badge_url} alt={award.name} className="w-8 h-8" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Location Details */}
      <DataSection
        title="Location Details"
        icon="📍"
        fields={locationDetailedFields}
        loading={loading}
      />

      {/* Social Media & Contact */}
      <DataSection
        title="Social Media & Contact"
        icon="📱"
        fields={socialMediaDetailedFields}
        loading={loading}
      />

      {/* Special Features */}
      {(data.secret_menu_items?.length > 0 || data.staff_picks?.length > 0 || data.kids_promotions) && (
        <SectionCard
          title="Special Features"
          icon="✨"
          defaultCollapsed={false}
        >
          <div className="space-y-4">
            {data.secret_menu_items && data.secret_menu_items.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Secret Menu Items</h4>
                <div className="space-y-2">
                  {data.secret_menu_items.map((item, index) => (
                    <div key={index} className="p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                      <div className="font-medium text-sm">{item.name}</div>
                      {item.description && <div className="text-xs text-gray-600">{item.description}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {data.staff_picks && data.staff_picks.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Staff Picks</h4>
                <div className="space-y-2">
                  {data.staff_picks.map((pick, index) => (
                    <div key={index} className="p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                      <div className="font-medium text-sm">{pick.name}</div>
                      {pick.description && <div className="text-xs text-gray-600">{pick.description}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {data.kids_promotions && (
              <div>
                <h4 className="text-sm font-medium mb-2">Kids Promotions</h4>
                <p className="text-sm text-gray-700">{data.kids_promotions}</p>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Menu Information */}
      <DataSection
        title="Menu Information"
        icon="📋"
        fields={menuInfoFields}
        loading={loading}
      />

      {/* Google Directions */}
      {data.googleDirectionsUrl && (
        <SectionCard
          title="Directions"
          icon="📍"
          defaultCollapsed={false}
        >
          <a 
            href={data.googleDirectionsUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
          >
            Open in Google Maps
          </a>
        </SectionCard>
      )}
    </div>
  )
}

'use client'

import { SectionCard } from '../layout/SectionCard'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface RestaurantData {
  // Basic Identity
  id?: string
  name?: string
  slug?: string
  name_ar?: string
  
  // Location
  address?: string
  area?: string
  neighborhood?: string
  neighborhood_id?: number
  latitude?: number
  longitude?: number
  google_place_id?: string
  postal_code?: string
  
  // Contact
  phone?: string
  email?: string
  website?: string
  instagram?: string
  facebook?: string
  twitter?: string
  
  // Pricing
  price_level?: number
  currency?: string
  average_meal_price?: number
  
  // Descriptions
  description?: string
  description_ar?: string
  short_description?: string
  
  // Images
  hero_image?: string
  logo_image?: string
  
  // Ratings
  overall_rating?: number
  google_rating?: number
  google_review_count?: number
  tripadvisor_rating?: number
  tripadvisor_review_count?: number
  total_reviews_aggregated?: number
  
  // Operational
  hours?: Record<string, any>
  menu_url?: string
  dress_code?: string
  reservations_policy?: string
  parking_info?: string
  payment_methods?: string[]
  
  // Relationships
  restaurant_cuisine_ids?: string[]
  restaurant_category_ids?: string[]
  restaurant_feature_ids?: string[]
  restaurant_meal_ids?: string[]
  restaurant_good_for_ids?: string[]
  
  // Raw data
  apify_output?: any
  firecrawl_output?: any
  ai_enhancement_output?: any
  
  // Legacy
  cuisine?: string
}

interface ExtractionReportCardProps {
  data: RestaurantData
  dishesCount?: number
  faqsCount?: number
  imagesCount?: number
  cuisinesNames?: string
  categoriesNames?: string
  featuresNames?: string
  mealsNames?: string
  goodForNames?: string
  neighborhoodName?: string
}

type FieldInfo = {
  label: string
  value: any
  source: string
}

export function ExtractionReportCard({
  data,
  dishesCount = 0,
  faqsCount = 0,
  imagesCount = 0,
  cuisinesNames = '',
  categoriesNames = '',
  featuresNames = '',
  mealsNames = '',
  goodForNames = '',
  neighborhoodName = ''
}: ExtractionReportCardProps) {
  // Organize fields by category
  const fieldCategories: Record<string, FieldInfo[]> = {
    'Core Identity': [
      { label: 'Name', value: data.name, source: 'manual' },
      { label: 'Slug', value: data.slug, source: 'generated' },
      { label: 'Arabic Name', value: data.name_ar, source: 'apify' },
    ],
    'Location': [
      { label: 'Address', value: data.address, source: 'apify' },
      { label: 'Area', value: data.area, source: 'apify' },
      { label: 'Coordinates', value: data.latitude && data.longitude ? `${data.latitude}, ${data.longitude}` : null, source: 'apify' },
      { label: 'Google Place ID', value: data.google_place_id, source: 'apify' },
      { label: 'Postal Code', value: data.postal_code, source: 'apify' },
      { label: 'Neighborhood', value: neighborhoodName, source: 'data_mapping' },
    ],
    'Contact': [
      { label: 'Phone', value: data.phone, source: 'apify' },
      { label: 'Email', value: data.email, source: 'firecrawl' },
      { label: 'Website', value: data.website, source: 'apify/firecrawl' },
      { label: 'Instagram', value: data.instagram, source: 'firecrawl' },
      { label: 'Facebook', value: data.facebook, source: 'firecrawl' },
      { label: 'Twitter', value: data.twitter, source: 'firecrawl' },
    ],
    'Pricing': [
      { label: 'Price Level', value: data.price_level ? '$'.repeat(data.price_level) : null, source: 'apify' },
      { label: 'Currency', value: data.currency, source: 'system' },
      { label: 'Average Meal Price', value: data.average_meal_price, source: 'apify' },
    ],
    'Descriptions': [
      { label: 'Description', value: data.description ? `${data.description.substring(0, 50)}...` : null, source: 'ai_enhancement' },
      { label: 'Arabic Description', value: data.description_ar ? `${data.description_ar.substring(0, 50)}...` : null, source: 'ai_enhancement' },
      { label: 'Short Description', value: data.short_description, source: 'ai_enhancement' },
    ],
    'Images': [
      { label: 'Hero Image', value: data.hero_image ? 'Set' : null, source: 'image_extraction' },
      { label: 'Logo Image', value: data.logo_image ? 'Set' : null, source: 'image_extraction' },
      { label: 'Total Images', value: imagesCount, source: 'image_extraction' },
    ],
    'Ratings': [
      { label: 'Overall Rating', value: data.overall_rating, source: 'calculated' },
      { label: 'Google Rating', value: data.google_rating, source: 'apify' },
      { label: 'Google Review Count', value: data.google_review_count, source: 'apify' },
      { label: 'TripAdvisor Rating', value: data.tripadvisor_rating, source: 'firecrawl' },
      { label: 'Total Reviews', value: data.total_reviews_aggregated, source: 'apify' },
    ],
    'Relationships': [
      { label: 'Cuisines', value: cuisinesNames || (data.restaurant_cuisine_ids?.length ? `${data.restaurant_cuisine_ids.length} mapped` : null), source: 'data_mapping' },
      { label: 'Categories', value: categoriesNames || (data.restaurant_category_ids?.length ? `${data.restaurant_category_ids.length} mapped` : null), source: 'data_mapping' },
      { label: 'Features', value: featuresNames || (data.restaurant_feature_ids?.length ? `${data.restaurant_feature_ids.length} mapped` : null), source: 'data_mapping' },
      { label: 'Meals', value: mealsNames || (data.restaurant_meal_ids?.length ? `${data.restaurant_meal_ids.length} mapped` : null), source: 'data_mapping' },
      { label: 'Good For', value: goodForNames || (data.restaurant_good_for_ids?.length ? `${data.restaurant_good_for_ids.length} mapped` : null), source: 'data_mapping' },
    ],
    'Content': [
      { label: 'Dishes', value: dishesCount, source: 'ai_enhancement' },
      { label: 'FAQs', value: faqsCount, source: 'ai_enhancement' },
    ],
    'Operational': [
      { label: 'Hours', value: data.hours ? 'Set' : null, source: 'apify' },
      { label: 'Menu URL', value: data.menu_url, source: 'apify' },
      { label: 'Dress Code', value: data.dress_code, source: 'ai_enhancement' },
      { label: 'Reservations Policy', value: data.reservations_policy, source: 'ai_enhancement' },
      { label: 'Parking Info', value: data.parking_info, source: 'ai_enhancement' },
      { label: 'Payment Methods', value: data.payment_methods?.join(', '), source: 'ai_enhancement' },
    ],
  }

  // Calculate statistics
  const stats = {
    totalFields: 0,
    populatedFields: 0,
    bySource: {} as Record<string, { total: number; populated: number }>
  }

  // Count fields
  Object.values(fieldCategories).forEach(category => {
    category.forEach(field => {
      stats.totalFields++
      const hasValue = field.value !== null && field.value !== undefined && field.value !== ''
      
      if (hasValue) {
        stats.populatedFields++
      }

      // Track by source
      if (!stats.bySource[field.source]) {
        stats.bySource[field.source] = { total: 0, populated: 0 }
      }
      stats.bySource[field.source].total++
      if (hasValue) {
        stats.bySource[field.source].populated++
      }
    })
  })

  const completeness = Math.round((stats.populatedFields / stats.totalFields) * 100)

  return (
    <SectionCard title="📊 Extraction Report" className="w-full">
      <div className="space-y-6">
        {/* Statistics Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.populatedFields}/{stats.totalFields}</div>
            <div className="text-xs text-muted-foreground">Fields Populated</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{completeness}%</div>
            <div className="text-xs text-muted-foreground">Completeness</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{Object.keys(stats.bySource).length}</div>
            <div className="text-xs text-muted-foreground">Data Sources</div>
          </div>
        </div>

        {/* Field Categories */}
        <div className="space-y-4">
          {Object.entries(fieldCategories).map(([categoryName, fields]) => (
            <div key={categoryName} className="border rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-3 text-foreground">{categoryName}</h4>
              <div className="space-y-2">
                {fields.map((field, idx) => {
                  const hasValue = field.value !== null && field.value !== undefined && field.value !== ''
                  return (
                    <div key={idx} className="flex items-start justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {hasValue ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        )}
                        <span className="font-medium text-muted-foreground flex-shrink-0">{field.label}:</span>
                        <span className="text-foreground truncate">
                          {hasValue ? (typeof field.value === 'object' ? JSON.stringify(field.value).substring(0, 50) : String(field.value).substring(0, 80)) : 'Missing'}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {field.source}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Source Statistics */}
        <div className="border rounded-lg p-4 bg-muted/30">
          <h4 className="font-semibold text-sm mb-3 text-foreground">📈 By Source</h4>
          <div className="space-y-2">
            {Object.entries(stats.bySource).map(([source, sourceStats]) => {
              const sourceCompleteness = Math.round((sourceStats.populated / sourceStats.total) * 100)
              return (
                <div key={source} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{source}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-medium">
                      {sourceStats.populated}/{sourceStats.total}
                    </span>
                    <span className="text-xs text-muted-foreground">({sourceCompleteness}%)</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Raw Data Availability */}
        <div className="border rounded-lg p-4 bg-muted/30">
          <h4 className="font-semibold text-sm mb-3 text-foreground">💾 Raw Data</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Apify Output</span>
              {data.apify_output ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Firecrawl Output</span>
              {data.firecrawl_output ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">AI Enhancement Output</span>
              {data.ai_enhancement_output ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}


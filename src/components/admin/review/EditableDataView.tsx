'use client'

import { useState } from 'react'
import { EditableField } from '../ui/EditableField'
import { SectionCard } from '../layout/SectionCard'
import { DataSection } from '../layout/DataSection'
import { Badge } from '@/components/ui/badge'
import { Star, MapPin, Clock, Globe, Instagram, Facebook } from 'lucide-react'

interface RestaurantData {
  placeId?: string
  name?: string
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
  
  // AI-generated content fields
  description?: string
  short_description?: string
  meta_title?: string
  meta_description?: string

  // New comprehensive fields
  meals?: Array<{ id: number; name: string; slug: string }>
  allCuisines?: Array<{ id: number; name: string; slug: string }>
  accessibilityFeatures?: Array<{ id: number; name: string; slug: string; category: string }>
  allFeatures?: Array<{ id: number; name: string; slug: string; category: string }>
  categories?: Array<{ id: number; name: string; slug: string }>
  goodFor?: Array<{ id: number; name: string; slug: string }>
  awards?: Array<{ name: string; year: number; organization: string }>
  averageMealPrice?: number
  currency?: string
  googleDirectionsUrl?: string
  parkingInfo?: string
  paymentMethods?: string[]
  dressCode?: string
  michelinAward?: { id: number; name: string; stars: number }

  rawData?: {
    apify_output?: any
    firecrawl_output?: any
    firecrawl_menu_output?: any
    menu_data?: any
  }
}

interface EditableDataViewProps {
  data: RestaurantData
  onFieldUpdate: (field: string, value: string) => void
  loading?: boolean
  className?: string
}

export function EditableDataView({
  data,
  onFieldUpdate,
  loading = false,
  className = ''
}: EditableDataViewProps) {
  const getPriceLevel = (level?: number) => {
    if (!level) return 'N/A'
    return '$'.repeat(level)
  }

  // Helper function to safely convert any value to a string
  const safeStringValue = (value: any): string => {
    if (!value) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'number') return String(value)
    if (typeof value === 'object') {
      // If it's an array, join the names
      if (Array.isArray(value)) {
        return value.map(item => item.name || item).join(', ')
      }
      // If it's an object with a name property, use that
      if ('name' in value) return value.name
      // Otherwise stringify it
      return JSON.stringify(value)
    }
    return String(value)
  }

  const basicInfoFields = [
    { 
      label: 'Google Place ID', 
      value: data.placeId || '', 
      copyable: true,
      editable: false
    },
    { 
      label: 'Name', 
      value: data.name || '', 
      editable: true,
      field: 'name'
    },
    { 
      label: 'Slug', 
      value: data.slug || '', 
      editable: true,
      field: 'slug'
    },
    { 
      label: 'Cuisine', 
      value: data.cuisine || '', 
      editable: true,
      field: 'cuisine'
    },
    { 
      label: 'Address', 
      value: data.address || '', 
      editable: true,
      field: 'address',
      multiline: true
    },
    { 
      label: 'Neighborhood', 
      value: data.neighborhood || '', 
      editable: true,
      field: 'neighborhood'
    },
    { 
      label: 'Phone', 
      value: data.phone || '', 
      editable: true,
      field: 'phone'
    },
    { 
      label: 'Co-ordinates', 
      value: data.coordinates || '', 
      editable: true,
      field: 'coordinates'
    },
    { 
      label: 'Price Range', 
      value: getPriceLevel(data.priceLevel), 
      editable: true,
      field: 'priceLevel'
    },
    { 
      label: 'Website URL', 
      value: data.website || '', 
      link: data.website,
      editable: true,
      field: 'website'
    },
    { 
      label: 'Instagram', 
      value: data.instagram || '', 
      link: data.instagram,
      editable: true,
      field: 'instagram'
    },
    { 
      label: 'Facebook', 
      value: data.facebook || '', 
      link: data.facebook,
      editable: true,
      field: 'facebook'
    },
  ]

  const ratingsFields = [
    { 
      label: 'Google', 
      value: data.rating ? `${data.rating} (${data.reviewCount || 0} reviews)` : 'N/A',
      editable: false
    },
    { 
      label: 'TripAdvisor', 
      value: 'N/A',
      editable: true,
      field: 'tripadvisor_rating'
    },
    { 
      label: 'OpenTable', 
      value: 'N/A',
      editable: true,
      field: 'opentable_rating'
    },
  ]

  const operationalFields = [
    { 
      label: 'Hours', 
      value: data.hours || 'N/A',
      editable: true,
      field: 'hours',
      multiline: true
    },
  ]

  const renderEditableField = (field: any) => {
    if (field.editable) {
      return (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 font-medium">
            {field.label}
          </span>
          <div className="flex items-center space-x-2">
            <EditableField
              value={safeStringValue(field.value)}
              onSave={(newValue) => onFieldUpdate(field.field, newValue)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              multiline={field.multiline}
              className="w-48"
            />
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 font-medium">
          {field.label}
        </span>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-900 font-medium text-right break-all">
            {safeStringValue(field.value)}
          </span>
          {field.copyable && (
            <button
              onClick={() => navigator.clipboard.writeText(safeStringValue(field.value))}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Copy
            </button>
          )}
          {field.link && (
            <a
              href={field.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              View
            </a>
          )}
        </div>
      </div>
    )
  }

  const contentFields = [
    { 
      label: 'Short Description', 
      value: data.short_description || '', 
      editable: true,
      field: 'short_description',
      multiline: true
    },
    { 
      label: 'Description', 
      value: data.description || '', 
      editable: true,
      field: 'description',
      multiline: true
    },
    { 
      label: 'Meta Title', 
      value: data.meta_title || '', 
      editable: true,
      field: 'meta_title'
    },
    { 
      label: 'Meta Description', 
      value: data.meta_description || '', 
      editable: true,
      field: 'meta_description',
      multiline: true
    },
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Content */}
      <SectionCard
        title="Content"
        icon="📝"
        defaultCollapsed={false}
      >
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-1"></div>
                <div className="h-12 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {contentFields.map((field, index) => (
              <div key={index}>
                {renderEditableField(field)}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Basic Information */}
      <SectionCard
        title="Basic Information"
        icon="ℹ️"
        defaultCollapsed={false}
      >
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {basicInfoFields.map((field, index) => (
              <div key={index}>
                {renderEditableField(field)}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Ratings */}
      <SectionCard
        title="Ratings"
        icon="⭐"
        defaultCollapsed={false}
      >
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {ratingsFields.map((field, index) => (
              <div key={index}>
                {renderEditableField(field)}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Operational Info */}
      <SectionCard
        title="Operational Info"
        icon="🕒"
        defaultCollapsed={false}
      >
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 1 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {operationalFields.map((field, index) => (
              <div key={index}>
                {renderEditableField(field)}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Restaurant Meals */}
      {data.meals && data.meals.length > 0 && (
        <SectionCard
          title="Restaurant Meals"
          icon="🍽️"
          defaultCollapsed={false}
        >
          <div className="flex flex-wrap gap-2">
            {data.meals.map(meal => (
              <span key={meal.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {meal.name}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Cuisines */}
      {data.allCuisines && data.allCuisines.length > 0 && (
        <SectionCard
          title="Cuisines"
          icon="🍴"
          defaultCollapsed={false}
        >
          <div className="flex flex-wrap gap-2">
            {data.allCuisines.map(cuisine => (
              <span key={cuisine.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {cuisine.name}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Accessibility & Features */}
      {((data.accessibilityFeatures?.length || 0) > 0 || (data.allFeatures?.length || 0) > 0) && (
        <SectionCard
          title="Accessibility & Features"
          icon="♿"
          defaultCollapsed={false}
        >
          <div className="space-y-3">
            {data.accessibilityFeatures && data.accessibilityFeatures.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Accessibility</h4>
                <div className="flex flex-wrap gap-2">
                  {data.accessibilityFeatures.map(feature => (
                    <span key={feature.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {feature.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {data.allFeatures && data.allFeatures.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">All Features</h4>
                <div className="flex flex-wrap gap-2">
                  {data.allFeatures.map(feature => (
                    <span key={feature.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {feature.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Pricing Details */}
      <SectionCard
        title="Pricing Details"
        icon="💰"
        defaultCollapsed={false}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Price Level</span>
            <span className="text-sm font-medium">{getPriceLevel(data.priceLevel)}</span>
          </div>
          {data.averageMealPrice && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Meal Price</span>
              <span className="text-sm font-medium">{data.averageMealPrice} {data.currency || 'KWD'}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Currency</span>
            <span className="text-sm font-medium">{data.currency || 'KWD'}</span>
          </div>
        </div>
      </SectionCard>

      {/* Awards & Recognitions */}
      {data.awards && data.awards.length > 0 && (
        <SectionCard
          title="Awards & Recognitions"
          icon="🏆"
          defaultCollapsed={false}
        >
          <div className="space-y-2">
            {data.awards.map((award, idx) => (
              <div key={idx} className="p-2 bg-gray-50 rounded">
                <div className="font-medium text-sm">{award.name}</div>
                <div className="text-xs text-gray-600">{award.year} - {award.organization}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Additional Details */}
      <SectionCard
        title="Additional Details"
        icon="ℹ️"
        defaultCollapsed={false}
      >
        <div className="space-y-2">
          {data.dressCode && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Dress Code</span>
              <span className="text-sm font-medium">{data.dressCode}</span>
            </div>
          )}
          {data.parkingInfo && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Parking Info</span>
              <span className="text-sm font-medium">{data.parkingInfo}</span>
            </div>
          )}
          {data.paymentMethods && data.paymentMethods.length > 0 && (
            <div>
              <span className="text-sm text-gray-600">Payment Methods:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {data.paymentMethods.map(method => (
                  <span key={method} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    {method}
                  </span>
                ))}
              </div>
            </div>
          )}
          {data.googleDirectionsUrl && (
            <div className="pt-2">
              <a 
                href={data.googleDirectionsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
              >
                📍 Open in Google Maps
              </a>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Debug: Raw Extraction Data */}
      {data.rawData && (
        <SectionCard
          title="Raw Extraction Data (Debug)"
          icon="🔍"
          defaultCollapsed={true}
        >
          <div className="space-y-4">
            {data.rawData.apify_output && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Apify Output</h4>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(data.rawData.apify_output, null, 2)}
                </pre>
              </div>
            )}
            
            {data.rawData.firecrawl_output && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Firecrawl Output</h4>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(data.rawData.firecrawl_output, null, 2)}
                </pre>
              </div>
            )}
            
            {data.rawData.menu_data && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Menu Data</h4>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(data.rawData.menu_data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  )
}

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface HotelRatingBreakdownProps {
  overallRating: number
  ratingBreakdown: {
    room_quality?: number
    service?: number
    cleanliness?: number
    location?: number
    value_for_money?: number
    amenities?: number
    calculated_at?: string
    algorithm_version?: string
  }
  totalReviews: number
  ratingDescription: string
  ratingColor: string
}

export function HotelRatingBreakdown({
  overallRating,
  ratingBreakdown,
  totalReviews,
  ratingDescription,
  ratingColor
}: HotelRatingBreakdownProps) {
  // Safe accessor with fallback to 0
  const safeValue = (value: number | undefined): number => {
    return typeof value === 'number' && !isNaN(value) ? value : 0
  }

  const ratingComponents = [
    {
      key: 'room_quality',
      label: 'Room Quality',
      value: safeValue(ratingBreakdown?.room_quality),
      weight: '30%',
      description: 'Room comfort, cleanliness, and amenities quality'
    },
    {
      key: 'service',
      label: 'Service',
      value: safeValue(ratingBreakdown?.service),
      weight: '25%',
      description: 'Staff friendliness, efficiency, and responsiveness'
    },
    {
      key: 'cleanliness',
      label: 'Cleanliness',
      value: safeValue(ratingBreakdown?.cleanliness),
      weight: '20%',
      description: 'Overall hygiene and maintenance standards'
    },
    {
      key: 'location',
      label: 'Location',
      value: safeValue(ratingBreakdown?.location),
      weight: '10%',
      description: 'Convenience, accessibility, and surroundings'
    },
    {
      key: 'value_for_money',
      label: 'Value for Money',
      value: safeValue(ratingBreakdown?.value_for_money),
      weight: '10%',
      description: 'Price vs quality ratio and overall value'
    },
    {
      key: 'amenities',
      label: 'Amenities',
      value: safeValue(ratingBreakdown?.amenities),
      weight: '5%',
      description: 'Available facilities and hotel features'
    }
  ]

  const getRatingColor = (rating: number) => {
    if (rating >= 8.0) return 'text-green-600'
    if (rating >= 6.0) return 'text-yellow-600'
    if (rating >= 4.0) return 'text-orange-600'
    return 'text-red-600'
  }

  const safeOverallRating = typeof overallRating === 'number' && !isNaN(overallRating) ? overallRating : 0
  const safeAlgorithmVersion = ratingBreakdown?.algorithm_version || 'N/A'
  const safeCalculatedAt = ratingBreakdown?.calculated_at || new Date().toISOString()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Hotel Rating Breakdown</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              v{safeAlgorithmVersion}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {totalReviews} reviews
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Rating Display */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-3xl font-bold mb-2">
            <span className={ratingColor}>{safeOverallRating.toFixed(1)}</span>
            <span className="text-gray-500 text-lg">/10</span>
          </div>
          <div className={`text-lg font-medium ${ratingColor}`}>
            {ratingDescription}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Based on {totalReviews} aggregated reviews
          </div>
        </div>

        {/* Individual Rating Components */}
        <div className="space-y-4">
          {ratingComponents.map((component) => (
            <div key={component.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">{component.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {component.weight}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${getRatingColor(component.value)}`}>
                    {component.value.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500">/10</span>
                </div>
              </div>

              <Progress
                value={component.value * 10}
                className="h-2"
              />

              <p className="text-xs text-gray-600">
                {component.description}
              </p>
            </div>
          ))}
        </div>

        {/* Algorithm Info */}
        <div className="pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Calculated on {new Date(safeCalculatedAt).toLocaleDateString()} using BestGoa.com algorithm v{safeAlgorithmVersion}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

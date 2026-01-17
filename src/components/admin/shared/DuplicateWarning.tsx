'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Eye, RefreshCw, X } from 'lucide-react'
import Link from 'next/link'

interface DuplicateRestaurant {
  id: string
  name: string
  slug: string
  address: string
  area: string
  verified: boolean
  active: boolean
  google_place_id: string
}

interface DuplicateWarningProps {
  duplicates: DuplicateRestaurant[]
  matchType: 'exact' | 'fuzzy'
  onOverride: () => void
  onCancel: () => void
  onViewExisting: (restaurantId: string) => void
}

export function DuplicateWarning({ 
  duplicates, 
  matchType, 
  onOverride, 
  onCancel, 
  onViewExisting 
}: DuplicateWarningProps) {
  const [viewingRestaurant, setViewingRestaurant] = useState<string | null>(null)

  const getMatchTypeColor = (type: string) => {
    switch (type) {
      case 'exact':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'fuzzy':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getMatchTypeText = (type: string) => {
    switch (type) {
      case 'exact':
        return 'Exact Match'
      case 'fuzzy':
        return 'Similar Restaurant'
      default:
        return 'Potential Duplicate'
    }
  }

  const getStatusBadge = (restaurant: DuplicateRestaurant) => {
    if (restaurant.verified && restaurant.active) {
      return <Badge variant="outline" className="bg-green-100 text-green-800">Published</Badge>
    }
    if (restaurant.verified && !restaurant.active) {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800">Verified</Badge>
    }
    return <Badge variant="secondary">Draft</Badge>
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              <div>
                <CardTitle className="text-lg">
                  {matchType === 'exact' ? 'Exact Duplicate Found' : 'Similar Restaurant Found'}
                </CardTitle>
                <CardDescription>
                  {matchType === 'exact' 
                    ? 'This restaurant already exists in the database with the same Google Place ID.'
                    : 'A similar restaurant was found that might be the same location.'
                  }
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Match Type Badge */}
          <div className="flex items-center gap-2">
            <Badge className={getMatchTypeColor(matchType)}>
              {getMatchTypeText(matchType)}
            </Badge>
            <span className="text-sm text-gray-600">
              {duplicates.length} {duplicates.length === 1 ? 'restaurant' : 'restaurants'} found
            </span>
          </div>

          {/* Existing Restaurants */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Existing Restaurant{duplicates.length > 1 ? 's' : ''}:</h4>
            {duplicates.map((restaurant) => (
              <div key={restaurant.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium">{restaurant.name}</h5>
                      {getStatusBadge(restaurant)}
                    </div>
                    <p className="text-sm text-gray-600">{restaurant.address}</p>
                    <p className="text-xs text-gray-500">{restaurant.area}</p>
                    <p className="text-xs text-gray-500">ID: {restaurant.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewExisting(restaurant.id)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {matchType === 'exact' 
                  ? 'This appears to be the exact same restaurant. Consider updating the existing entry instead of creating a duplicate.'
                  : 'This might be the same restaurant with slightly different information. Please review carefully.'
                }
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                onClick={onOverride}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Continue Anyway (Different Location)
              </Button>
              <Button
                onClick={onCancel}
                variant="outline"
                className="flex-1"
              >
                Cancel Import
              </Button>
            </div>
          </div>

          {/* Help Text */}
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Exact Match:</strong> Same Google Place ID - likely the same restaurant</p>
            <p><strong>Similar Match:</strong> Similar name and area - might be the same restaurant</p>
            <p><strong>Continue Anyway:</strong> Only if this is definitely a different location</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


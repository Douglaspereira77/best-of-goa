'use client'

import { useState } from 'react'
import { Search, Play, Star, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ActionButton } from '../ui/ActionButton'
import { SectionCard } from '../layout/SectionCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface PlaceResult {
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

interface SearchContextProps {
  onSearch: (query: string) => void
  onSelectRestaurant: (restaurant: PlaceResult) => void
  onRunExtraction: () => void
  searchResults: PlaceResult[]
  selectedRestaurant: PlaceResult | null
  isSearching: boolean
  className?: string
}

export function SearchContext({ 
  onSearch, 
  onSelectRestaurant, 
  onRunExtraction,
  searchResults, 
  selectedRestaurant, 
  isSearching, 
  className = '' 
}: SearchContextProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim())
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const getPriceLevel = (level: number | null) => {
    if (!level) return 'N/A'
    return '$'.repeat(level)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <SectionCard
        title="Restaurant Sources"
        icon="ðŸ”"
        defaultCollapsed={false}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Search for a restaurant in Goa...
            </label>
            <div className="flex space-x-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter restaurant name..."
                className="flex-1"
              />
              <ActionButton
                onClick={handleSearch}
                disabled={!searchQuery.trim() || isSearching}
                loading={isSearching}
                size="md"
                className="px-6"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </ActionButton>
            </div>
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">
                  Search Results ({searchResults.length})
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSearch(searchQuery)}
                  className="text-xs"
                >
                  <Search className="w-3 h-3 mr-1" />
                  Search Again
                </Button>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((result) => (
                  <div
                    key={result.place_id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedRestaurant?.place_id === result.place_id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => onSelectRestaurant(result)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h5 className="font-medium text-gray-900 truncate">
                            {result.name}
                          </h5>
                          {selectedRestaurant?.place_id === result.place_id && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              Selected
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {result.formatted_address}
                        </p>
                        
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {result.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span>{result.rating}</span>
                              <span>({result.user_ratings_total} reviews)</span>
                            </div>
                          )}
                          {result.price_level && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">
                                {getPriceLevel(result.price_level)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>
                              {result.geometry.location.lat?.toFixed(4)}, {result.geometry.location.lng?.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {result.photos && result.photos.length > 0 && (
                        <div className="ml-3 flex-shrink-0">
                          <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                            <img
                              src={result.photos[0].url}
                              alt={result.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Run Button */}
          {selectedRestaurant && (
            <div className="pt-4 border-t">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Selected: {selectedRestaurant.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      Ready to start extraction
                    </p>
                  </div>
                  <ActionButton
                    onClick={onRunExtraction}
                    size="md"
                    className="px-6"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Run
                  </ActionButton>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500">
            <p>Search for restaurants using Google Places API, select one, then run extraction.</p>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
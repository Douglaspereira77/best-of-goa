'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarInset } from '@/components/ui/sidebar'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, MapPin, Star, Loader2, CheckCircle, AlertCircle, Dumbbell } from 'lucide-react'

interface GooglePlaceResult {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  rating?: number
  user_ratings_total?: number
  types?: string[]
  opening_hours?: {
    open_now?: boolean
  }
}

export default function AddFitnessPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GooglePlaceResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<GooglePlaceResult | null>(null)
  const [startingExtraction, setStartingExtraction] = useState(false)
  const [extractionStarted, setExtractionStarted] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [, setNewFitnessId] = useState<string | null>(null)

  const searchFitnessPlaces = async () => {
    if (!searchQuery.trim()) return

    try {
      setSearching(true)
      setSearchError(null)
      setSearchResults([])
      setSelectedPlace(null)

      const response = await fetch('/api/admin/fitness/search-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery + ' Goa' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      setSearchResults(data.results || [])
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchFitnessPlaces()
    }
  }

  const startExtraction = async (place: GooglePlaceResult) => {
    try {
      setStartingExtraction(true)
      setExtractionError(null)
      setSelectedPlace(place)

      const response = await fetch('/api/admin/fitness/start-extraction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: place.place_id,
          name: place.name,
          address: place.formatted_address,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          placeData: place
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start extraction')
      }

      setExtractionStarted(true)
      setNewFitnessId(data.fitnessPlaceId)

      // Redirect to queue after 2 seconds
      setTimeout(() => {
        router.push('/admin/fitness/queue')
      }, 2000)
    } catch (err) {
      setExtractionError(err instanceof Error ? err.message : 'Failed to start extraction')
    } finally {
      setStartingExtraction(false)
    }
  }

  const getFitnessType = (types: string[] = []) => {
    const typeMap: Record<string, string> = {
      gym: 'Gym',
      health: 'Fitness Center',
      spa: 'Spa & Wellness',
      sports_complex: 'Sports Complex',
      stadium: 'Stadium'
    }

    for (const type of types) {
      if (typeMap[type]) {
        return typeMap[type]
      }
    }
    return 'Fitness Center'
  }

  return (
    <SidebarInset>
      <AdminPageHeader
        title="Add Fitness Place"
        description="Search and add fitness centers to the directory"
        breadcrumbs={[
          { label: 'Fitness', href: '/admin/fitness' },
          { label: 'Add' }
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle>Search for Fitness Centers</CardTitle>
            <CardDescription>
              Search Google Places for gyms, yoga studios, CrossFit boxes, and fitness centers in Goa. The system will automatically extract and enhance the data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search for gyms, yoga studios, CrossFit boxes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                  disabled={startingExtraction}
                />
              </div>
              <Button
                onClick={searchFitnessPlaces}
                disabled={searching || !searchQuery.trim() || startingExtraction}
              >
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Search'
                )}
              </Button>
            </div>

            {searchError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                {searchError}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Extraction Success Message */}
        {extractionStarted && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <div className="font-medium text-green-900">Extraction Started!</div>
                  <div className="text-sm text-green-700">
                    {selectedPlace?.name} has been added to the extraction queue. Redirecting to queue monitor...
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Extraction Error Message */}
        {extractionError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div className="flex-1">
                  <div className="font-medium text-red-900">Extraction Failed</div>
                  <div className="text-sm text-red-700">{extractionError}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && !extractionStarted && (
          <Card>
            <CardHeader>
              <CardTitle>Search Results ({searchResults.length})</CardTitle>
              <CardDescription>
                Select a fitness center to start the extraction process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {searchResults.map((place) => (
                  <div
                    key={place.place_id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Dumbbell className="w-4 h-4 text-gray-400" />
                          <h3 className="font-medium">{place.name}</h3>
                          {place.types && (
                            <Badge variant="secondary" className="text-xs">
                              {getFitnessType(place.types)}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                          <MapPin className="w-3 h-3" />
                          {place.formatted_address}
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          {place.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{place.rating}</span>
                              {place.user_ratings_total && (
                                <span className="text-gray-500">
                                  ({place.user_ratings_total} reviews)
                                </span>
                              )}
                            </div>
                          )}

                          {place.opening_hours?.open_now !== undefined && (
                            <Badge
                              variant={place.opening_hours.open_now ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {place.opening_hours.open_now ? 'Open Now' : 'Closed'}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => startExtraction(place)}
                        disabled={startingExtraction || extractionStarted}
                        size="sm"
                      >
                        {startingExtraction && selectedPlace?.place_id === place.place_id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Starting...
                          </>
                        ) : (
                          'Add to Directory'
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Results Message */}
        {!searching && searchResults.length === 0 && searchQuery && !extractionStarted && (
          <Card>
            <CardContent className="p-8 text-center">
              <Dumbbell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 mb-2">No fitness centers found</p>
              <p className="text-sm text-gray-400">Try searching with a different term or location</p>
            </CardContent>
          </Card>
        )}
      </div>
    </SidebarInset>
  )
}
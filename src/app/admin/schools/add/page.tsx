'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarInset } from '@/components/ui/sidebar'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, GraduationCap, Star, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

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

export default function AddSchoolPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GooglePlaceResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<GooglePlaceResult | null>(null)
  const [startingExtraction, setStartingExtraction] = useState(false)
  const [extractionStarted, setExtractionStarted] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [newSchoolId, setNewSchoolId] = useState<string | null>(null)

  const searchSchools = async () => {
    if (!searchQuery.trim()) return

    try {
      setSearching(true)
      setSearchError(null)
      setSearchResults([])
      setSelectedPlace(null)

      const response = await fetch('/api/admin/schools/search-places', {
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
      searchSchools()
    }
  }

  const startExtraction = async (place: GooglePlaceResult) => {
    try {
      setStartingExtraction(true)
      setExtractionError(null)
      setSelectedPlace(place)

      const response = await fetch('/api/admin/schools/start-extraction', {
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
      setNewSchoolId(data.schoolId)

      // Redirect to queue after 2 seconds
      setTimeout(() => {
        router.push('/admin/schools/queue')
      }, 2000)
    } catch (err) {
      setExtractionError(err instanceof Error ? err.message : 'Failed to start extraction')
    } finally {
      setStartingExtraction(false)
    }
  }

  const getSchoolType = (types: string[] = []) => {
    const typeMap: Record<string, string> = {
      school: 'School',
      primary_school: 'Primary School',
      secondary_school: 'Secondary School',
      university: 'University',
      preschool: 'Preschool',
      kindergarten: 'Kindergarten'
    }

    for (const type of types) {
      if (typeMap[type]) {
        return typeMap[type]
      }
    }
    return 'School'
  }

  return (
    <SidebarInset>
      <AdminPageHeader
        title="Add School"
        description="Search and add schools to the directory"
        breadcrumbs={[
          { label: 'Schools', href: '/admin/schools' },
          { label: 'Add' }
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle>Search for Schools</CardTitle>
            <CardDescription>
              Search Google Places for schools in Goa. The system will automatically extract and enhance the data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search for schools, universities, academies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                  disabled={startingExtraction}
                />
              </div>
              <Button
                onClick={searchSchools}
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
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-medium text-green-900">Extraction Started!</h3>
                  <p className="text-sm text-green-700">
                    Redirecting to queue to monitor progress...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Extraction Error */}
        {extractionError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <div>
                  <h3 className="font-medium text-red-900">Extraction Failed</h3>
                  <p className="text-sm text-red-700">{extractionError}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && !extractionStarted && (
          <Card>
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>
                Found {searchResults.length} schools. Click to start extraction.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {searchResults.map((place) => (
                  <div
                    key={place.place_id}
                    className={`p-4 border rounded-lg transition-colors ${
                      selectedPlace?.place_id === place.place_id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{place.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {getSchoolType(place.types)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                          <GraduationCap className="w-3 h-3" />
                          {place.formatted_address}
                        </div>
                        {place.rating && (
                          <div className="flex items-center gap-1 mt-2">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{place.rating}</span>
                            <span className="text-gray-500 text-sm">
                              ({place.user_ratings_total} reviews)
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => startExtraction(place)}
                        disabled={startingExtraction}
                        size="sm"
                      >
                        {startingExtraction && selectedPlace?.place_id === place.place_id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Starting...
                          </>
                        ) : (
                          'Add & Extract'
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!searching && searchResults.length === 0 && searchQuery && !searchError && (
          <Card>
            <CardContent className="p-8 text-center">
              <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">No results found</h3>
              <p className="text-gray-500 mt-1">
                Try different search terms or check the spelling
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </SidebarInset>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { ThreeColumnLayout } from '@/components/admin/layout/ThreeColumnLayout'
import { ProgressSidebar, StepStatus } from '@/components/admin/layout/ProgressSidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
  exists_in_db?: boolean
  existing_hotel?: {
    id: string
    name: string
    slug: string
    extraction_status: string
  } | null
}

type ExtractionStep = {
  name: string
  displayName: string
  status: StepStatus
  startedAt?: string
  completedAt?: string
  error?: string
}

export default function AddHotelPage() {
  // Hydration state
  const [isHydrated, setIsHydrated] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([])
  const [selectedHotel, setSelectedHotel] = useState<PlaceResult | null>(null)

  // Extraction state
  const [isExtracting, setIsExtracting] = useState(false)
  const [hotelId, setHotelId] = useState<string | null>(null)
  const [extractionSteps, setExtractionSteps] = useState<ExtractionStep[]>([
    { name: 'initial_creation', displayName: 'Initial Creation', status: 'pending' },
    { name: 'apify_fetch', displayName: 'Google Places Data', status: 'pending' },
    { name: 'firecrawl_general', displayName: 'General Info Search', status: 'pending' },
    { name: 'firecrawl_rooms', displayName: 'Room Types & Amenities', status: 'pending' },
    { name: 'firecrawl_website', displayName: 'Website Scraping', status: 'pending' },
    { name: 'firecrawl_social_media_search', displayName: 'Social Media Search', status: 'pending' },
    { name: 'apify_reviews', displayName: 'Reviews Extraction', status: 'pending' },
    { name: 'firecrawl_tripadvisor', displayName: 'TripAdvisor Search', status: 'pending' },
    { name: 'firecrawl_booking_com', displayName: 'Booking.com Search', status: 'pending' },
    { name: 'process_images', displayName: 'Processing Images', status: 'pending' },
    { name: 'ai_sentiment', displayName: 'AI Sentiment Analysis', status: 'pending' },
    { name: 'ai_enhancement', displayName: 'AI Content Enhancement', status: 'pending' },
    { name: 'data_mapping', displayName: 'Database Mapping', status: 'pending' },
  ])
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)

  // Hotel data state
  const [hotelData, setHotelData] = useState<any>({})
  const [error, setError] = useState<string | null>(null)

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

  // Search for hotels
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setError(null)
    setSelectedHotel(null)
    setSearchResults([])
    setHotelData({})

    try {
      const response = await fetch('/api/admin/hotels/search-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      if (data.results && data.results.length > 0) {
        setSearchResults(data.results)
      } else {
        setError('No hotels found for this search')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  // Handle hotel selection
  const handleSelectHotel = (hotel: PlaceResult) => {
    setSelectedHotel(hotel)
  }

  // Start extraction
  const handleRunExtraction = async () => {
    if (!selectedHotel) return

    setIsExtracting(true)
    setError(null)
    setHotelId(null)

    // Reset steps
    setExtractionSteps(prev => prev.map(step => ({ ...step, status: 'pending' as StepStatus })))

    try {
      const response = await fetch('/api/admin/hotels/start-extraction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          place_id: selectedHotel.place_id,
          search_query: selectedHotel.name,
          place_data: selectedHotel,
          override: selectedHotel.exists_in_db // Pass override flag for re-extraction
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific case where hotel exists (fallback if override wasn't passed)
        if (data.exists) {
          setError(`Hotel "${data.hotel_name}" already exists (Status: ${data.extraction_status}). Use Re-extract button to override.`)
        } else {
          throw new Error(data.error || 'Failed to start extraction')
        }
        setIsExtracting(false)
        return
      }

      setHotelId(data.hotel_id)

      // Start polling for status
      startPolling(data.hotel_id)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start extraction')
      setIsExtracting(false)
    }
  }

  const startPolling = (hotelId: string) => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current)
    }

    pollStatus(hotelId)

    pollingInterval.current = setInterval(() => {
      pollStatus(hotelId)
    }, 2000)
  }

  const pollStatus = async (hotelId: string) => {
    try {
      const response = await fetch(`/api/admin/hotels/extraction-status/${hotelId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch status')
      }

      console.log('[Polling] Status:', data.status, '| Progress:', data.progress_percentage + '%')

      // Update extraction steps
      if (data.steps) {
        setExtractionSteps(prev => prev.map(step => {
          const stepData = data.steps.find((s: any) => s.name === step.name)
          if (!stepData) return step

          return {
            ...step,
            status: stepData.status,
            startedAt: stepData.started_at,
            completedAt: stepData.completed_at,
            error: stepData.error
          }
        }))
      }

      // Update hotel data
      if (data.extracted_data) {
        setHotelData(data.extracted_data)
      }

      // Stop polling if completed or failed
      if (data.status === 'completed' || data.status === 'failed') {
        console.log('[Polling] Extraction finished! Status:', data.status)
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current)
          pollingInterval.current = null
        }
        setIsExtracting(false)
      }
    } catch (err) {
      console.error('Status polling error:', err)
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
            <h1 className="text-lg font-semibold">Add Hotel</h1>
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
        title="Add Hotel"
        description="Add hotels to the Best of Goa directory"
        breadcrumbs={[
          { label: 'Hotels', href: '/admin/hotels' },
          { label: 'Add Hotel' }
        ]}
      />

      <ThreeColumnLayout
        leftColumn={
          <div className="space-y-6">
            {/* Search Section */}
            <Card>
              <CardHeader>
                <CardTitle>Search Hotels</CardTitle>
                <CardDescription>Search Google Places for hotels in Goa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Four Seasons Goa"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    disabled={isSearching || isExtracting}
                  />
                  <Button onClick={handleSearch} disabled={isSearching || isExtracting}>
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Results ({searchResults.length})</h3>
                    {searchResults.map((result) => (
                      <div
                        key={result.place_id}
                        className={`p-3 border rounded-lg transition-colors ${
                          result.exists_in_db
                            ? 'border-amber-300 bg-amber-50'
                            : selectedHotel?.place_id === result.place_id
                              ? 'border-blue-500 bg-blue-50 cursor-pointer hover:bg-blue-100'
                              : 'cursor-pointer hover:bg-gray-50'
                        }`}
                        onClick={() => !result.exists_in_db && handleSelectHotel(result)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{result.name}</div>
                          {result.exists_in_db && (
                            <span className="text-xs font-medium px-2 py-1 bg-amber-200 text-amber-800 rounded-full">
                              Already in DB
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">{result.formatted_address}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {result.rating && `${result.rating}â­ (${result.user_ratings_total} reviews)`}
                        </div>

                        {/* Existing hotel info and actions */}
                        {result.exists_in_db && result.existing_hotel && (
                          <div className="mt-2 pt-2 border-t border-amber-200">
                            <div className="text-xs text-amber-700 mb-2">
                              Status: <span className="font-medium">{result.existing_hotel.extraction_status}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(`/places-to-stay/hotels/${result.existing_hotel!.slug}`, '_blank')
                                }}
                              >
                                View Hotel
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(`/admin/hotels/${result.existing_hotel!.id}/review`, '_blank')
                                }}
                              >
                                Review Data
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="text-xs"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (confirm('Re-extract will overwrite existing data. Continue?')) {
                                    handleSelectHotel(result)
                                  }
                                }}
                                disabled={isExtracting}
                              >
                                Re-extract
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Run Button */}
                {selectedHotel && (
                  <Button
                    onClick={handleRunExtraction}
                    disabled={isExtracting}
                    className="w-full"
                    size="lg"
                  >
                    {isExtracting ? 'Extracting...' : 'Run Extraction'}
                  </Button>
                )}

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress Sidebar */}
            <ProgressSidebar
              steps={extractionSteps}
              currentStep={extractionSteps.find(s => s.status === 'running')?.name}
            />
          </div>
        }
        centerColumn={
          <Card>
            <CardHeader>
              <CardTitle>Hotel Data</CardTitle>
              <CardDescription>Extracted hotel information</CardDescription>
            </CardHeader>
            <CardContent>
              {isExtracting && !hotelData.name && (
                <div className="text-center py-8 text-gray-500">
                  Extraction in progress...
                </div>
              )}

              {hotelData.name && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{hotelData.name}</h3>
                    {hotelData.star_rating && (
                      <div className="text-sm text-gray-600">{hotelData.star_rating}â­ Hotel</div>
                    )}
                  </div>

                  {hotelData.address && (
                    <div>
                      <div className="text-sm font-medium text-gray-700">Address</div>
                      <div className="text-sm">{hotelData.address}</div>
                    </div>
                  )}

                  {hotelData.phone && (
                    <div>
                      <div className="text-sm font-medium text-gray-700">Phone</div>
                      <div className="text-sm">{hotelData.phone}</div>
                    </div>
                  )}

                  {hotelData.website && (
                    <div>
                      <div className="text-sm font-medium text-gray-700">Website</div>
                      <a href={hotelData.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                        {hotelData.website}
                      </a>
                    </div>
                  )}

                  {hotelData.google_rating && (
                    <div>
                      <div className="text-sm font-medium text-gray-700">Rating</div>
                      <div className="text-sm">{hotelData.google_rating}â­ ({hotelData.google_review_count} reviews)</div>
                    </div>
                  )}

                  {hotelData.description && (
                    <div>
                      <div className="text-sm font-medium text-gray-700">Description</div>
                      <div className="text-sm">{hotelData.description}</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        }
        rightColumn={
          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
              <CardDescription>Discovered social media profiles</CardDescription>
            </CardHeader>
            <CardContent>
              {hotelData.instagram || hotelData.facebook || hotelData.twitter ? (
                <div className="space-y-2">
                  {hotelData.instagram && (
                    <div>
                      <span className="text-sm font-medium">Instagram: </span>
                      <a href={hotelData.instagram} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                        {hotelData.instagram}
                      </a>
                    </div>
                  )}
                  {hotelData.facebook && (
                    <div>
                      <span className="text-sm font-medium">Facebook: </span>
                      <a href={hotelData.facebook} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                        {hotelData.facebook}
                      </a>
                    </div>
                  )}
                  {hotelData.twitter && (
                    <div>
                      <span className="text-sm font-medium">Twitter: </span>
                      <a href={hotelData.twitter} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                        {hotelData.twitter}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  {isExtracting ? 'Searching...' : 'No social media found yet'}
                </div>
              )}
            </CardContent>
          </Card>
        }
      />
    </SidebarInset>
  )
}

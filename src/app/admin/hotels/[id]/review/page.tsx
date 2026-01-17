'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SidebarInset } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { ThreeColumnLayout } from '@/components/admin/layout/ThreeColumnLayout'
import { ReviewSidebar } from '@/components/admin/review/ReviewSidebar'
import { EditableDataView } from '@/components/admin/review/EditableDataView'
import { ImageApproval } from '@/components/admin/review/ImageApproval'
import { PreviewPanel } from '@/components/admin/review/PreviewPanel'

interface HotelData {
  id: string
  name: string
  thumbnail?: string
  status: 'draft' | 'published' | 'pending'
  qualityScore: number
  placeId?: string
  google_place_id?: string
  slug?: string
  star_rating?: number
  check_in_time?: string
  check_out_time?: string
  room_count?: number
  address?: string
  neighborhood?: string
  phone?: string
  coordinates?: string
  priceLevel?: number
  website?: string
  instagram?: string
  facebook?: string
  twitter?: string
  tiktok?: string
  youtube?: string
  linkedin?: string
  rating?: number
  reviewCount?: number
  photos?: Array<{ url: string; alt?: string }>

  // AI-generated content fields
  description?: string
  short_description?: string
  meta_title?: string
  meta_description?: string

  // Comprehensive fields
  amenities?: Array<{ id: number; name: string; slug: string; category: string }>
  categories?: Array<{ id: number; name: string; slug: string }>
  features?: Array<{ id: number; name: string; slug: string; category: string }>
  googleDirectionsUrl?: string

  rawData?: {
    apify_output?: any
    firecrawl_output?: any
  }
}

interface RoomType {
  id: string
  name: string
  description?: string
  capacity?: number
  price_per_night?: number
  amenities?: string[]
}

interface FAQ {
  id: string
  question: string
  answer: string
  display_order: number
}

interface ImageData {
  id: string
  url: string
  alt?: string
  status: 'pending' | 'approved' | 'rejected'
  quality?: number
  tags?: string[]
  isHero?: boolean
  displayOrder?: number
}

export default function HotelReviewPage() {
  const params = useParams()
  const router = useRouter()
  const hotelId = params.id as string

  // Client-only mounting state to prevent SSR hydration issues
  const [isMounted, setIsMounted] = useState(false)

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isReRunningExtraction, setIsReRunningExtraction] = useState(false)
  const [extractionProgress, setExtractionProgress] = useState<{
    isRunning: boolean
    currentStep?: string
    progress?: number
    steps?: Array<{
      name: string
      status: 'pending' | 'running' | 'completed' | 'failed'
      displayName?: string
      error?: string
    }>
  }>({ isRunning: false })

  // Hotel data
  const [hotel, setHotel] = useState<HotelData | null>(null)
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [images, setImages] = useState<ImageData[]>([])

  // Error state
  const [error, setError] = useState<string | null>(null)

  // Mount effect - runs only on client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load hotel data
  useEffect(() => {
    if (hotelId && isMounted) {
      loadHotelData()
      loadImages()
      // Also load extraction status to show current progress
      loadExtractionStatus()
    }
  }, [hotelId, isMounted])

  const loadImages = async () => {
    try {
      const response = await fetch(`/api/admin/hotels/${hotelId}/images`)
      const data = await response.json()
      if (response.ok) {
        const mappedImages = (data.images || []).map((img: any) => ({
          id: img.id,
          url: img.url,
          alt: img.alt_text,
          status: img.approved ? 'approved' : 'pending',
          isHero: img.is_hero,
          displayOrder: img.display_order
        }))
        setImages(mappedImages)
      }
    } catch (err) {
      console.error('Failed to load images:', err)
    }
  }

  const loadHotelData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/hotels/${hotelId}/review`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load hotel data')
      }

      setHotel(data.hotel)
      setRoomTypes(data.roomTypes || [])
      setFaqs(data.faqs || [])
      console.log('Setting images:', data.images?.length || 0, data.images)
      setImages(data.images || [])

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hotel data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadExtractionStatus = async () => {
    try {
      const response = await fetch(`/api/admin/hotels/extraction-status/${hotelId}`)
      const data = await response.json()

      if (data.success) {
        const isRunning = data.status === 'in_progress' || data.status === 'processing'

        // Map step names to display names
        const stepDisplayNames: { [key: string]: string } = {
          'apify_fetch': 'Apify Fetch',
          'firecrawl_general': 'Firecrawl General',
          'firecrawl_rooms': 'Firecrawl Rooms',
          'firecrawl_website': 'Firecrawl Website',
          'firecrawl_social_media_search': 'Social Media Search',
          'apify_reviews': 'Apify Reviews',
          'firecrawl_tripadvisor': 'TripAdvisor',
          'firecrawl_booking_com': 'Booking.com',
          'process_images': 'Processing Images',
          'ai_sentiment': 'AI Sentiment',
          'ai_enhancement': 'Generating Content',
          'data_mapping': 'Mapping Fields'
        }

        const steps = (data.steps || []).map((step: any) => ({
          name: step.name,
          displayName: stepDisplayNames[step.name] || step.name,
          status: step.status || 'pending',
          error: step.error || undefined
        }))

        setExtractionProgress({
          isRunning: isRunning,
          currentStep: data.current_step || null,
          progress: data.progress_percentage || 0,
          steps: steps
        })
      }
    } catch (err) {
      console.error('Failed to load extraction status:', err)
    }
  }

  const handleFieldUpdate = async (field: string, value: string) => {
    if (!hotel) return

    try {
      const response = await fetch(`/api/admin/hotels/${hotelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      })

      if (!response.ok) {
        throw new Error('Failed to update field')
      }

      // Update local state
      setHotel(prev => prev ? { ...prev, [field]: value } : null)

    } catch (err) {
      console.error('Failed to update field:', err)
    }
  }

  const handleSaveDraft = async () => {
    if (!hotel) return

    try {
      setIsSaving(true)

      const response = await fetch(`/api/admin/hotels/${hotelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...hotel,
          status: 'draft'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save draft')
      }

      setHotel(prev => prev ? { ...prev, status: 'draft' } : null)

    } catch (err) {
      console.error('Failed to save draft:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!hotel) return

    try {
      setIsPublishing(true)

      const response = await fetch(`/api/admin/hotels/${hotelId}/publish`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to publish hotel')
      }

      setHotel(prev => prev ? { ...prev, status: 'published' } : null)

      // Redirect to published page after 1.5s delay
      setTimeout(() => {
        if (hotel?.slug) {
          router.push(`/places-to-stay/hotels/${hotel.slug}`)
        }
      }, 1500)

    } catch (err) {
      console.error('Failed to publish hotel:', err)
      setIsPublishing(false)
    }
  }

  const handleDelete = async () => {
    if (!hotel) return

    if (!confirm('Are you sure you want to delete this hotel? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/hotels/${hotelId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete hotel')
      }

      // Redirect to hotels queue
      window.location.href = '/admin/hotels/queue'

    } catch (err) {
      console.error('Failed to delete hotel:', err)
    }
  }

  const handleImageApprove = (imageId: string) => {
    setImages(prev => prev.map(img =>
      img.id === imageId ? { ...img, status: 'approved' as const } : img
    ))
  }

  const handleImageReject = (imageId: string) => {
    setImages(prev => prev.map(img =>
      img.id === imageId ? { ...img, status: 'rejected' as const } : img
    ))
  }

  const handleImageDelete = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId))
  }

  const handleImageView = (imageId: string) => {
    // Open image in lightbox or new tab
    const image = images.find(img => img.id === imageId)
    if (image) {
      window.open(image.url, '_blank')
    }
  }

  const handleSetHero = (imageId: string) => {
    setImages(prev => prev.map(img => ({
      ...img,
      isHero: img.id === imageId
    })))
  }

  const handleReRunExtraction = async () => {
    try {
      setIsReRunningExtraction(true)
      setError(null)

      const response = await fetch(`/api/admin/hotels/${hotelId}/re-extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start re-extraction')
      }

      // Start monitoring extraction progress
      setExtractionProgress({ isRunning: true, currentStep: 'Starting extraction...', progress: 0 })

      // Poll for progress updates
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/admin/hotels/extraction-status/${hotelId}`)
          const statusData = await statusResponse.json()

          if (statusData.success) {
            const isRunning = statusData.status === 'in_progress' || statusData.status === 'processing'

            // Map step names to display names
            const stepDisplayNames: { [key: string]: string } = {
              'apify_fetch': 'Apify Fetch',
              'firecrawl_general': 'Firecrawl General',
              'firecrawl_rooms': 'Firecrawl Rooms',
              'firecrawl_website': 'Firecrawl Website',
              'firecrawl_social_media_search': 'Social Media Search',
              'apify_reviews': 'Apify Reviews',
              'firecrawl_tripadvisor': 'TripAdvisor',
              'firecrawl_booking_com': 'Booking.com',
              'process_images': 'Processing Images',
              'ai_sentiment': 'AI Sentiment',
              'ai_enhancement': 'Generating Content',
              'data_mapping': 'Mapping Fields'
            }

            const steps = (statusData.steps || []).map((step: any) => ({
              name: step.name,
              displayName: stepDisplayNames[step.name] || step.name,
              status: step.status || 'pending',
              error: step.error || undefined
            }))

            setExtractionProgress({
              isRunning: isRunning,
              currentStep: statusData.current_step || 'Processing...',
              progress: statusData.progress_percentage || 0,
              steps: steps
            })

            // If extraction is complete, reload the page
            if (statusData.status === 'completed' || statusData.status === 'failed') {
              clearInterval(pollInterval)
              if (statusData.status === 'completed') {
                alert('Re-extraction completed successfully!')
                window.location.reload()
              } else {
                alert('Re-extraction failed. Please try again.')
                setExtractionProgress({ isRunning: false })
              }
            }
          }
        } catch (err) {
          console.error('Failed to check extraction status:', err)
        }
      }, 2000) // Poll every 2 seconds

      // Clear interval after 5 minutes to prevent infinite polling
      setTimeout(() => {
        clearInterval(pollInterval)
        if (extractionProgress.isRunning) {
          setExtractionProgress({ isRunning: false })
          alert('Extraction is taking longer than expected. Please refresh the page to check status.')
        }
      }, 300000) // 5 minutes

    } catch (err) {
      console.error('Failed to start re-extraction:', err)
      setError(err instanceof Error ? err.message : 'Failed to start re-extraction')
      setExtractionProgress({ isRunning: false })
    } finally {
      setIsReRunningExtraction(false)
    }
  }

  // Calculate required fields
  const requiredFields = [
    { field: 'Name', completed: !!hotel?.name, required: true },
    { field: 'Address', completed: !!hotel?.address, required: true },
    { field: 'Phone', completed: !!hotel?.phone, required: true },
    { field: 'Star Rating', completed: !!hotel?.star_rating, required: true },
    { field: 'Website', completed: !!hotel?.website, required: false },
    { field: 'Check-in Time', completed: !!hotel?.check_in_time, required: false },
  ]

  // Prevent SSR - only render on client to avoid hydration mismatch from browser extensions
  if (!isMounted) {
    return null
  }

  if (isLoading) {
    return (
      <SidebarInset>
        <AdminPageHeader
          title="Review Hotel"
          description="Review and edit hotel information"
          breadcrumbs={[
            { label: 'Hotels', href: '/admin/hotels/queue' },
            { label: 'Review' }
          ]}
        />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </SidebarInset>
    )
  }

  if (error || !hotel) {
    return (
      <SidebarInset>
        <AdminPageHeader
          title="Review Hotel"
          description="Review and edit hotel information"
          breadcrumbs={[
            { label: 'Hotels', href: '/admin/hotels/queue' },
            { label: 'Review' }
          ]}
        />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="text-center py-8">
            <p className="text-red-600">{error || 'Hotel not found'}</p>
          </div>
        </div>
      </SidebarInset>
    )
  }

  return (
    <SidebarInset>
      <AdminPageHeader
        title={`Review: ${hotel.name}`}
        description="Review and edit hotel information"
        breadcrumbs={[
          { label: 'Hotels', href: '/admin/hotels/queue' },
          { label: 'Review' }
        ]}
      />

      <ThreeColumnLayout
        leftColumn={
          <ReviewSidebar
            restaurant={{
              ...hotel,
              requiredFields,
              entityType: 'hotel'
            }}
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
            onDelete={handleDelete}
            onReRunExtraction={handleReRunExtraction}
            isSaving={isSaving}
            isPublishing={isPublishing}
            isReRunningExtraction={isReRunningExtraction}
            extractionProgress={extractionProgress}
          />
        }
        centerColumn={
          <div className="space-y-6">
            {/* Extraction Progress Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  extractionProgress?.isRunning ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  <span className={`text-lg ${
                    extractionProgress?.isRunning ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {extractionProgress?.isRunning ? '⚡' : '✓'}
                  </span>
                </div>
                Extraction Status
              </h3>
              <div className="space-y-3">
                {extractionProgress?.isRunning ? (
                  <>
                    <div className="text-sm text-gray-600">
                      Current Step: <span className="font-medium text-blue-600">{extractionProgress.currentStep || 'Processing...'}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${extractionProgress.progress || 0}%` }}
                      />
                    </div>
                    <div className="flex items-center text-xs text-blue-600">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                      Re-extracting data...
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-gray-600">
                      Status: <span className="font-medium text-green-600">Completed</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </>
                )}

                {/* All Steps List */}
                {extractionProgress?.steps && extractionProgress.steps.length > 0 && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <div className="space-y-2">
                      {extractionProgress.steps.map((step, index) => {
                        const getStatusIcon = () => {
                          switch (step.status) {
                            case 'completed':
                              return <span className="text-green-600">✓</span>
                            case 'failed':
                              return <span className="text-red-600">✗</span>
                            case 'running':
                              return <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                            default:
                              return <span className="text-gray-400">○</span>
                          }
                        }

                        const getStatusColor = () => {
                          switch (step.status) {
                            case 'completed':
                              return 'text-green-600'
                            case 'failed':
                              return 'text-red-600'
                            case 'running':
                              return 'text-blue-600'
                            default:
                              return 'text-gray-600'
                          }
                        }

                        return (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <span className="w-4 h-4 flex items-center justify-center">
                                {getStatusIcon()}
                              </span>
                              <span className={getStatusColor()}>
                                {step.displayName || step.name}
                              </span>
                            </div>
                            {step.error && (
                              <span className="text-xs text-red-500">{step.error}</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <EditableDataView
              data={hotel}
              onFieldUpdate={handleFieldUpdate}
              loading={isLoading}
            />
          </div>
        }
        rightColumn={
          <Tabs defaultValue="images" className="space-y-4">
            <TabsList>
              <TabsTrigger value="images">Images ({images.length})</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="images">
              <ImageApproval
                images={images}
                onApprove={handleImageApprove}
                onReject={handleImageReject}
                onDelete={handleImageDelete}
                onView={handleImageView}
                onSetHero={handleSetHero}
                loading={isLoading}
                entityId={hotelId}
                entityType="hotels"
                persistToApi={true}
              />
            </TabsContent>

            <TabsContent value="details">
              <div className="space-y-6">
                {/* Room Types Section */}
                {roomTypes.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Types</h3>
                    <div className="space-y-4">
                      {roomTypes.map((room) => (
                        <div key={room.id} className="border-b border-gray-200 pb-4 last:border-0">
                          <h4 className="font-medium text-gray-900">{room.name}</h4>
                          {room.description && (
                            <p className="text-sm text-gray-600 mt-1">{room.description}</p>
                          )}
                          <div className="mt-2 flex gap-4 text-xs text-gray-500">
                            {room.capacity && <span>Capacity: {room.capacity}</span>}
                            {room.price_per_night && <span>KWD {room.price_per_night}/night</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAQs Section */}
                {faqs.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">FAQs</h3>
                    <div className="space-y-4">
                      {faqs.map((faq) => (
                        <div key={faq.id} className="border-b border-gray-200 pb-4 last:border-0">
                          <h4 className="font-medium text-gray-900">{faq.question}</h4>
                          <p className="text-sm text-gray-600 mt-1">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {roomTypes.length === 0 && faqs.length === 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-gray-500">
                    No room types or FAQs available yet.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="preview">
              {hotel?.slug && (
                <PreviewPanel
                  slug={hotel.slug}
                  basePath="/places-to-stay/hotels"
                  entityName={hotel.name}
                  isActive={hotel.status === 'published'}
                />
              )}
            </TabsContent>
          </Tabs>
        }
      />
    </SidebarInset>
  )
}

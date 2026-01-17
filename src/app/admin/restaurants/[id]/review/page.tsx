'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { ThreeColumnLayout } from '@/components/admin/layout/ThreeColumnLayout'
import { ReviewSidebar } from '@/components/admin/review/ReviewSidebar'
import { EditableDataView } from '@/components/admin/review/EditableDataView'
import { ImageApproval } from '@/components/admin/review/ImageApproval'
import { PreviewPanel } from '@/components/admin/review/PreviewPanel'
import { MenuView } from '@/components/admin/add/MenuView'

interface RestaurantData {
  id: string
  name: string
  thumbnail?: string
  status: 'draft' | 'published' | 'pending'
  qualityScore: number
  placeId?: string
  google_place_id?: string
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

interface MenuItem {
  name: string
  mentions: number
  category: 'popular' | 'main' | 'side'
}

interface Category {
  name: string
  type: 'cuisine' | 'feature'
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

export default function RestaurantReviewPage() {
  const params = useParams()
  const router = useRouter()
  const restaurantId = params.id as string

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

  // Restaurant data
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [images, setImages] = useState<ImageData[]>([])

  // Error state
  const [error, setError] = useState<string | null>(null)

  // Mount effect - runs only on client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load restaurant data
  useEffect(() => {
    if (restaurantId && isMounted) {
      loadRestaurantData()
      loadImages()
      // Also load extraction status to show current progress
      loadExtractionStatus()
    }
  }, [restaurantId, isMounted])

  const loadImages = async () => {
    try {
      const response = await fetch(`/api/admin/restaurants/${restaurantId}/images`)
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

  const loadRestaurantData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/restaurants/${restaurantId}/review`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load restaurant data')
      }

      setRestaurant(data.restaurant)
      setMenuItems(data.menuItems || [])
      setCategories(data.categories || [])
      console.log('Setting images:', data.images?.length || 0, data.images);
      setImages(data.images || [])

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load restaurant data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadExtractionStatus = async () => {
    try {
      const response = await fetch(`/api/admin/extraction-status/${restaurantId}`)
      const data = await response.json()
      
      if (data.success) {
        const isRunning = data.status === 'in_progress' || data.status === 'processing';
        
        // Map step names to display names
        const stepDisplayNames: { [key: string]: string } = {
          'apify_fetch': 'Apify Fetch',
          'firecrawl_general': 'Firecrawl Fetch',
          'firecrawl_menu': 'Firecrawl Menu',
          'firecrawl_website': 'Firecrawl Website',
          'apify_reviews': 'Apify Reviews',
          'firecrawl_tripadvisor': 'TripAdvisor',
          'firecrawl_opentable': 'OpenTable',
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
    if (!restaurant) return

    try {
      const response = await fetch(`/api/admin/restaurants/${restaurantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      })

      if (!response.ok) {
        throw new Error('Failed to update field')
      }

      // Update local state
      setRestaurant(prev => prev ? { ...prev, [field]: value } : null)

    } catch (err) {
      console.error('Failed to update field:', err)
    }
  }

  const handleSaveDraft = async () => {
    if (!restaurant) return

    try {
      setIsSaving(true)
      
      const response = await fetch(`/api/admin/restaurants/${restaurantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...restaurant,
          status: 'draft'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save draft')
      }

      setRestaurant(prev => prev ? { ...prev, status: 'draft' } : null)

    } catch (err) {
      console.error('Failed to save draft:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!restaurant) return

    try {
      setIsPublishing(true)

      const response = await fetch(`/api/admin/restaurants/${restaurantId}/publish`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to publish restaurant')
      }

      setRestaurant(prev => prev ? { ...prev, status: 'published' } : null)

      // Redirect to published page after 1.5s delay
      setTimeout(() => {
        if (restaurant?.slug) {
          router.push(`/places-to-eat/restaurants/${restaurant.slug}`)
        }
      }, 1500)

    } catch (err) {
      console.error('Failed to publish restaurant:', err)
      setIsPublishing(false)
    }
  }

  const handleDelete = async () => {
    if (!restaurant) return

    if (!confirm('Are you sure you want to delete this restaurant? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/restaurants/${restaurantId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete restaurant')
      }

      // Redirect to restaurants list
      window.location.href = '/admin/restaurants'

    } catch (err) {
      console.error('Failed to delete restaurant:', err)
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

      const response = await fetch(`/api/admin/restaurants/${restaurantId}/re-extract`, {
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
                const statusResponse = await fetch(`/api/admin/extraction-status/${restaurantId}`)
                const statusData = await statusResponse.json()
                
                if (statusData.success) {
                  const isRunning = statusData.status === 'in_progress' || statusData.status === 'processing';
                  
                  // Map step names to display names
                  const stepDisplayNames: { [key: string]: string } = {
                    'apify_fetch': 'Apify Fetch',
                    'firecrawl_general': 'Firecrawl Fetch',
                    'firecrawl_menu': 'Firecrawl Menu',
                    'firecrawl_website': 'Firecrawl Website',
                    'apify_reviews': 'Apify Reviews',
                    'firecrawl_tripadvisor': 'TripAdvisor',
                    'firecrawl_opentable': 'OpenTable',
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
    { field: 'Name', completed: !!restaurant?.name, required: true },
    { field: 'Address', completed: !!restaurant?.address, required: true },
    { field: 'Phone', completed: !!restaurant?.phone, required: true },
    { field: 'Cuisine', completed: !!restaurant?.cuisine, required: true },
    { field: 'Website', completed: !!restaurant?.website, required: false },
    { field: 'Hours', completed: !!restaurant?.hours, required: false },
  ]

  // Prevent SSR - only render on client to avoid hydration mismatch from browser extensions
  if (!isMounted) {
    return null
  }

  if (isLoading) {
    return (
      <SidebarInset>
        <AdminPageHeader
          title="Review Restaurant"
          description="Review and edit restaurant information"
          breadcrumbs={[
            { label: 'Restaurants', href: '/admin/restaurants' },
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

  if (error || !restaurant) {
    return (
      <SidebarInset>
        <AdminPageHeader
          title="Review Restaurant"
          description="Review and edit restaurant information"
          breadcrumbs={[
            { label: 'Restaurants', href: '/admin/restaurants' },
            { label: 'Review' }
          ]}
        />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="text-center py-8">
            <p className="text-red-600">{error || 'Restaurant not found'}</p>
          </div>
        </div>
      </SidebarInset>
    )
  }

  return (
    <SidebarInset>
      <AdminPageHeader
        title={`Review: ${restaurant.name}`}
        description="Review and edit restaurant information"
        breadcrumbs={[
          { label: 'Restaurants', href: '/admin/restaurants' },
          { label: 'Review' }
        ]}
      />

      <ThreeColumnLayout
        leftColumn={
          <ReviewSidebar
            restaurant={{
              ...restaurant,
              requiredFields
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
            {/* Extraction Progress Card - Always Show */}
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
              data={restaurant}
              onFieldUpdate={handleFieldUpdate}
              loading={isLoading}
            />
          </div>
        }
        rightColumn={
          <Tabs defaultValue="images" className="space-y-4">
            <TabsList>
              <TabsTrigger value="images">Images ({images.length})</TabsTrigger>
              <TabsTrigger value="menu">Menu</TabsTrigger>
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
                entityId={restaurantId}
                entityType="restaurants"
                persistToApi={true}
              />
            </TabsContent>

            <TabsContent value="menu">
              <MenuView
                menuItems={menuItems}
                categories={categories}
                loading={isLoading}
              />
            </TabsContent>

            <TabsContent value="preview">
              {restaurant?.slug && (
                <PreviewPanel
                  slug={restaurant.slug}
                  basePath="/places-to-eat/restaurants"
                  entityName={restaurant.name}
                  isActive={restaurant.status === 'published'}
                />
              )}
            </TabsContent>
          </Tabs>
        }
      />
    </SidebarInset>
  )
}
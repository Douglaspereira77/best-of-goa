'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarInset } from '@/components/ui/sidebar'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  MapPin
} from 'lucide-react'

interface ExtractionStep {
  status: 'pending' | 'running' | 'completed' | 'failed'
  timestamp?: string
  error?: string
}

interface QueueItem {
  id: string
  name: string
  slug: string
  area: string
  extractionStatus: 'pending' | 'processing' | 'completed' | 'failed'
  extractionProgress: Record<string, ExtractionStep>
  createdAt: string
}

const EXTRACTION_STEPS = [
  { key: 'apify_fetch', label: 'Google Places Data' },
  { key: 'firecrawl_website', label: 'Website Scraping' },
  { key: 'social_media_search', label: 'Social Media' },
  { key: 'apify_reviews', label: 'Reviews' },
  { key: 'process_images', label: 'Image Processing' },
  { key: 'ai_enhancement', label: 'AI Enhancement' },
  { key: 'category_matching', label: 'Category Matching' }
]

export default function AttractionsQueuePage() {
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      loadQueue()
    }
  }, [isHydrated])

  useEffect(() => {
    if (!autoRefresh || !isHydrated) return

    const interval = setInterval(() => {
      loadQueue()
    }, 5000)

    return () => clearInterval(interval)
  }, [autoRefresh, isHydrated])

  const loadQueue = async () => {
    try {
      setError(null)
      const response = await fetch('/api/admin/attractions/queue')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load queue')
      }

      setQueue(data.queue || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue')
    } finally {
      setLoading(false)
    }
  }

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>
    }
  }

  const calculateProgress = (progress: Record<string, ExtractionStep>) => {
    const completedSteps = EXTRACTION_STEPS.filter(
      (step) => progress[step.key]?.status === 'completed'
    ).length
    return (completedSteps / EXTRACTION_STEPS.length) * 100
  }

  if (!isHydrated || loading) {
    return (
      <SidebarInset>
        <AdminPageHeader
          title="Extraction Queue"
          description="Monitor attraction extraction progress"
          breadcrumbs={[
            { label: 'Attractions', href: '/admin/attractions' },
            { label: 'Queue' }
          ]}
        />
        <div className="p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Loading queue...</p>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    )
  }

  return (
    <SidebarInset>
      <AdminPageHeader
        title="Extraction Queue"
        description={`${queue.length} attractions in queue`}
        breadcrumbs={[
          { label: 'Attractions', href: '/admin/attractions' },
          { label: 'Queue' }
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Controls */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button onClick={loadQueue} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
            </Button>
          </div>
          <Button onClick={() => router.push('/admin/attractions/add')}>
            Add Attraction
          </Button>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-red-600">{error}</CardContent>
          </Card>
        )}

        {/* Queue Items */}
        {queue.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">Queue is empty</h3>
              <p className="text-gray-500 mt-1">No extractions in progress</p>
              <Button
                onClick={() => router.push('/admin/attractions/add')}
                className="mt-4"
              >
                Add Attraction
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {queue.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.area} • Added {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(item.extractionStatus)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/attractions/${item.id}/review`)}
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Progress value={calculateProgress(item.extractionProgress || {})} />
                    <p className="text-sm text-gray-500 mt-1">
                      {Math.round(calculateProgress(item.extractionProgress || {}))}% complete
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {EXTRACTION_STEPS.map((step) => {
                      const stepData = item.extractionProgress?.[step.key]
                      return (
                        <div
                          key={step.key}
                          className="flex items-center gap-2 text-sm"
                        >
                          {getStepIcon(stepData?.status || 'pending')}
                          <span
                            className={
                              stepData?.status === 'failed'
                                ? 'text-red-600'
                                : stepData?.status === 'completed'
                                ? 'text-green-600'
                                : stepData?.status === 'running'
                                ? 'text-blue-600'
                                : 'text-gray-500'
                            }
                          >
                            {step.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {item.extractionStatus === 'failed' && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-600">
                        Extraction failed. Check logs for details.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SidebarInset>
  )
}

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
  Dumbbell
} from 'lucide-react'

interface ExtractionStep {
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  timestamp?: string
  error?: string
}

interface QueueItem {
  id: string
  name: string
  slug: string
  area: string
  extraction_status: 'pending' | 'processing' | 'completed' | 'failed'
  extraction_progress: Record<string, ExtractionStep>
  created_at: string
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

export default function FitnessQueuePage() {
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
      const response = await fetch('/api/admin/fitness/queue')
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
      case 'in_progress':
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
          description="Monitor fitness center extraction progress"
          breadcrumbs={[
            { label: 'Fitness', href: '/admin/fitness' },
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
        description={`${queue.length} fitness centers in queue`}
        breadcrumbs={[
          { label: 'Fitness', href: '/admin/fitness' },
          { label: 'Queue' }
        ]}
      />

      <div className="p-6">
        {/* Controls */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              onClick={loadQueue}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
            >
              {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
            </Button>
          </div>
          <Button
            onClick={() => router.push('/admin/fitness/add')}
            size="sm"
          >
            Add Fitness Place
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-4 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Queue Items */}
        {queue.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Dumbbell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 mb-2">No fitness centers in queue</p>
              <p className="text-sm text-gray-400 mb-4">
                Add fitness centers to see their extraction progress here
              </p>
              <Button onClick={() => router.push('/admin/fitness/add')}>
                Add Fitness Place
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {queue.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        {getStatusBadge(item.extraction_status)}
                      </div>
                      <p className="text-sm text-gray-500">
                        {item.area} • {item.slug}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/admin/fitness/${item.id}/review`)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Overall Progress
                      </span>
                      <span className="text-sm text-gray-500">
                        {Math.round(calculateProgress(item.extraction_progress || {}))}%
                      </span>
                    </div>
                    <Progress value={calculateProgress(item.extraction_progress || {})} />
                  </div>

                  {/* Step-by-Step Progress */}
                  <div className="space-y-2">
                    {EXTRACTION_STEPS.map((step) => {
                      const stepProgress = item.extraction_progress?.[step.key]
                      const status = stepProgress?.status || 'pending'

                      return (
                        <div
                          key={step.key}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-2">
                            {getStepIcon(status)}
                            <span className="text-sm">{step.label}</span>
                          </div>
                          {stepProgress?.timestamp && (
                            <span className="text-xs text-gray-500">
                              {new Date(stepProgress.timestamp).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Error Message */}
                  {item.extraction_status === 'failed' && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">
                        Extraction failed. Check the details for more information.
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
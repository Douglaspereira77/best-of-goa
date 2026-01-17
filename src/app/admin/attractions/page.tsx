'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarInset } from '@/components/ui/sidebar'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Search, Plus, RefreshCw, Star, MapPin, Ticket, ExternalLink, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface AttractionListItem {
  id: string
  name: string
  slug: string
  status: 'draft' | 'published' | 'failed' | 'processing' | 'pending'
  extraction_status: 'completed' | 'pending' | 'processing' | 'failed'
  area: string
  attractionType: string | null
  rating: number | null
  reviewCount: number | null
  isFree: boolean
  heroImage: string | null
  createdAt: string
  published: boolean
}

type FilterStatus = 'all' | 'draft' | 'published' | 'failed' | 'processing' | 'pending'

export default function AttractionsListPage() {
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const [attractions, setAttractions] = useState<AttractionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [totalCount, setTotalCount] = useState(0)
  const [publishingAttractionId, setPublishingAttractionId] = useState<string | null>(null)
  const [attractionToUnpublish, setAttractionToUnpublish] = useState<AttractionListItem | null>(null)
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      loadAttractions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, isHydrated])

  const loadAttractions = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      params.append('limit', '100')

      const response = await fetch(`/api/admin/attractions/list?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load attractions')
      }

      setAttractions(data.attractions || [])
      setTotalCount(data.pagination?.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attractions')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadAttractions()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const openUnpublishDialog = (attraction: AttractionListItem) => {
    setAttractionToUnpublish(attraction)
    setShowUnpublishDialog(true)
  }

  const closeUnpublishDialog = () => {
    setShowUnpublishDialog(false)
    setAttractionToUnpublish(null)
  }

  const handlePublish = async (attraction: AttractionListItem) => {
    try {
      setPublishingAttractionId(attraction.id)

      const response = await fetch(`/api/admin/attractions/${attraction.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to publish attraction')
      }

      toast.success(data.message || 'Attraction published successfully')

      // Update the attraction in the list
      setAttractions(prevAttractions =>
        prevAttractions.map(a =>
          a.id === attraction.id ? { ...a, published: true } : a
        )
      )
    } catch (err) {
      console.error('Publish error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to publish attraction')
    } finally {
      setPublishingAttractionId(null)
    }
  }

  const handleUnpublish = async () => {
    if (!attractionToUnpublish) return

    try {
      setPublishingAttractionId(attractionToUnpublish.id)
      setShowUnpublishDialog(false)

      const response = await fetch(`/api/admin/attractions/${attractionToUnpublish.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unpublish' })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to unpublish attraction')
      }

      toast.success(data.message || 'Attraction unpublished successfully')

      // Update the attraction in the list
      setAttractions(prevAttractions =>
        prevAttractions.map(a =>
          a.id === attractionToUnpublish.id ? { ...a, published: false } : a
        )
      )
      setAttractionToUnpublish(null)
    } catch (err) {
      console.error('Unpublish error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to unpublish attraction')
      setAttractionToUnpublish(null)
    } finally {
      setPublishingAttractionId(null)
    }
  }

  const getStatusBadge = (status: string, published: boolean) => {
    if (published) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Published</Badge>
    }
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Published</Badge>
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Draft</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Processing</Badge>
      case 'pending':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (!isHydrated) {
    return (
      <SidebarInset>
        <AdminPageHeader
          title="All Attractions"
          description="Manage all attractions in the directory"
          breadcrumbs={[{ label: 'Attractions' }]}
        />
        <div className="p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Loading...</p>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    )
  }

  return (
    <SidebarInset>
      <AdminPageHeader
        title="All Attractions"
        description={`${totalCount} attractions in the directory`}
        breadcrumbs={[{ label: 'Attractions' }]}
      />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search attractions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} variant="secondary">
              Search
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/admin/attractions/add')}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Attraction
            </Button>
            <Button
              onClick={() => router.push('/admin/attractions/queue')}
              variant="outline"
            >
              View Queue
            </Button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'published', 'draft', 'processing', 'pending', 'failed'] as FilterStatus[]).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status === 'all' ? 'All' : status}
            </Button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">{error}</p>
              <Button onClick={loadAttractions} variant="outline" size="sm" className="mt-2">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Attractions Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Loading attractions...</p>
              </div>
            ) : attractions.length === 0 ? (
              <div className="p-8 text-center">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900">No attractions found</h3>
                <p className="text-gray-500 mt-1">
                  {searchQuery ? 'Try adjusting your search' : 'Add your first attraction to get started'}
                </p>
                <Button
                  onClick={() => router.push('/admin/attractions/add')}
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Attraction
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Attraction</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Admission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attractions.map((attraction) => (
                    <TableRow
                      key={attraction.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/admin/attractions/${attraction.id}/review`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {attraction.heroImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={attraction.heroImage}
                              alt={attraction.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                              <MapPin className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{attraction.name}</div>
                            <div className="text-sm text-gray-500">{attraction.slug}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{attraction.attractionType || '-'}</span>
                      </TableCell>
                      <TableCell>{attraction.area}</TableCell>
                      <TableCell>
                        {attraction.rating ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{attraction.rating.toFixed(1)}</span>
                            <span className="text-gray-400 text-sm">
                              ({attraction.reviewCount || 0})
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {attraction.isFree ? (
                          <Badge className="bg-green-100 text-green-800">Free</Badge>
                        ) : (
                          <Badge variant="outline">
                            <Ticket className="w-3 h-3 mr-1" />
                            Paid
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(attraction.status, attraction.published)}</TableCell>
                      <TableCell className="text-gray-500">
                        {formatDate(attraction.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/admin/attractions/${attraction.id}/review`)
                            }}
                          >
                            Review
                          </Button>
                          {attraction.extraction_status === 'completed' && attraction.slug && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(`/places-to-visit/attractions/${attraction.slug}`, '_blank')
                              }}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                          {attraction.published ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                openUnpublishDialog(attraction)
                              }}
                              disabled={publishingAttractionId === attraction.id}
                              className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                              title="Unpublish attraction"
                            >
                              {publishingAttractionId === attraction.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <EyeOff className="w-4 h-4" />
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePublish(attraction)
                              }}
                              disabled={publishingAttractionId === attraction.id}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Publish attraction"
                            >
                              {publishingAttractionId === attraction.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Unpublish Confirmation Dialog */}
      <AlertDialog open={showUnpublishDialog} onOpenChange={setShowUnpublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unpublish Attraction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unpublish <strong>{attractionToUnpublish?.name}</strong>?
              <br />
              <br />
              This will remove the attraction from the public site. You can re-publish it anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeUnpublishDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnpublish}
              className="bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-600"
            >
              Unpublish Attraction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarInset>
  )
}

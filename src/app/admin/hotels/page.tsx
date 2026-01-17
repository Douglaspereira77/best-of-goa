'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarInset } from '@/components/ui/sidebar'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Search,
  Plus,
  RefreshCw,
  Star,
  ExternalLink,
  Hotel,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface HotelListItem {
  id: string
  name: string
  slug: string
  status: 'draft' | 'published' | 'failed' | 'processing' | 'pending'
  area: string
  starRating: number | null
  rating: number | null
  reviewCount: number | null
  heroImage: string | null
  createdAt: string
  updatedAt: string
  published: boolean
}

type FilterStatus = 'all' | 'draft' | 'published' | 'failed' | 'processing' | 'pending'

export default function HotelsListPage() {
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const [hotels, setHotels] = useState<HotelListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [totalCount, setTotalCount] = useState(0)
  const [publishingHotelId, setPublishingHotelId] = useState<string | null>(null)
  const [hotelToUnpublish, setHotelToUnpublish] = useState<HotelListItem | null>(null)
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false)

  // Hydration effect
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Load hotels when filters change
  useEffect(() => {
    if (isHydrated) {
      loadHotels()
    }
  }, [statusFilter, isHydrated])

  const loadHotels = async () => {
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

      const response = await fetch(`/api/admin/hotels/list?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load hotels')
      }

      setHotels(data.hotels || [])
      setTotalCount(data.pagination?.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hotels')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadHotels()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const openUnpublishDialog = (hotel: HotelListItem) => {
    setHotelToUnpublish(hotel)
    setShowUnpublishDialog(true)
  }

  const closeUnpublishDialog = () => {
    setShowUnpublishDialog(false)
    setHotelToUnpublish(null)
  }

  const handlePublish = async (hotel: HotelListItem) => {
    try {
      setPublishingHotelId(hotel.id)

      const response = await fetch(`/api/admin/hotels/${hotel.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to publish hotel')
      }

      toast.success(data.message || 'Hotel published successfully')

      // Update the hotel in the list
      setHotels(prevHotels =>
        prevHotels.map(h =>
          h.id === hotel.id ? { ...h, published: true } : h
        )
      )
    } catch (err) {
      console.error('Publish error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to publish hotel')
    } finally {
      setPublishingHotelId(null)
    }
  }

  const handleUnpublish = async () => {
    if (!hotelToUnpublish) return

    try {
      setPublishingHotelId(hotelToUnpublish.id)
      setShowUnpublishDialog(false)

      const response = await fetch(`/api/admin/hotels/${hotelToUnpublish.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unpublish' })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to unpublish hotel')
      }

      toast.success(data.message || 'Hotel unpublished successfully')

      // Update the hotel in the list
      setHotels(prevHotels =>
        prevHotels.map(h =>
          h.id === hotelToUnpublish.id ? { ...h, published: false } : h
        )
      )
      setHotelToUnpublish(null)
    } catch (err) {
      console.error('Unpublish error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to unpublish hotel')
      setHotelToUnpublish(null)
    } finally {
      setPublishingHotelId(null)
    }
  }

  const getStatusBadge = (status: string) => {
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

  const renderStarRating = (stars: number | null) => {
    if (!stars) return <span className="text-gray-400">-</span>
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: stars }).map((_, i) => (
          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
    )
  }

  // Show loading skeleton until hydrated
  if (!isHydrated) {
    return (
      <SidebarInset>
        <AdminPageHeader
          title="All Hotels"
          description="Manage all hotels in the directory"
          breadcrumbs={[{ label: 'Hotels' }]}
        />
        <div className="flex flex-1 flex-col gap-4 p-6">
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
        title="All Hotels"
        description="Manage all hotels in the directory"
        breadcrumbs={[{ label: 'Hotels' }]}
        actions={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadHotels}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => router.push('/admin/hotels/add')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Hotel
            </Button>
          </div>
        }
      />

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {/* Search Bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by hotel name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} disabled={loading}>
                  Search
                </Button>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                {(['all', 'published', 'draft', 'processing', 'pending', 'failed'] as FilterStatus[]).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className="capitalize"
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Hotels ({totalCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
                <Button onClick={loadHotels} className="mt-4">
                  Retry
                </Button>
              </div>
            ) : hotels.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Hotel className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No hotels found</p>
                <Button
                  className="mt-4"
                  onClick={() => router.push('/admin/hotels/add')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Hotel
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Stars</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hotels.map((hotel) => (
                      <TableRow
                        key={hotel.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => router.push(`/admin/hotels/${hotel.id}/review`)}
                      >
                        <TableCell className="font-medium">
                          {hotel.name}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(hotel.status)}
                        </TableCell>
                        <TableCell>
                          {renderStarRating(hotel.starRating)}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {hotel.area}
                        </TableCell>
                        <TableCell>
                          {hotel.rating ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span>{hotel.rating.toFixed(1)}</span>
                              {hotel.reviewCount && (
                                <span className="text-gray-500 text-sm">
                                  ({hotel.reviewCount})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {formatDate(hotel.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/admin/hotels/${hotel.id}/review`)
                              }}
                            >
                              Review
                            </Button>
                            {hotel.slug && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(`/places-to-stay/hotels/${hotel.slug}`, '_blank')
                                }}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            )}
                            {hotel.published ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openUnpublishDialog(hotel)
                                }}
                                disabled={publishingHotelId === hotel.id}
                                className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                title="Unpublish hotel"
                              >
                                {publishingHotelId === hotel.id ? (
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
                                  handlePublish(hotel)
                                }}
                                disabled={publishingHotelId === hotel.id}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Publish hotel"
                              >
                                {publishingHotelId === hotel.id ? (
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Unpublish Confirmation Dialog */}
      <AlertDialog open={showUnpublishDialog} onOpenChange={setShowUnpublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unpublish Hotel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unpublish <strong>{hotelToUnpublish?.name}</strong>?
              <br />
              <br />
              This will remove the hotel from the public site. You can re-publish it anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeUnpublishDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnpublish}
              className="bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-600"
            >
              Unpublish Hotel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarInset>
  )
}

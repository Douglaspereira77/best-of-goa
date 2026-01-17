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
  UtensilsCrossed,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface RestaurantListItem {
  id: string
  name: string
  slug: string
  status: 'draft' | 'published' | 'failed' | 'processing'
  area: string
  rating: number | null
  reviewCount: number | null
  heroImage: string | null
  createdAt: string
  updatedAt: string
  published: boolean
}

type FilterStatus = 'all' | 'draft' | 'published' | 'failed' | 'processing'

export default function RestaurantsListPage() {
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const [restaurants, setRestaurants] = useState<RestaurantListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [totalCount, setTotalCount] = useState(0)
  const [publishingRestaurantId, setPublishingRestaurantId] = useState<string | null>(null)
  const [restaurantToUnpublish, setRestaurantToUnpublish] = useState<RestaurantListItem | null>(null)
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false)

  // Hydration effect
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Load restaurants when filters change
  useEffect(() => {
    if (isHydrated) {
      loadRestaurants()
    }
  }, [statusFilter, isHydrated])

  const loadRestaurants = async () => {
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

      const response = await fetch(`/api/admin/restaurants/list?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load restaurants')
      }

      setRestaurants(data.restaurants || [])
      setTotalCount(data.pagination?.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load restaurants')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadRestaurants()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const openUnpublishDialog = (restaurant: RestaurantListItem) => {
    setRestaurantToUnpublish(restaurant)
    setShowUnpublishDialog(true)
  }

  const closeUnpublishDialog = () => {
    setShowUnpublishDialog(false)
    setRestaurantToUnpublish(null)
  }

  const handlePublish = async (restaurant: RestaurantListItem) => {
    try {
      setPublishingRestaurantId(restaurant.id)

      const response = await fetch(`/api/admin/restaurants/${restaurant.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to publish restaurant')
      }

      toast.success(data.message || 'Restaurant published successfully')

      // Update the restaurant in the list
      setRestaurants(prevRestaurants =>
        prevRestaurants.map(r =>
          r.id === restaurant.id ? { ...r, published: true, status: 'published' } : r
        )
      )
    } catch (err) {
      console.error('Publish error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to publish restaurant')
    } finally {
      setPublishingRestaurantId(null)
    }
  }

  const handleUnpublish = async () => {
    if (!restaurantToUnpublish) return

    try {
      setPublishingRestaurantId(restaurantToUnpublish.id)
      setShowUnpublishDialog(false)

      const response = await fetch(`/api/admin/restaurants/${restaurantToUnpublish.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unpublish' })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to unpublish restaurant')
      }

      toast.success(data.message || 'Restaurant unpublished successfully')

      // Update the restaurant in the list
      setRestaurants(prevRestaurants =>
        prevRestaurants.map(r =>
          r.id === restaurantToUnpublish.id ? { ...r, published: false, status: 'draft' } : r
        )
      )
      setRestaurantToUnpublish(null)
    } catch (err) {
      console.error('Unpublish error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to unpublish restaurant')
      setRestaurantToUnpublish(null)
    } finally {
      setPublishingRestaurantId(null)
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

  // Show loading skeleton until hydrated
  if (!isHydrated) {
    return (
      <SidebarInset>
        <AdminPageHeader
          title="All Restaurants"
          description="Manage all restaurants in the directory"
          breadcrumbs={[{ label: 'Restaurants' }]}
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
        title="All Restaurants"
        description="Manage all restaurants in the directory"
        breadcrumbs={[{ label: 'Restaurants' }]}
        actions={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadRestaurants}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => router.push('/admin/restaurants/add')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Restaurant
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
                    placeholder="Search by restaurant name..."
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
                {(['all', 'published', 'draft', 'processing', 'failed'] as FilterStatus[]).map((status) => (
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
              Restaurants ({totalCount})
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
                <Button onClick={loadRestaurants} className="mt-4">
                  Retry
                </Button>
              </div>
            ) : restaurants.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No restaurants found</p>
                <Button
                  className="mt-4"
                  onClick={() => router.push('/admin/restaurants/add')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Restaurant
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {restaurants.map((restaurant) => (
                      <TableRow
                        key={restaurant.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => router.push(`/admin/restaurants/${restaurant.id}/review`)}
                      >
                        <TableCell className="font-medium">
                          {restaurant.name}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(restaurant.status)}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {restaurant.area}
                        </TableCell>
                        <TableCell>
                          {restaurant.rating ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span>{restaurant.rating.toFixed(1)}</span>
                              {restaurant.reviewCount && (
                                <span className="text-gray-500 text-sm">
                                  ({restaurant.reviewCount})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {formatDate(restaurant.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/admin/restaurants/${restaurant.id}/review`)
                              }}
                            >
                              Review
                            </Button>
                            {restaurant.slug && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(`/places-to-eat/restaurants/${restaurant.slug}`, '_blank')
                                }}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            )}
                            {restaurant.status === 'published' || restaurant.published ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openUnpublishDialog(restaurant)
                                }}
                                disabled={publishingRestaurantId === restaurant.id}
                                className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                title="Unpublish restaurant"
                              >
                                {publishingRestaurantId === restaurant.id ? (
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
                                  handlePublish(restaurant)
                                }}
                                disabled={publishingRestaurantId === restaurant.id}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Publish restaurant"
                              >
                                {publishingRestaurantId === restaurant.id ? (
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
            <AlertDialogTitle>Unpublish Restaurant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unpublish <strong>{restaurantToUnpublish?.name}</strong>?
              <br />
              <br />
              This will remove the restaurant from the public site. You can re-publish it anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeUnpublishDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnpublish}
              className="bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-600"
            >
              Unpublish Restaurant
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarInset>
  )
}

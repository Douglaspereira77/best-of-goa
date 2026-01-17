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
  ShoppingBag,
  Store,
  ParkingCircle,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface MallListItem {
  id: string
  name: string
  slug: string
  extraction_status: 'pending' | 'processing' | 'completed' | 'failed'
  area: string
  total_stores: number | null
  total_parking_spaces: number | null
  google_rating: number | null
  google_review_count: number | null
  hero_image: string | null
  created_at: string
  updated_at: string
  published: boolean
}

type FilterStatus = 'all' | 'published' | 'pending' | 'processing' | 'completed' | 'failed'

export default function MallsListPage() {
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const [malls, setMalls] = useState<MallListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [totalCount, setTotalCount] = useState(0)
  const [publishingMallId, setPublishingMallId] = useState<string | null>(null)
  const [mallToUnpublish, setMallToUnpublish] = useState<MallListItem | null>(null)
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false)

  // Hydration effect
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Load malls when filters change
  useEffect(() => {
    if (isHydrated) {
      loadMalls()
    }
  }, [statusFilter, isHydrated])

  const loadMalls = async () => {
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

      const response = await fetch(`/api/admin/malls/list?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load malls')
      }

      setMalls(data.malls || [])
      setTotalCount(data.pagination?.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load malls')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadMalls()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const openUnpublishDialog = (mall: MallListItem) => {
    setMallToUnpublish(mall)
    setShowUnpublishDialog(true)
  }

  const closeUnpublishDialog = () => {
    setShowUnpublishDialog(false)
    setMallToUnpublish(null)
  }

  const handlePublish = async (mall: MallListItem) => {
    try {
      setPublishingMallId(mall.id)

      const response = await fetch(`/api/admin/malls/${mall.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to publish mall')
      }

      toast.success(data.message || 'Mall published successfully')

      // Update the mall in the list
      setMalls(prevMalls =>
        prevMalls.map(m =>
          m.id === mall.id ? { ...m, published: true } : m
        )
      )
    } catch (err) {
      console.error('Publish error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to publish mall')
    } finally {
      setPublishingMallId(null)
    }
  }

  const handleUnpublish = async () => {
    if (!mallToUnpublish) return

    try {
      setPublishingMallId(mallToUnpublish.id)
      setShowUnpublishDialog(false)

      const response = await fetch(`/api/admin/malls/${mallToUnpublish.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unpublish' })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to unpublish mall')
      }

      toast.success(data.message || 'Mall unpublished successfully')

      // Update the mall in the list
      setMalls(prevMalls =>
        prevMalls.map(m =>
          m.id === mallToUnpublish.id ? { ...m, published: false } : m
        )
      )
      setMallToUnpublish(null)
    } catch (err) {
      console.error('Unpublish error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to unpublish mall')
      setMallToUnpublish(null)
    } finally {
      setPublishingMallId(null)
    }
  }

  const getStatusBadge = (status: string, published: boolean) => {
    if (published) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Published</Badge>
    }
    switch (status) {
      case 'completed':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Draft</Badge>
      case 'pending':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Pending</Badge>
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
          title="All Malls"
          description="Manage all malls in the directory"
          breadcrumbs={[{ label: 'Malls' }]}
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
        title="All Malls"
        description="Manage all malls in the directory"
        breadcrumbs={[{ label: 'Malls' }]}
        actions={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadMalls}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => router.push('/admin/malls/add')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Mall
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
                    placeholder="Search by mall name or area..."
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
                {(['all', 'published', 'completed', 'processing', 'pending', 'failed'] as FilterStatus[]).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className="capitalize"
                  >
                    {status === 'completed' ? 'Draft' : status}
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
              Malls ({totalCount})
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
                <Button onClick={loadMalls} className="mt-4">
                  Retry
                </Button>
              </div>
            ) : malls.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No malls found</p>
                <Button
                  className="mt-4"
                  onClick={() => router.push('/admin/malls/add')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Mall
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
                      <TableHead>Stores</TableHead>
                      <TableHead>Parking</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {malls.map((mall) => (
                      <TableRow
                        key={mall.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => router.push(`/admin/malls/${mall.id}/review`)}
                      >
                        <TableCell className="font-medium">
                          {mall.name}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(mall.extraction_status, mall.published)}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {mall.area}
                        </TableCell>
                        <TableCell>
                          {mall.total_stores ? (
                            <div className="flex items-center gap-1">
                              <Store className="w-4 h-4 text-gray-500" />
                              <span>{mall.total_stores}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {mall.total_parking_spaces ? (
                            <div className="flex items-center gap-1">
                              <ParkingCircle className="w-4 h-4 text-gray-500" />
                              <span>{mall.total_parking_spaces.toLocaleString()}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {mall.google_rating ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span>{mall.google_rating.toFixed(1)}</span>
                              {mall.google_review_count && (
                                <span className="text-gray-500 text-sm">
                                  ({mall.google_review_count})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {formatDate(mall.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/admin/malls/${mall.id}/review`)
                              }}
                            >
                              Review
                            </Button>
                            {mall.extraction_status === 'completed' && mall.slug && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(`/places-to-shop/malls/${mall.slug}`, '_blank')
                                }}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            )}
                            {mall.published ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openUnpublishDialog(mall)
                                }}
                                disabled={publishingMallId === mall.id}
                                className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                title="Unpublish mall"
                              >
                                {publishingMallId === mall.id ? (
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
                                  handlePublish(mall)
                                }}
                                disabled={publishingMallId === mall.id}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Publish mall"
                              >
                                {publishingMallId === mall.id ? (
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
            <AlertDialogTitle>Unpublish Mall</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unpublish <strong>{mallToUnpublish?.name}</strong>?
              <br />
              <br />
              This will remove the mall from the public site. You can re-publish it anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeUnpublishDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnpublish}
              className="bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-600"
            >
              Unpublish Mall
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarInset>
  )
}

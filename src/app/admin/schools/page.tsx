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
import { Search, Plus, RefreshCw, Star, GraduationCap, ExternalLink, Trash2, Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
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

interface SchoolListItem {
  id: string
  name: string
  slug: string
  status: 'draft' | 'completed' | 'failed' | 'processing' | 'pending'
  area: string
  schoolType: string | null
  curriculum: string[] | null
  rating: number | null
  reviewCount: number | null
  tuitionMin: number | null
  heroImage: string | null
  logoImage: string | null
  createdAt: string
  published: boolean
}

type FilterStatus = 'all' | 'draft' | 'published' | 'failed' | 'processing' | 'pending'

export default function SchoolsListPage() {
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const [schools, setSchools] = useState<SchoolListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [totalCount, setTotalCount] = useState(0)
  const [deletingSchoolId, setDeletingSchoolId] = useState<string | null>(null)
  const [schoolToDelete, setSchoolToDelete] = useState<SchoolListItem | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [publishingSchoolId, setPublishingSchoolId] = useState<string | null>(null)
  const [schoolToUnpublish, setSchoolToUnpublish] = useState<SchoolListItem | null>(null)
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false)

  // Hydration effect
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Load schools when filters change
  useEffect(() => {
    if (isHydrated) {
      loadSchools()
    }
  }, [statusFilter, isHydrated])

  const loadSchools = async () => {
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

      const response = await fetch(`/api/admin/schools/list?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load schools')
      }

      setSchools(data.schools || [])
      setTotalCount(data.pagination?.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schools')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadSchools()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const openDeleteDialog = (school: SchoolListItem) => {
    setSchoolToDelete(school)
    setShowDeleteDialog(true)
  }

  const closeDeleteDialog = () => {
    setShowDeleteDialog(false)
    setSchoolToDelete(null)
  }

  const handleDelete = async () => {
    if (!schoolToDelete) return

    try {
      setDeletingSchoolId(schoolToDelete.id)
      setShowDeleteDialog(false)

      const response = await fetch('/api/admin/schools/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId: schoolToDelete.id })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete school')
      }

      // Show success message with image stats
      const { stats } = data
      if (stats.imagesFailed > 0) {
        toast.warning(
          `School deleted but ${stats.imagesFailed} of ${stats.totalImages} images could not be removed from storage`
        )
      } else {
        toast.success(
          `School deleted successfully${stats.totalImages > 0 ? ` (${stats.imagesDeleted} images removed)` : ''}`
        )
      }

      // Wait a brief moment for animation before removing from list
      setTimeout(() => {
        setSchools(prevSchools => prevSchools.filter(s => s.id !== schoolToDelete.id))
        setTotalCount(prev => prev - 1)
        setDeletingSchoolId(null)
        setSchoolToDelete(null)
      }, 300)

    } catch (err) {
      console.error('Delete error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to delete school')
      setDeletingSchoolId(null)
      setSchoolToDelete(null)
    }
  }

  const openUnpublishDialog = (school: SchoolListItem) => {
    setSchoolToUnpublish(school)
    setShowUnpublishDialog(true)
  }

  const closeUnpublishDialog = () => {
    setShowUnpublishDialog(false)
    setSchoolToUnpublish(null)
  }

  const handlePublish = async (school: SchoolListItem) => {
    try {
      setPublishingSchoolId(school.id)

      const response = await fetch(`/api/admin/schools/${school.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to publish school')
      }

      toast.success(data.message || 'School published successfully')

      // Update the school in the list
      setSchools(prevSchools =>
        prevSchools.map(s =>
          s.id === school.id ? { ...s, published: true } : s
        )
      )
    } catch (err) {
      console.error('Publish error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to publish school')
    } finally {
      setPublishingSchoolId(null)
    }
  }

  const handleUnpublish = async () => {
    if (!schoolToUnpublish) return

    try {
      setPublishingSchoolId(schoolToUnpublish.id)
      setShowUnpublishDialog(false)

      const response = await fetch(`/api/admin/schools/${schoolToUnpublish.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unpublish' })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to unpublish school')
      }

      toast.success(data.message || 'School unpublished successfully')

      // Update the school in the list
      setSchools(prevSchools =>
        prevSchools.map(s =>
          s.id === schoolToUnpublish.id ? { ...s, published: false } : s
        )
      )
      setSchoolToUnpublish(null)
    } catch (err) {
      console.error('Unpublish error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to unpublish school')
      setSchoolToUnpublish(null)
    } finally {
      setPublishingSchoolId(null)
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

  const formatTuition = (tuition: number | null) => {
    if (!tuition) return '-'
    return `From KD ${tuition.toLocaleString()}`
  }

  // Show loading skeleton until hydrated
  if (!isHydrated) {
    return (
      <SidebarInset>
        <AdminPageHeader
          title="All Schools"
          description="Manage all schools in the directory"
          breadcrumbs={[{ label: 'Schools' }]}
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
        title="All Schools"
        description="Manage all schools in the directory"
        breadcrumbs={[{ label: 'Schools' }]}
        actions={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadSchools}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => router.push('/admin/schools/add')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add School
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
                    placeholder="Search by school name..."
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
                    {status === 'all' ? 'All' : status}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card>
          <CardContent className="p-0">
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
                <Button onClick={loadSchools} className="mt-4">
                  Retry
                </Button>
              </div>
            ) : schools.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No schools found</p>
                <Button
                  className="mt-4"
                  onClick={() => router.push('/admin/schools/add')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First School
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Curriculum</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Tuition</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schools.map((school) => {
                      const isDeleting = deletingSchoolId === school.id
                      return (
                      <TableRow
                        key={school.id}
                        className={`cursor-pointer hover:bg-gray-50 transition-all duration-300 ${
                          isDeleting ? 'opacity-50 animate-out fade-out slide-out-to-right' : ''
                        }`}
                        onClick={() => !isDeleting && window.open(`/admin/schools/${school.id}/review`, '_blank')}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {school.heroImage || school.logoImage ? (
                              <img
                                src={school.heroImage || school.logoImage || ''}
                                alt={school.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                <GraduationCap className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{school.name}</div>
                              <div className="text-sm text-gray-500">{school.slug}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{school.schoolType || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">
                            {school.curriculum && Array.isArray(school.curriculum)
                              ? school.curriculum.slice(0, 2).join(', ')
                              : '-'}
                          </span>
                        </TableCell>
                        <TableCell>{school.area}</TableCell>
                        <TableCell>
                          <span className="text-sm">{formatTuition(school.tuitionMin)}</span>
                        </TableCell>
                        <TableCell>
                          {school.rating ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span>{school.rating.toFixed(1)}</span>
                              <span className="text-gray-400 text-sm">
                                ({school.reviewCount || 0})
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(school.status)}</TableCell>
                        <TableCell className="text-gray-500">
                          {formatDate(school.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(`/admin/schools/${school.id}/review`, '_blank')
                              }}
                              disabled={isDeleting}
                            >
                              Review
                            </Button>
                            {school.status === 'completed' && school.slug && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(`/places-to-learn/schools/${school.slug}`, '_blank')
                                }}
                                disabled={isDeleting}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            )}
                            {school.published ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openUnpublishDialog(school)
                                }}
                                disabled={isDeleting || publishingSchoolId === school.id}
                                className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                title="Unpublish school"
                              >
                                {publishingSchoolId === school.id ? (
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
                                  handlePublish(school)
                                }}
                                disabled={isDeleting || publishingSchoolId === school.id}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Publish school"
                              >
                                {publishingSchoolId === school.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                openDeleteDialog(school)
                              }}
                              disabled={isDeleting}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {isDeleting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete School</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{schoolToDelete?.name}</strong>?
              <br />
              <br />
              This action cannot be undone. This will permanently delete the school entry and all associated images from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete School
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unpublish Confirmation Dialog */}
      <AlertDialog open={showUnpublishDialog} onOpenChange={setShowUnpublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unpublish School</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unpublish <strong>{schoolToUnpublish?.name}</strong>?
              <br />
              <br />
              This will remove the school from the public site. You can re-publish it anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeUnpublishDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnpublish}
              className="bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-600"
            >
              Unpublish School
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarInset>
  )
}
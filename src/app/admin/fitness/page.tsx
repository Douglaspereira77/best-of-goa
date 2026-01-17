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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Search, Plus, RefreshCw, Star, MapPin, Dumbbell, ExternalLink, X, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface FitnessListItem {
  id: string
  name: string
  slug: string
  extraction_status: 'completed' | 'pending' | 'processing' | 'failed'
  area: string
  fitness_types: string[] | null
  gender_policy: string | null
  google_rating: number | null
  google_review_count: number | null
  active: boolean
  published: boolean
  hero_image: string | null
  created_at: string
}

type FilterStatus = 'all' | 'published' | 'active' | 'pending' | 'processing' | 'failed'
type GenderPolicyFilter = '' | 'women-only' | 'men-only' | 'co-ed' | 'not_set'

const GENDER_POLICY_OPTIONS = [
  { value: 'women-only', label: 'Women Only' },
  { value: 'men-only', label: 'Men Only' },
  { value: 'co-ed', label: 'Co-ed' },
  { value: 'not_set', label: 'Not Set' }
]

export default function FitnessListPage() {
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const [fitnessPlaces, setFitnessPlaces] = useState<FitnessListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [genderPolicyFilter, setGenderPolicyFilter] = useState<GenderPolicyFilter>('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [publishingFitnessId, setPublishingFitnessId] = useState<string | null>(null)
  const [fitnessToUnpublish, setFitnessToUnpublish] = useState<FitnessListItem | null>(null)
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      loadFitnessPlaces()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, genderPolicyFilter, isHydrated])

  const loadFitnessPlaces = async () => {
    try {
      setLoading(true)
      setError(null)
      setSelectedIds(new Set()) // Clear selections when reloading

      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      if (genderPolicyFilter) {
        params.append('gender_policy', genderPolicyFilter)
      }
      params.append('limit', '100')

      const response = await fetch(`/api/admin/fitness/list?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load fitness places')
      }

      setFitnessPlaces(data.fitness_places || [])
      setTotalCount(data.pagination?.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fitness places')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadFitnessPlaces()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const openUnpublishDialog = (fitness: FitnessListItem) => {
    setFitnessToUnpublish(fitness)
    setShowUnpublishDialog(true)
  }

  const closeUnpublishDialog = () => {
    setShowUnpublishDialog(false)
    setFitnessToUnpublish(null)
  }

  const handlePublish = async (fitness: FitnessListItem) => {
    try {
      setPublishingFitnessId(fitness.id)

      const response = await fetch(`/api/admin/fitness/${fitness.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to publish fitness place')
      }

      toast.success(data.message || 'Fitness place published successfully')

      // Update the fitness place in the list
      setFitnessPlaces(prevFitness =>
        prevFitness.map(f =>
          f.id === fitness.id ? { ...f, published: true } : f
        )
      )
    } catch (err) {
      console.error('Publish error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to publish fitness place')
    } finally {
      setPublishingFitnessId(null)
    }
  }

  const handleUnpublish = async () => {
    if (!fitnessToUnpublish) return

    try {
      setPublishingFitnessId(fitnessToUnpublish.id)
      setShowUnpublishDialog(false)

      const response = await fetch(`/api/admin/fitness/${fitnessToUnpublish.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unpublish' })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to unpublish fitness place')
      }

      toast.success(data.message || 'Fitness place unpublished successfully')

      // Update the fitness place in the list
      setFitnessPlaces(prevFitness =>
        prevFitness.map(f =>
          f.id === fitnessToUnpublish.id ? { ...f, published: false } : f
        )
      )
      setFitnessToUnpublish(null)
    } catch (err) {
      console.error('Unpublish error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to unpublish fitness place')
      setFitnessToUnpublish(null)
    } finally {
      setPublishingFitnessId(null)
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

  const getGenderBadge = (genderPolicy: string | null) => {
    if (!genderPolicy) return <Badge variant="outline" className="border-gray-300 text-gray-500">Not Set</Badge>

    switch (genderPolicy) {
      case 'women-only':
        return <Badge variant="outline" className="border-pink-300 text-pink-700">Women Only</Badge>
      case 'men-only':
        return <Badge variant="outline" className="border-blue-300 text-blue-700">Men Only</Badge>
      case 'separate-hours':
        return <Badge variant="outline" className="border-purple-300 text-purple-700">Separate Hours</Badge>
      case 'co-ed':
        return <Badge variant="outline" className="border-green-300 text-green-700">Co-Ed</Badge>
      default:
        return <Badge variant="outline">{genderPolicy}</Badge>
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === fitnessPlaces.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(fitnessPlaces.map(fp => fp.id)))
    }
  }

  const toggleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkUpdateGenderPolicy = async (newPolicy: string) => {
    if (selectedIds.size === 0) return

    try {
      setBulkUpdating(true)
      setError(null)

      const response = await fetch('/api/admin/fitness/bulk-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          gender_policy: newPolicy
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update')
      }

      // Reload the list to show updated data
      await loadFitnessPlaces()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk update')
    } finally {
      setBulkUpdating(false)
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
          title="All Fitness Places"
          description="Manage all fitness centers in the directory"
          breadcrumbs={[{ label: 'Fitness' }]}
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
        title="All Fitness Places"
        description={`${totalCount} fitness centers in the directory`}
        breadcrumbs={[{ label: 'Fitness' }]}
      />

      {/* Filters & Actions */}
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search fitness places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} variant="secondary">
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
          <Button onClick={() => router.push('/admin/fitness/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Fitness Place
          </Button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'published' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('published')}
          >
            Published
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('active')}
          >
            Draft
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === 'processing' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('processing')}
          >
            Processing
          </Button>
          <Button
            variant={statusFilter === 'failed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('failed')}
          >
            Failed
          </Button>
        </div>

        {/* Gender Policy Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Gender Policy:</span>
            <Select
              value={genderPolicyFilter}
              onValueChange={(value: GenderPolicyFilter) => setGenderPolicyFilter(value)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select filter..." />
              </SelectTrigger>
              <SelectContent>
                {GENDER_POLICY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {genderPolicyFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGenderPolicyFilter('')}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Bulk Edit Controls */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-600">
                {selectedIds.size} selected
              </span>
              <Select
                onValueChange={(value) => handleBulkUpdateGenderPolicy(value)}
                disabled={bulkUpdating}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Set Gender Policy..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="women-only">Women Only</SelectItem>
                  <SelectItem value="men-only">Men Only</SelectItem>
                  <SelectItem value="co-ed">Co-ed</SelectItem>
                </SelectContent>
              </Select>
              {bulkUpdating && (
                <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Loading fitness places...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={loadFitnessPlaces} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : fitnessPlaces.length === 0 ? (
              <div className="p-8 text-center">
                <Dumbbell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 mb-4">No fitness places found</p>
                <Button onClick={() => router.push('/admin/fitness/add')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Fitness Place
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={fitnessPlaces.length > 0 && selectedIds.size === fitnessPlaces.length}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Gender Policy</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fitnessPlaces.map((fitness) => (
                    <TableRow key={fitness.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(fitness.id)}
                          onCheckedChange={() => toggleSelectOne(fitness.id)}
                          aria-label={`Select ${fitness.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {fitness.hero_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={fitness.hero_image}
                              alt={fitness.name}
                              className="w-12 h-12 rounded object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                              <Dumbbell className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{fitness.name}</div>
                            <div className="text-sm text-gray-500">/{fitness.slug}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-3 h-3" />
                          {fitness.area || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {fitness.fitness_types?.slice(0, 2).map((type) => (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                          {(fitness.fitness_types?.length || 0) > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{(fitness.fitness_types?.length || 0) - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getGenderBadge(fitness.gender_policy)}
                      </TableCell>
                      <TableCell>
                        {fitness.google_rating ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{fitness.google_rating}</span>
                            <span className="text-sm text-gray-500">
                              ({fitness.google_review_count})
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">No rating</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(fitness.extraction_status, fitness.published)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(fitness.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/admin/fitness/${fitness.id}/review`)}
                          >
                            Review
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(`/things-to-do/fitness/${fitness.slug}`, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          {fitness.published ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                openUnpublishDialog(fitness)
                              }}
                              disabled={publishingFitnessId === fitness.id}
                              className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                              title="Unpublish fitness place"
                            >
                              {publishingFitnessId === fitness.id ? (
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
                                handlePublish(fitness)
                              }}
                              disabled={publishingFitnessId === fitness.id}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Publish fitness place"
                            >
                              {publishingFitnessId === fitness.id ? (
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
            <AlertDialogTitle>Unpublish Fitness Place</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unpublish <strong>{fitnessToUnpublish?.name}</strong>?
              <br />
              <br />
              This will remove the fitness place from the public site. You can re-publish it anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeUnpublishDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnpublish}
              className="bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-600"
            >
              Unpublish Fitness Place
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarInset>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { SidebarInset } from '@/components/ui/sidebar'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { StatusBadge } from '@/components/admin/ui/StatusBadge'
import { ActionButton } from '@/components/admin/ui/ActionButton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'

interface QueueRestaurant {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress_percentage: number
  current_step?: string
  created_at: string
  updated_at: string
  error_message?: string
  thumbnail_url?: string
}

type FilterStatus = 'all' | 'pending' | 'processing' | 'completed' | 'failed'

export default function QueueManagementPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [restaurants, setRestaurants] = useState<QueueRestaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([])

  // Additional filters
  const [cuisineFilter, setCuisineFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>('all')

  // Filter options
  const [cuisines, setCuisines] = useState<{id: string, name: string}[]>([])
  const [categories, setCategories] = useState<{id: string, name: string}[]>([])
  const [neighborhoods, setNeighborhoods] = useState<{id: number, name: string}[]>([])

  // Hydration effect
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Load filter options on mount
  useEffect(() => {
    if (isHydrated) {
      loadFilterOptions()
    }
  }, [isHydrated])

  // Reload restaurants when any filter changes
  useEffect(() => {
    if (isHydrated) {
      loadRestaurants()
    }
  }, [statusFilter, cuisineFilter, categoryFilter, neighborhoodFilter, isHydrated])

  const loadFilterOptions = async () => {
    try {
      // Load cuisines
      console.log('[Filter Options] Loading cuisines...')
      const cuisinesRes = await fetch('/api/admin/filters/cuisines')
      console.log('[Filter Options] Cuisines response status:', cuisinesRes.status)
      if (cuisinesRes.ok) {
        const cuisinesData = await cuisinesRes.json()
        console.log('[Filter Options] Cuisines data:', cuisinesData)
        setCuisines(cuisinesData.cuisines || [])
        console.log('[Filter Options] Cuisines set:', cuisinesData.cuisines?.length || 0)
      } else {
        console.error('[Filter Options] Cuisines request failed:', cuisinesRes.status)
      }

      // Load categories
      console.log('[Filter Options] Loading categories...')
      const categoriesRes = await fetch('/api/admin/filters/categories')
      console.log('[Filter Options] Categories response status:', categoriesRes.status)
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        console.log('[Filter Options] Categories data:', categoriesData)
        setCategories(categoriesData.categories || [])
        console.log('[Filter Options] Categories set:', categoriesData.categories?.length || 0)
      } else {
        console.error('[Filter Options] Categories request failed:', categoriesRes.status)
      }

      // Load neighborhoods
      console.log('[Filter Options] Loading neighborhoods...')
      const neighborhoodsRes = await fetch('/api/admin/filters/neighborhoods')
      console.log('[Filter Options] Neighborhoods response status:', neighborhoodsRes.status)
      if (neighborhoodsRes.ok) {
        const neighborhoodsData = await neighborhoodsRes.json()
        console.log('[Filter Options] Neighborhoods data:', neighborhoodsData)
        setNeighborhoods(neighborhoodsData.neighborhoods || [])
        console.log('[Filter Options] Neighborhoods set:', neighborhoodsData.neighborhoods?.length || 0)
      } else {
        console.error('[Filter Options] Neighborhoods request failed:', neighborhoodsRes.status)
      }
    } catch (err) {
      console.error('Failed to load filter options:', err)
    }
  }

  const loadRestaurants = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (cuisineFilter !== 'all') {
        params.append('cuisine', cuisineFilter)
      }
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter)
      }
      if (neighborhoodFilter !== 'all') {
        params.append('neighborhood', neighborhoodFilter)
      }
      params.append('limit', '50')

      const response = await fetch(`/api/admin/restaurants/queue?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load restaurants')
      }

      setRestaurants(data.restaurants || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load restaurants')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    // Filter restaurants based on search query
    const filtered = restaurants.filter(restaurant =>
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setRestaurants(filtered)
  }

  const handleStatusFilter = (status: FilterStatus) => {
    setStatusFilter(status)
  }

  const handleSelectRestaurant = (restaurantId: string) => {
    setSelectedRestaurants(prev =>
      prev.includes(restaurantId)
        ? prev.filter(id => id !== restaurantId)
        : [...prev, restaurantId]
    )
  }

  const handleSelectAll = () => {
    if (selectedRestaurants.length === restaurants.length) {
      setSelectedRestaurants([])
    } else {
      setSelectedRestaurants(restaurants.map(r => r.id))
    }
  }

  const handleBulkAction = (action: 'delete' | 'retry') => {
    if (selectedRestaurants.length === 0) return

    if (action === 'delete') {
      if (confirm(`Are you sure you want to delete ${selectedRestaurants.length} restaurants?`)) {
        // Implement bulk delete
        console.log('Bulk delete:', selectedRestaurants)
      }
    } else if (action === 'retry') {
      // Implement bulk retry
      console.log('Bulk retry:', selectedRestaurants)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Show loading skeleton until hydrated
  if (!isHydrated) {
    return (
      <SidebarInset>
        <AdminPageHeader
          title="Queue Management"
          description="Manage restaurant import queue and processing status"
          breadcrumbs={[{ label: 'Queue Management' }]}
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
        title="Queue Management"
        description="Manage restaurant import queue and processing status"
        breadcrumbs={[
          { label: 'Restaurants', href: '/admin/restaurants' },
          { label: 'Extraction Queue' }
        ]}
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
            {selectedRestaurants.length > 0 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('retry')}
                >
                  Retry Selected
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                >
                  Delete Selected
                </Button>
              </div>
            )}
          </div>
        }
      />

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search restaurants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                {(['all', 'processing', 'pending', 'completed', 'failed'] as FilterStatus[]).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusFilter(status)}
                    className="capitalize"
                  >
                    {status}
                  </Button>
                ))}
              </div>

              {/* Additional Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Cuisine
                  </label>
                  <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Cuisines" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cuisines</SelectItem>
                      {cuisines.map((cuisine) => (
                        <SelectItem key={cuisine.id} value={cuisine.id}>
                          {cuisine.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Category
                  </label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Neighborhood
                  </label>
                  <Select
                    value={neighborhoodFilter}
                    onValueChange={setNeighborhoodFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Neighborhoods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Neighborhoods</SelectItem>
                      {neighborhoods.map((neighborhood) => (
                        <SelectItem
                          key={neighborhood.id}
                          value={neighborhood.id.toString()}
                        >
                          {neighborhood.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Restaurants ({filteredRestaurants.length})
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedRestaurants.length === restaurants.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded"></div>
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
            ) : filteredRestaurants.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No restaurants found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRestaurants.map((restaurant) => (
                  <div
                    key={restaurant.id}
                    className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRestaurants.includes(restaurant.id)}
                      onChange={() => handleSelectRestaurant(restaurant.id)}
                      className="rounded"
                    />
                    
                    {restaurant.thumbnail_url && (
                      <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={restaurant.thumbnail_url}
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {restaurant.name}
                        </h3>
                        <StatusBadge status={restaurant.status} />
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Created: {formatDate(restaurant.created_at)}</span>
                        {restaurant.current_step && (
                          <span>Step: {restaurant.current_step}</span>
                        )}
                      </div>
                      
                      {restaurant.status === 'processing' && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{restaurant.progress_percentage}%</span>
                          </div>
                          <Progress value={restaurant.progress_percentage} className="h-2" />
                        </div>
                      )}
                      
                      {restaurant.error_message && (
                        <div className="mt-2 text-sm text-red-600">
                          Error: {restaurant.error_message}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <ActionButton
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open(`/admin/restaurants/${restaurant.id}/review`, '_blank')}
                      >
                        <Eye className="w-4 h-4" />
                      </ActionButton>
                      
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  )
}
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, XCircle, Star, Eye, Download, Trash2, Filter, Grid, List } from 'lucide-react'
import Image from 'next/image'

interface RestaurantImage {
  id: string
  url: string
  type: 'exterior' | 'interior' | 'food' | 'menu'
  approved: boolean
  is_hero: boolean
  ai_quality_score?: number
  storage_path?: string
}

interface RestaurantReviewData {
  id: string
  name: string
  images?: RestaurantImage[]
}

interface ImagesTabProps {
  restaurant: RestaurantReviewData
  onUpdate: (updates: Partial<RestaurantReviewData>) => void
}

export function ImagesTab({ restaurant, onUpdate }: ImagesTabProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<'all' | 'exterior' | 'interior' | 'food' | 'menu'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all')
  const [selectedImages, setSelectedImages] = useState<string[]>([])

  const images = restaurant.images || []
  
  const filteredImages = images.filter(image => {
    const typeMatch = filterType === 'all' || image.type === filterType
    const statusMatch = filterStatus === 'all' || 
      (filterStatus === 'approved' && image.approved) ||
      (filterStatus === 'pending' && !image.approved)
    return typeMatch && statusMatch
  })

  const handleApproveImage = (imageId: string) => {
    const updatedImages = images.map(image =>
      image.id === imageId ? { ...image, approved: true } : image
    )
    onUpdate({ images: updatedImages })
  }

  const handleRejectImage = (imageId: string) => {
    const updatedImages = images.map(image =>
      image.id === imageId ? { ...image, approved: false } : image
    )
    onUpdate({ images: updatedImages })
  }

  const handleSetHero = (imageId: string) => {
    const updatedImages = images.map(image =>
      image.id === imageId 
        ? { ...image, is_hero: true, approved: true }
        : { ...image, is_hero: false }
    )
    onUpdate({ images: updatedImages })
  }

  const handleDeleteImage = (imageId: string) => {
    const updatedImages = images.filter(image => image.id !== imageId)
    onUpdate({ images: updatedImages })
  }

  const handleBulkApprove = () => {
    const updatedImages = images.map(image =>
      selectedImages.includes(image.id) ? { ...image, approved: true } : image
    )
    onUpdate({ images: updatedImages })
    setSelectedImages([])
  }

  const handleBulkReject = () => {
    const updatedImages = images.map(image =>
      selectedImages.includes(image.id) ? { ...image, approved: false } : image
    )
    onUpdate({ images: updatedImages })
    setSelectedImages([])
  }

  const handleBulkDelete = () => {
    const updatedImages = images.filter(image => !selectedImages.includes(image.id))
    onUpdate({ images: updatedImages })
    setSelectedImages([])
  }

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev =>
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    )
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'exterior': return 'bg-blue-100 text-blue-800'
      case 'interior': return 'bg-green-100 text-green-800'
      case 'food': return 'bg-orange-100 text-orange-800'
      case 'menu': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getQualityColor = (score?: number) => {
    if (!score) return 'text-gray-500'
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Image Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Image Management</CardTitle>
              <CardDescription>
                {images.length} total images • {images.filter(img => img.approved).length} approved • {images.filter(img => img.is_hero).length} hero image(s)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{images.length}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{images.filter(img => img.approved).length}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{images.filter(img => !img.approved).length}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{images.filter(img => img.is_hero).length}</div>
              <div className="text-sm text-gray-600">Hero</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Bulk Actions */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>Type:</Label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="all">All Types</option>
                <option value="exterior">Exterior</option>
                <option value="interior">Interior</option>
                <option value="food">Food</option>
                <option value="menu">Menu</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Label>Status:</Label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {selectedImages.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-600">{selectedImages.length} selected</span>
                <Button size="sm" onClick={handleBulkApprove}>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={handleBulkReject}>
                  <XCircle className="h-3 w-3 mr-1" />
                  Reject
                </Button>
                <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Images Grid/List */}
      {filteredImages.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Images Found</h3>
            <p className="text-gray-600">No images match your current filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
          {filteredImages.map((image) => (
            <Card key={image.id} className="overflow-hidden">
              <div className="relative">
                <div className="aspect-video relative bg-gray-100">
                  <Image
                    src={image.url}
                    alt={`${restaurant.name} - ${image.type}`}
                    fill
                    className="object-cover"
                  />
                  {image.is_hero && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-purple-600">
                        <Star className="h-3 w-3 mr-1" />
                        Hero
                      </Badge>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <input
                      type="checkbox"
                      checked={selectedImages.includes(image.id)}
                      onChange={() => toggleImageSelection(image.id)}
                      className="w-4 h-4"
                    />
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className={getTypeColor(image.type)}>
                        {image.type}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {image.approved ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </div>
                    
                    {image.ai_quality_score && (
                      <div className="text-sm">
                        <span className="text-gray-600">Quality: </span>
                        <span className={`font-medium ${getQualityColor(image.ai_quality_score)}`}>
                          {image.ai_quality_score}/10
                        </span>
                      </div>
                    )}
                    
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApproveImage(image.id)}
                        disabled={image.approved}
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectImage(image.id)}
                        disabled={!image.approved}
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetHero(image.id)}
                        disabled={image.is_hero}
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(image.url, '_blank')}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteImage(image.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}


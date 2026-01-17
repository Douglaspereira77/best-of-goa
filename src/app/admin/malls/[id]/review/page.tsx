'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SidebarInset } from '@/components/ui/sidebar'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Save,
  ExternalLink,
  RefreshCw,
  MapPin,
  Phone,
  Globe,
  Instagram,
  Facebook,
  Star,
  Store,
  ParkingCircle,
  Trash2,
} from 'lucide-react'
import { ImageApproval } from '@/components/admin/review/ImageApproval'
import { PreviewPanel } from '@/components/admin/review/PreviewPanel'

interface ImageData {
  id: string
  url: string
  alt?: string
  status: 'pending' | 'approved' | 'rejected'
  quality?: number
  tags?: string[]
  isHero?: boolean
  displayOrder?: number
}

interface MallData {
  id: string
  name: string
  slug: string
  extraction_status: string
  address?: string
  area?: string
  phone?: string
  website?: string
  instagram?: string
  facebook?: string
  twitter?: string
  google_rating?: number
  google_review_count?: number
  total_stores?: number
  total_floors?: number
  total_parking_spaces?: number
  year_opened?: number
  description?: string
  short_description?: string
  meta_title?: string
  meta_description?: string
  hero_image?: string
  latitude?: number
  longitude?: number
  active?: boolean
  apify_output?: any
  firecrawl_output?: any
}

export default function MallReviewPage() {
  const params = useParams()
  const router = useRouter()
  const mallId = params.id as string

  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [mall, setMall] = useState<MallData | null>(null)
  const [editedFields, setEditedFields] = useState<Partial<MallData>>({})
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [images, setImages] = useState<ImageData[]>([])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (mallId && isMounted) {
      loadMallData()
      loadImages()
    }
  }, [mallId, isMounted])

  const loadMallData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/malls/${mallId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load mall data')
      }

      setMall(data.mall)
      setEditedFields({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mall data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadImages = async () => {
    try {
      const response = await fetch(`/api/admin/malls/${mallId}/images`)
      const data = await response.json()
      if (response.ok) {
        const mappedImages = (data.images || []).map((img: any) => ({
          id: img.id,
          url: img.url,
          alt: img.alt_text,
          status: img.approved ? 'approved' : 'pending',
          isHero: img.is_hero,
          displayOrder: img.display_order
        }))
        setImages(mappedImages)
      }
    } catch (err) {
      console.error('Failed to load images:', err)
    }
  }

  // Image handlers
  const handleImageApprove = (imageId: string) => {
    setImages(prev => prev.map(img =>
      img.id === imageId ? { ...img, status: 'approved' as const } : img
    ))
  }

  const handleImageReject = (imageId: string) => {
    setImages(prev => prev.map(img =>
      img.id === imageId ? { ...img, status: 'rejected' as const } : img
    ))
  }

  const handleImageDelete = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId))
  }

  const handleImageView = (imageId: string) => {
    const image = images.find(img => img.id === imageId)
    if (image) {
      window.open(image.url, '_blank')
    }
  }

  const handleSetHero = (imageId: string) => {
    setImages(prev => prev.map(img => ({
      ...img,
      isHero: img.id === imageId
    })))
  }

  const handleFieldChange = (field: keyof MallData, value: any) => {
    setEditedFields(prev => ({
      ...prev,
      [field]: value
    }))
    setSuccessMessage(null)
  }

  const getFieldValue = (field: keyof MallData) => {
    return editedFields[field] !== undefined ? editedFields[field] : mall?.[field] || ''
  }

  const handleSave = async () => {
    if (!mall || Object.keys(editedFields).length === 0) return

    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch(`/api/admin/malls/${mallId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedFields)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save changes')
      }

      setMall(prev => prev ? { ...prev, ...editedFields } : null)
      setEditedFields({})
      setSuccessMessage('Changes saved successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!mall) return

    if (!confirm('Are you sure you want to delete this mall? This action cannot be undone.')) {
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch(`/api/admin/malls/${mallId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete mall')
      }

      // Redirect to malls list
      router.push('/admin/malls')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete mall')
      setIsSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (!isMounted) {
    return null
  }

  if (isLoading) {
    return (
      <SidebarInset>
        <AdminPageHeader
          title="Review Mall"
          description="Loading mall data..."
          breadcrumbs={[
            { label: 'Malls', href: '/admin/malls' },
            { label: 'Review' }
          ]}
        />
        <div className="flex flex-1 items-center justify-center p-6">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </SidebarInset>
    )
  }

  if (error && !mall) {
    return (
      <SidebarInset>
        <AdminPageHeader
          title="Review Mall"
          description="Error loading mall"
          breadcrumbs={[
            { label: 'Malls', href: '/admin/malls' },
            { label: 'Review' }
          ]}
        />
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadMallData}>Retry</Button>
        </div>
      </SidebarInset>
    )
  }

  if (!mall) {
    return null
  }

  const hasChanges = Object.keys(editedFields).length > 0

  return (
    <SidebarInset>
      <AdminPageHeader
        title={`Review: ${mall.name}`}
        description="Review and edit mall data"
        breadcrumbs={[
          { label: 'Malls', href: '/admin/malls' },
          { label: mall.name }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => window.open(`/places-to-shop/malls/${mall.slug}`, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Public Page
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isSaving}
              variant="destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        }
      />

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
            {successMessage}
          </div>
        )}

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Status</span>
              {getStatusBadge(mall.extraction_status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {mall.google_rating && (
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span>{mall.google_rating} ({mall.google_review_count} reviews)</span>
                </div>
              )}
              {mall.total_stores && (
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-gray-500" />
                  <span>{mall.total_stores} stores</span>
                </div>
              )}
              {mall.total_parking_spaces && (
                <div className="flex items-center gap-2">
                  <ParkingCircle className="w-5 h-5 text-gray-500" />
                  <span>{mall.total_parking_spaces.toLocaleString()} parking</span>
                </div>
              )}
              {mall.area && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <span>{mall.area}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <Input
                  value={getFieldValue('name')}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Slug</label>
                <Input
                  value={getFieldValue('slug')}
                  onChange={(e) => handleFieldChange('slug', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Address</label>
                <Input
                  value={getFieldValue('address')}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Area</label>
                <Input
                  value={getFieldValue('area')}
                  onChange={(e) => handleFieldChange('area', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Total Stores</label>
                  <Input
                    type="number"
                    value={getFieldValue('total_stores') || ''}
                    onChange={(e) => handleFieldChange('total_stores', parseInt(e.target.value) || null)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Total Floors</label>
                  <Input
                    type="number"
                    value={getFieldValue('total_floors') || ''}
                    onChange={(e) => handleFieldChange('total_floors', parseInt(e.target.value) || null)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Parking Spaces</label>
                  <Input
                    type="number"
                    value={getFieldValue('total_parking_spaces') || ''}
                    onChange={(e) => handleFieldChange('total_parking_spaces', parseInt(e.target.value) || null)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Year Opened</label>
                  <Input
                    type="number"
                    value={getFieldValue('year_opened') || ''}
                    onChange={(e) => handleFieldChange('year_opened', parseInt(e.target.value) || null)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Social */}
          <Card>
            <CardHeader>
              <CardTitle>Contact & Social Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <Input
                  value={getFieldValue('phone')}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  placeholder="+965 xxxx xxxx"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Website</label>
                <Input
                  value={getFieldValue('website')}
                  onChange={(e) => handleFieldChange('website', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Instagram</label>
                <Input
                  value={getFieldValue('instagram')}
                  onChange={(e) => handleFieldChange('instagram', e.target.value)}
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Facebook</label>
                <Input
                  value={getFieldValue('facebook')}
                  onChange={(e) => handleFieldChange('facebook', e.target.value)}
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Twitter/X</label>
                <Input
                  value={getFieldValue('twitter')}
                  onChange={(e) => handleFieldChange('twitter', e.target.value)}
                  placeholder="https://twitter.com/..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Short Description</label>
                <Textarea
                  value={getFieldValue('short_description')}
                  onChange={(e) => handleFieldChange('short_description', e.target.value)}
                  rows={2}
                  placeholder="Brief description for cards and previews"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Full Description</label>
                <Textarea
                  value={getFieldValue('description')}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  rows={6}
                  placeholder="Detailed description of the mall"
                />
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>SEO Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Meta Title</label>
                <Input
                  value={getFieldValue('meta_title')}
                  onChange={(e) => handleFieldChange('meta_title', e.target.value)}
                  placeholder="Page title for search engines"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(getFieldValue('meta_title') as string || '').length}/60 characters
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Meta Description</label>
                <Textarea
                  value={getFieldValue('meta_description')}
                  onChange={(e) => handleFieldChange('meta_description', e.target.value)}
                  rows={3}
                  placeholder="Description for search engine results"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(getFieldValue('meta_description') as string || '').length}/160 characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Images Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Images ({images.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageApproval
                images={images}
                onApprove={handleImageApprove}
                onReject={handleImageReject}
                onDelete={handleImageDelete}
                onView={handleImageView}
                onSetHero={handleSetHero}
                loading={isLoading}
                entityId={mallId}
                entityType="malls"
                persistToApi={true}
              />
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <PreviewPanel
                slug={mall.slug}
                basePath="/places-to-shop/malls"
                entityName={mall.name}
                isActive={mall.active || false}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>
  )
}

'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarInset } from '@/components/ui/sidebar'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ImageApproval } from '@/components/admin/review/ImageApproval'
import { PreviewPanel } from '@/components/admin/review/PreviewPanel'
import {
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Globe,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Twitter,
  Trash2
} from 'lucide-react'

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

interface AttractionData {
  id: string
  name: string
  nameAr: string | null
  slug: string
  description: string | null
  shortDescription: string | null
  address: string
  area: string
  attractionType: string | null
  isFree: boolean
  admissionFee: number | null
  typicalVisitDuration: string | null
  ageSuitability: string | null
  bestTimeToVisit: string | null
  wheelchairAccessible: boolean
  parkingAvailable: boolean
  guidedToursAvailable: boolean
  audioGuideAvailable: boolean
  photographyAllowed: boolean
  phone: string | null
  email: string | null
  website: string | null
  instagram: string | null
  facebook: string | null
  twitter: string | null
  googleRating: number | null
  googleReviewCount: number | null
  metaTitle: string | null
  metaDescription: string | null
  metaKeywords: string[]
  heroImage: string | null
  openingHours: Record<string, unknown> | null
  extractionStatus: string
  verified: boolean
  featured: boolean
  active: boolean
  createdAt: string
  updatedAt: string
}

export default function AttractionReviewPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [attraction, setAttraction] = useState<AttractionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [formData, setFormData] = useState<Partial<AttractionData>>({})
  const [images, setImages] = useState<ImageData[]>([])

  useEffect(() => {
    loadAttraction()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.id])

  const loadAttraction = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/attractions/${resolvedParams.id}/review`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load attraction')
      }

      setAttraction(data.attraction)
      setFormData(data.attraction)
      setImages(data.images || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attraction')
    } finally {
      setLoading(false)
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

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSaveSuccess(false)

      const response = await fetch(`/api/admin/attractions/${resolvedParams.id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save')
      }

      setAttraction(data.attraction)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    try {
      setSaving(true)
      setError(null)
      setIsPublishing(true)

      const response = await fetch(`/api/admin/attractions/${resolvedParams.id}/publish`, {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish')
      }

      setAttraction((prev) => (prev ? { ...prev, active: true, verified: true } : null))
      setSaveSuccess(true)

      // Redirect to published page after 1.5s delay
      setTimeout(() => {
        if (attraction?.slug) {
          router.push(`/places-to-visit/attractions/${attraction.slug}`)
        }
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish')
      setIsPublishing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!attraction) return

    if (!confirm('Are you sure you want to delete this attraction? This action cannot be undone.')) {
      return
    }

    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/admin/attractions/${resolvedParams.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete attraction')
      }

      // Redirect to attractions list
      router.push('/admin/attractions')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete attraction')
      setSaving(false)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <SidebarInset>
        <AdminPageHeader
          title="Loading..."
          breadcrumbs={[
            { label: 'Attractions', href: '/admin/attractions' },
            { label: 'Review' }
          ]}
        />
        <div className="p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Loading attraction data...</p>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    )
  }

  if (!attraction) {
    return (
      <SidebarInset>
        <AdminPageHeader
          title="Attraction Not Found"
          breadcrumbs={[
            { label: 'Attractions', href: '/admin/attractions' },
            { label: 'Review' }
          ]}
        />
        <div className="p-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">{error || 'Attraction not found'}</p>
              <Button
                onClick={() => router.push('/admin/attractions')}
                variant="outline"
                className="mt-4"
              >
                Back to List
              </Button>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    )
  }

  return (
    <SidebarInset>
      <AdminPageHeader
        title={attraction.name}
        description={`Review and edit attraction details`}
        breadcrumbs={[
          { label: 'Attractions', href: '/admin/attractions' },
          { label: attraction.name }
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Status Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge
                  className={
                    attraction.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }
                >
                  {attraction.active ? 'Published' : 'Draft'}
                </Badge>
                <span className="text-sm text-gray-500">
                  Extraction: {attraction.extractionStatus}
                </span>
                {attraction.featured && (
                  <Badge className="bg-purple-100 text-purple-800">Featured</Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
                {!attraction.active && (
                  <Button onClick={handlePublish} disabled={saving} variant="default">
                    Publish
                  </Button>
                )}
                <Button onClick={handleDelete} disabled={saving} variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>

            {saveSuccess && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                {isPublishing ? 'Published successfully! Redirecting to published page...' : 'Changes saved successfully'}
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="images">Images ({images.length})</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => updateField('name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Name (Arabic)</Label>
                    <Input
                      value={formData.nameAr || ''}
                      onChange={(e) => updateField('nameAr', e.target.value)}
                      dir="rtl"
                    />
                  </div>
                </div>

                <div>
                  <Label>Slug</Label>
                  <Input value={formData.slug || ''} disabled />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Area</Label>
                    <Input
                      value={formData.area || ''}
                      onChange={(e) => updateField('area', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Attraction Type</Label>
                    <Input
                      value={formData.attractionType || ''}
                      onChange={(e) => updateField('attractionType', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Address</Label>
                  <Input
                    value={formData.address || ''}
                    onChange={(e) => updateField('address', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Short Description</Label>
                  <Textarea
                    value={formData.shortDescription || ''}
                    onChange={(e) => updateField('shortDescription', e.target.value)}
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Full Description</Label>
                  <Textarea
                    value={formData.description || ''}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Visitor Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Typical Visit Duration</Label>
                    <Input
                      value={formData.typicalVisitDuration || ''}
                      onChange={(e) => updateField('typicalVisitDuration', e.target.value)}
                      placeholder="e.g., 1-2 hours"
                    />
                  </div>
                  <div>
                    <Label>Age Suitability</Label>
                    <Input
                      value={formData.ageSuitability || ''}
                      onChange={(e) => updateField('ageSuitability', e.target.value)}
                      placeholder="e.g., all_ages"
                    />
                  </div>
                </div>

                <div>
                  <Label>Best Time to Visit</Label>
                  <Input
                    value={formData.bestTimeToVisit || ''}
                    onChange={(e) => updateField('bestTimeToVisit', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.isFree || false}
                      onCheckedChange={(checked) => updateField('isFree', checked)}
                    />
                    <Label>Free Entry</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.wheelchairAccessible || false}
                      onCheckedChange={(checked) => updateField('wheelchairAccessible', checked)}
                    />
                    <Label>Wheelchair Accessible</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.parkingAvailable || false}
                      onCheckedChange={(checked) => updateField('parkingAvailable', checked)}
                    />
                    <Label>Parking Available</Label>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.guidedToursAvailable || false}
                      onCheckedChange={(checked) => updateField('guidedToursAvailable', checked)}
                    />
                    <Label>Guided Tours</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.audioGuideAvailable || false}
                      onCheckedChange={(checked) => updateField('audioGuideAvailable', checked)}
                    />
                    <Label>Audio Guide</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.photographyAllowed || false}
                      onCheckedChange={(checked) => updateField('photographyAllowed', checked)}
                    />
                    <Label>Photography Allowed</Label>
                  </div>
                </div>

                {!formData.isFree && (
                  <div>
                    <Label>Admission Fee (KWD)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={formData.admissionFee || ''}
                      onChange={(e) => updateField('admissionFee', parseFloat(e.target.value))}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact & Social Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </Label>
                    <Input
                      value={formData.phone || ''}
                      onChange={(e) => updateField('phone', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => updateField('email', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Website
                  </Label>
                  <Input
                    value={formData.website || ''}
                    onChange={(e) => updateField('website', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Instagram className="w-4 h-4" />
                      Instagram
                    </Label>
                    <Input
                      value={formData.instagram || ''}
                      onChange={(e) => updateField('instagram', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Facebook className="w-4 h-4" />
                      Facebook
                    </Label>
                    <Input
                      value={formData.facebook || ''}
                      onChange={(e) => updateField('facebook', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Twitter className="w-4 h-4" />
                      Twitter
                    </Label>
                    <Input
                      value={formData.twitter || ''}
                      onChange={(e) => updateField('twitter', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo">
            <Card>
              <CardHeader>
                <CardTitle>SEO Metadata</CardTitle>
                <CardDescription>
                  Optimize for search engines and social sharing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Meta Title</Label>
                  <Input
                    value={formData.metaTitle || ''}
                    onChange={(e) => updateField('metaTitle', e.target.value)}
                    maxLength={60}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(formData.metaTitle || '').length}/60 characters
                  </p>
                </div>

                <div>
                  <Label>Meta Description</Label>
                  <Textarea
                    value={formData.metaDescription || ''}
                    onChange={(e) => updateField('metaDescription', e.target.value)}
                    maxLength={155}
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(formData.metaDescription || '').length}/155 characters
                  </p>
                </div>

                <div>
                  <Label>Meta Keywords</Label>
                  <Input
                    value={(formData.metaKeywords || []).join(', ')}
                    onChange={(e) =>
                      updateField(
                        'metaKeywords',
                        e.target.value.split(',').map((k) => k.trim())
                      )
                    }
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images">
            <ImageApproval
              images={images}
              onApprove={handleImageApprove}
              onReject={handleImageReject}
              onDelete={handleImageDelete}
              onView={handleImageView}
              onSetHero={(imageId) => {
                // Update local state to reflect new hero
                setImages(prev => prev.map(img => ({
                  ...img,
                  isHero: img.id === imageId
                })))
              }}
              loading={loading}
              entityId={resolvedParams.id}
              entityType="attractions"
              persistToApi={true}
            />
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            <PreviewPanel
              slug={attraction.slug}
              basePath="/places-to-visit/attractions"
              entityName={attraction.name}
              isActive={attraction.active}
            />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarInset>
  )
}

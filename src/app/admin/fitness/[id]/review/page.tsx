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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
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
  Star,
  Dumbbell,
  ChevronDown,
  ChevronUp,
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

interface FitnessData {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  address: string
  area: string
  fitness_types: string[]
  gender_policy: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  amenities: Record<string, any> | null
  pricing_summary: string | null
  class_schedule: string | null
  phone: string | null
  email: string | null
  website: string | null
  instagram: string | null
  facebook: string | null
  twitter: string | null
  tiktok: string | null
  google_rating: number | null
  google_review_count: number | null
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string[]
  hero_image: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  opening_hours: Record<string, any> | null
  extraction_status: string
  verified: boolean
  featured: boolean
  active: boolean
  created_at: string
  updated_at: string
  apify_output: unknown
  firecrawl_output: unknown
}

const FITNESS_TYPES = [
  'gym',
  'yoga',
  'pilates',
  'crossfit',
  'martial-arts',
  'boxing',
  'dance',
  'cycling',
  'swimming',
  'personal-training'
]

const GENDER_POLICIES = [
  { value: 'co-ed', label: 'Co-Ed (Mixed)' },
  { value: 'women-only', label: 'Women Only' },
  { value: 'men-only', label: 'Men Only' },
  { value: 'separate-hours', label: 'Separate Hours' }
]

const AMENITY_CATEGORIES = {
  'Facilities': ['pool', 'sauna', 'steam_room', 'jacuzzi', 'locker_rooms', 'showers'],
  'Services': ['personal_training', 'group_classes', 'childcare', 'cafe', 'pro_shop'],
  'Parking': ['free_parking', 'paid_parking', 'valet_parking'],
  'Accessibility': ['wheelchair_accessible', 'elevator']
}

export default function FitnessReviewPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [fitness, setFitness] = useState<FitnessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [formData, setFormData] = useState<Partial<FitnessData>>({})
  const [showApifyJson, setShowApifyJson] = useState(false)
  const [showFirecrawlJson, setShowFirecrawlJson] = useState(false)
  const [images, setImages] = useState<ImageData[]>([])

  useEffect(() => {
    loadFitness()
    loadImages()
  }, [resolvedParams.id])

  const loadImages = async () => {
    try {
      const response = await fetch(`/api/admin/fitness/${resolvedParams.id}/images`)
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


  const loadFitness = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/fitness/${resolvedParams.id}/review`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load fitness place')
      }

      setFitness(data.fitness)
      setFormData(data.fitness)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fitness place')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSaveSuccess(false)

      const response = await fetch(`/api/admin/fitness/${resolvedParams.id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save')
      }

      setFitness(data.fitness)
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

      const response = await fetch(`/api/admin/fitness/${resolvedParams.id}/publish`, {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish')
      }

      setFitness((prev) => (prev ? { ...prev, active: true, verified: true } : null))
      setSaveSuccess(true)

      // Redirect to published page after 1.5s delay
      setTimeout(() => {
        if (fitness?.slug) {
          router.push(`/things-to-do/fitness/${fitness.slug}`)
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
    if (!fitness) return

    if (!confirm('Are you sure you want to delete this fitness place? This action cannot be undone.')) {
      return
    }

    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/admin/fitness/${resolvedParams.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete fitness place')
      }

      // Redirect to fitness list
      router.push('/admin/fitness')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete fitness place')
      setSaving(false)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleFitnessType = (type: string) => {
    const current = formData.fitness_types || []
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type]
    updateField('fitness_types', updated)
  }

  const toggleAmenity = (amenity: string) => {
    const current = formData.amenities || {}
    updateField('amenities', {
      ...current,
      [amenity]: !current[amenity]
    })
  }

  const getGenderBadgeColor = (policy: string) => {
    switch (policy) {
      case 'women-only':
        return 'bg-pink-100 text-pink-800'
      case 'men-only':
        return 'bg-blue-100 text-blue-800'
      case 'separate-hours':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-green-100 text-green-800'
    }
  }

  if (loading) {
    return (
      <SidebarInset>
        <AdminPageHeader
          title="Loading..."
          breadcrumbs={[
            { label: 'Fitness', href: '/admin/fitness' },
            { label: 'Review' }
          ]}
        />
        <div className="p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Loading fitness place data...</p>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    )
  }

  if (!fitness) {
    return (
      <SidebarInset>
        <AdminPageHeader
          title="Fitness Place Not Found"
          breadcrumbs={[
            { label: 'Fitness', href: '/admin/fitness' },
            { label: 'Review' }
          ]}
        />
        <div className="p-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">{error || 'Fitness place not found'}</p>
              <Button
                onClick={() => router.push('/admin/fitness')}
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
        title={fitness.name}
        description={`Review and edit fitness place details`}
        breadcrumbs={[
          { label: 'Fitness', href: '/admin/fitness' },
          { label: fitness.name }
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
                    fitness.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }
                >
                  {fitness.active ? 'Published' : 'Draft'}
                </Badge>
                <Badge className={getGenderBadgeColor(fitness.gender_policy)}>
                  {GENDER_POLICIES.find((p) => p.value === fitness.gender_policy)?.label || fitness.gender_policy}
                </Badge>
                <span className="text-sm text-gray-500">
                  Extraction: {fitness.extraction_status}
                </span>
                {fitness.featured && (
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
                {!fitness.active && (
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
            <TabsTrigger value="fitness">Fitness Details</TabsTrigger>
            <TabsTrigger value="amenities">Amenities</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="images">Images ({images.length})</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="raw">Raw Data</TabsTrigger>
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
                    <Label>Slug</Label>
                    <Input value={formData.slug || ''} disabled />
                  </div>
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
                    <Label>Gender Policy</Label>
                    <Select
                      value={formData.gender_policy || 'co-ed'}
                      onValueChange={(value) => updateField('gender_policy', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_POLICIES.map((policy) => (
                          <SelectItem key={policy.value} value={policy.value}>
                            {policy.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    value={formData.short_description || ''}
                    onChange={(e) => updateField('short_description', e.target.value)}
                    rows={2}
                    placeholder="Brief description for listing cards"
                  />
                </div>

                <div>
                  <Label>Full Description</Label>
                  <Textarea
                    value={formData.description || ''}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={6}
                    placeholder="Detailed description for the full page"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.verified || false}
                      onCheckedChange={(checked) => updateField('verified', checked)}
                    />
                    <Label>Verified</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.featured || false}
                      onCheckedChange={(checked) => updateField('featured', checked)}
                    />
                    <Label>Featured</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fitness Details Tab */}
          <TabsContent value="fitness">
            <Card>
              <CardHeader>
                <CardTitle>Fitness Categories & Details</CardTitle>
                <CardDescription>
                  Select all fitness types that apply to this location
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Fitness Types</Label>
                  <div className="mt-2 grid grid-cols-3 gap-3">
                    {FITNESS_TYPES.map((type) => (
                      <div
                        key={type}
                        onClick={() => toggleFitnessType(type)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          (formData.fitness_types || []).includes(type)
                            ? 'bg-blue-50 border-blue-300'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Dumbbell className="w-4 h-4" />
                          <span className="text-sm font-medium capitalize">
                            {type.replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Pricing Summary (Optional)</Label>
                  <Textarea
                    value={formData.pricing_summary || ''}
                    onChange={(e) => updateField('pricing_summary', e.target.value)}
                    rows={3}
                    placeholder="e.g., Monthly membership: 50 KWD, Drop-in: 5 KWD per class"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Provide general pricing information if available
                  </p>
                </div>

                <div>
                  <Label>Class Schedule (Optional)</Label>
                  <Textarea
                    value={formData.class_schedule || ''}
                    onChange={(e) => updateField('class_schedule', e.target.value)}
                    rows={4}
                    placeholder="e.g., Yoga: Mon/Wed/Fri 6am, 6pm; CrossFit: Daily 5am, 6am, 7pm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    List main class schedules if known
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Google Rating
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.google_rating || ''}
                      onChange={(e) => updateField('google_rating', parseFloat(e.target.value) || null)}
                    />
                  </div>
                  <div>
                    <Label>Google Review Count</Label>
                    <Input
                      type="number"
                      value={formData.google_review_count || ''}
                      onChange={(e) => updateField('google_review_count', parseInt(e.target.value) || null)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Amenities Tab */}
          <TabsContent value="amenities">
            <Card>
              <CardHeader>
                <CardTitle>Amenities & Facilities</CardTitle>
                <CardDescription>
                  Check all amenities available at this fitness location
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(AMENITY_CATEGORIES).map(([category, amenities]) => (
                  <div key={category}>
                    <Label className="text-base font-semibold mb-3 block">{category}</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {amenities.map((amenity) => (
                        <div
                          key={amenity}
                          onClick={() => toggleAmenity(amenity)}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            (formData.amenities || {})[amenity]
                              ? 'bg-green-50 border-green-300'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded border-2 ${
                                (formData.amenities || {})[amenity]
                                  ? 'bg-green-600 border-green-600'
                                  : 'border-gray-300'
                              }`}
                            >
                              {(formData.amenities || {})[amenity] && (
                                <CheckCircle className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <span className="text-sm capitalize">
                              {amenity.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
                      placeholder="+965 xxxx xxxx"
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
                    placeholder="https://"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Instagram className="w-4 h-4" />
                      Instagram
                    </Label>
                    <Input
                      value={formData.instagram || ''}
                      onChange={(e) => updateField('instagram', e.target.value)}
                      placeholder="@username or full URL"
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
                      placeholder="@page or full URL"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Twitter className="w-4 h-4" />
                      Twitter / X
                    </Label>
                    <Input
                      value={formData.twitter || ''}
                      onChange={(e) => updateField('twitter', e.target.value)}
                      placeholder="@username or full URL"
                    />
                  </div>
                  <div>
                    <Label>TikTok</Label>
                    <Input
                      value={formData.tiktok || ''}
                      onChange={(e) => updateField('tiktok', e.target.value)}
                      placeholder="@username or full URL"
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
                    value={formData.meta_title || ''}
                    onChange={(e) => updateField('meta_title', e.target.value)}
                    maxLength={60}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(formData.meta_title || '').length}/60 characters
                  </p>
                </div>

                <div>
                  <Label>Meta Description</Label>
                  <Textarea
                    value={formData.meta_description || ''}
                    onChange={(e) => updateField('meta_description', e.target.value)}
                    maxLength={155}
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(formData.meta_description || '').length}/155 characters
                  </p>
                </div>

                <div>
                  <Label>Meta Keywords</Label>
                  <Input
                    value={(formData.meta_keywords || []).join(', ')}
                    onChange={(e) =>
                      updateField(
                        'meta_keywords',
                        e.target.value.split(',').map((k) => k.trim()).filter(Boolean)
                      )
                    }
                    placeholder="fitness, gym, yoga, goa"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate with commas
                  </p>
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
              onSetHero={handleSetHero}
              loading={loading}
              entityId={resolvedParams.id}
              entityType="fitness"
              persistToApi={true}
            />
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            <PreviewPanel
              slug={fitness.slug}
              basePath="/things-to-do/fitness"
              entityName={fitness.name}
              isActive={fitness.active}
            />
          </TabsContent>

          {/* Raw Data Tab */}
          <TabsContent value="raw">
            <div className="space-y-4">
              <Card>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => setShowApifyJson(!showApifyJson)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle>Apify Raw Data</CardTitle>
                    {showApifyJson ? <ChevronUp /> : <ChevronDown />}
                  </div>
                  <CardDescription>
                    Original data from Google Places extraction
                  </CardDescription>
                </CardHeader>
                {showApifyJson && (
                  <CardContent>
                    <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-96">
                      {JSON.stringify(fitness.apify_output, null, 2)}
                    </pre>
                  </CardContent>
                )}
              </Card>

              <Card>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => setShowFirecrawlJson(!showFirecrawlJson)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle>Firecrawl Raw Data</CardTitle>
                    {showFirecrawlJson ? <ChevronUp /> : <ChevronDown />}
                  </div>
                  <CardDescription>
                    Website scraping data from Firecrawl
                  </CardDescription>
                </CardHeader>
                {showFirecrawlJson && (
                  <CardContent>
                    {fitness.firecrawl_output ? (
                      <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-96">
                        {JSON.stringify(fitness.firecrawl_output, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-gray-500 text-sm">No Firecrawl data available</p>
                    )}
                  </CardContent>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarInset>
  )
}
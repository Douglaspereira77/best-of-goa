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
  ExternalLink,
  MapPin,
  Star,
  Phone,
  Mail,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  GraduationCap,
  DollarSign,
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

interface SchoolData {
  id: string
  name: string
  nameAr: string | null
  slug: string
  description: string | null
  shortDescription: string | null
  address: string
  area: string
  governorate: string | null
  phone: string | null
  email: string | null
  website: string | null
  instagram: string | null
  facebook: string | null
  twitter: string | null
  tiktok: string | null
  youtube: string | null
  linkedin: string | null
  snapchat: string | null
  whatsapp: string | null
  schoolType: string | null
  curriculum: string[]
  gradeLevels: string[]
  minGrade: string | null
  maxGrade: string | null
  yearEstablished: number | null
  genderPolicy: string | null
  tuitionRangeMin: number | null
  tuitionRangeMax: number | null
  currency: string
  googleRating: number | null
  googleReviewCount: number | null
  parentRating: number | null
  metaTitle: string | null
  metaDescription: string | null
  metaKeywords: string[]
  heroImage: string | null
  logoImage: string | null
  extractionStatus: string
  verified: boolean
  featured: boolean
  active: boolean
  published: boolean
  createdAt: string
  updatedAt: string
}

export default function SchoolReviewPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [school, setSchool] = useState<SchoolData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [formData, setFormData] = useState<Partial<SchoolData>>({})
  const [images, setImages] = useState<ImageData[]>([])

  useEffect(() => {
    loadSchool()
    loadImages()
  }, [resolvedParams.id])

  const loadSchool = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/schools/${resolvedParams.id}/review`)
      const data = await response.json()

        if (!response.ok) {
        throw new Error(data.error || 'Failed to load school')
        }

        setSchool(data.school)
      setFormData(data.school)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load school')
      } finally {
        setLoading(false)
      }
    }

  const loadImages = async () => {
    try {
      const response = await fetch(`/api/admin/schools/${resolvedParams.id}/images`)
      const data = await response.json()
      if (response.ok) {
        const mappedImages = (data.images || []).map((img: any) => ({
          id: img.id,
          url: img.url,
          alt: img.alt_text,
          status: img.is_active ? 'approved' : 'pending',
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

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSaveSuccess(false)

      const response = await fetch(`/api/admin/schools/${resolvedParams.id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save')
      }

      setSchool(data.school)
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

      const response = await fetch(`/api/admin/schools/${resolvedParams.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish')
      }

      setSchool((prev) => (prev ? { ...prev, active: true, published: true, verified: true } : null))
      setSaveSuccess(true)

      // Redirect to published page after 1.5s delay
      setTimeout(() => {
        if (school?.slug) {
          router.push(`/places-to-learn/schools/${school.slug}`)
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
    if (!school) return

    if (!confirm('Are you sure you want to delete this school? This action cannot be undone.')) {
      return
    }

    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/admin/schools/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId: resolvedParams.id })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete school')
      }

      // Redirect to schools list
      router.push('/admin/schools')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete school')
      setSaving(false)
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <SidebarInset>
        <AdminPageHeader
          title="Loading..."
          breadcrumbs={[
            { label: 'Schools', href: '/admin/schools' },
            { label: 'Review' }
          ]}
        />
        <div className="p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Loading school data...</p>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    )
  }

  if (!school) {
    return (
      <SidebarInset>
        <AdminPageHeader
          title="School Not Found"
          breadcrumbs={[
            { label: 'Schools', href: '/admin/schools' },
            { label: 'Review' }
          ]}
        />
        <div className="p-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">{error || 'School not found'}</p>
              <Button
                onClick={() => router.push('/admin/schools')}
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
        title={school.name}
        description={`Review and edit school details`}
        breadcrumbs={[
          { label: 'Schools', href: '/admin/schools' },
          { label: school.name }
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
                    school.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }
                >
                  {school.active ? 'Published' : 'Draft'}
                </Badge>
                <span className="text-sm text-gray-500">
                  Extraction: {school.extractionStatus}
                </span>
                {school.featured && (
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
                {!school.active && (
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
            <TabsTrigger value="academic">Academic</TabsTrigger>
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
                    <Label>Governorate</Label>
                    <Input
                      value={formData.governorate || ''}
                      onChange={(e) => updateField('governorate', e.target.value)}
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

          {/* Academic Tab */}
          <TabsContent value="academic">
            <Card>
              <CardHeader>
                <CardTitle>Academic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>School Type</Label>
                    <Input
                      value={formData.schoolType || ''}
                      onChange={(e) => updateField('schoolType', e.target.value)}
                      placeholder="e.g., international, private, public"
                    />
                  </div>
                  <div>
                    <Label>Gender Policy</Label>
                    <Input
                      value={formData.genderPolicy || ''}
                      onChange={(e) => updateField('genderPolicy', e.target.value)}
                      placeholder="e.g., coeducational, boys_only, girls_only"
                    />
                  </div>
                </div>

                <div>
                  <Label>Curriculum (comma-separated)</Label>
                  <Input
                    value={(formData.curriculum || []).join(', ')}
                    onChange={(e) =>
                      updateField(
                        'curriculum',
                        e.target.value.split(',').map((c) => c.trim()).filter(Boolean)
                      )
                    }
                    placeholder="e.g., british, american, ib"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate multiple curricula with commas
                  </p>
                </div>

                <div>
                  <Label>Grade Levels (comma-separated)</Label>
                  <Input
                    value={(formData.gradeLevels || []).join(', ')}
                    onChange={(e) =>
                      updateField(
                        'gradeLevels',
                        e.target.value.split(',').map((g) => g.trim()).filter(Boolean)
                      )
                    }
                    placeholder="e.g., kindergarten, elementary, middle, high"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Min Grade</Label>
                    <Input
                      value={formData.minGrade || ''}
                      onChange={(e) => updateField('minGrade', e.target.value)}
                      placeholder="e.g., kg1, grade1"
                    />
              </div>
              <div>
                    <Label>Max Grade</Label>
                    <Input
                      value={formData.maxGrade || ''}
                      onChange={(e) => updateField('maxGrade', e.target.value)}
                      placeholder="e.g., grade12"
                    />
                  </div>
                </div>

                <div>
                  <Label>Year Established</Label>
                  <Input
                    type="number"
                    value={formData.yearEstablished || ''}
                    onChange={(e) => updateField('yearEstablished', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="e.g., 1995"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Tuition Min (KWD)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.tuitionRangeMin || ''}
                      onChange={(e) => updateField('tuitionRangeMin', e.target.value ? parseFloat(e.target.value) : null)}
                    />
              </div>
              <div>
                    <Label>Tuition Max (KWD)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.tuitionRangeMax || ''}
                      onChange={(e) => updateField('tuitionRangeMax', e.target.value ? parseFloat(e.target.value) : null)}
                    />
              </div>
              <div>
                    <Label>Currency</Label>
                    <Input
                      value={formData.currency || 'KWD'}
                      onChange={(e) => updateField('currency', e.target.value)}
                    />
                  </div>
                </div>
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

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>TikTok</Label>
                    <Input
                      value={formData.tiktok || ''}
                      onChange={(e) => updateField('tiktok', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>YouTube</Label>
                    <Input
                      value={formData.youtube || ''}
                      onChange={(e) => updateField('youtube', e.target.value)}
                    />
                  </div>
              <div>
                    <Label>LinkedIn</Label>
                    <Input
                      value={formData.linkedin || ''}
                      onChange={(e) => updateField('linkedin', e.target.value)}
                    />
                  </div>
              </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Snapchat</Label>
                    <Input
                      value={formData.snapchat || ''}
                      onChange={(e) => updateField('snapchat', e.target.value)}
                    />
                  </div>
              <div>
                    <Label>WhatsApp</Label>
                    <Input
                      value={formData.whatsapp || ''}
                      onChange={(e) => updateField('whatsapp', e.target.value)}
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
                        e.target.value.split(',').map((k) => k.trim()).filter(Boolean)
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
              onSetHero={handleSetHero}
              loading={loading}
              entityId={resolvedParams.id}
              entityType="schools"
              persistToApi={true}
            />
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            <PreviewPanel
              slug={school.slug}
              basePath="/places-to-learn/schools"
              entityName={school.name}
              isActive={school.active}
            />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarInset>
  )
}

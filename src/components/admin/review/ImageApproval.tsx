'use client'

import { useState, useRef } from 'react'
import { SectionCard } from '../layout/SectionCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, X, Eye, Trash2, Upload, Star, Loader2 } from 'lucide-react'

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

interface ImageApprovalProps {
  images: ImageData[]
  onApprove: (imageId: string) => void
  onReject: (imageId: string) => void
  onDelete: (imageId: string) => void
  onView: (imageId: string) => void
  onSetHero?: (imageId: string) => void
  onUpload?: (file: File, altText: string) => Promise<void>
  loading?: boolean
  className?: string
  /** Entity ID for API calls (e.g., attraction ID) */
  entityId?: string
  /** Entity type for API routes */
  entityType?: 'attractions' | 'schools' | 'hotels' | 'malls' | 'fitness' | 'restaurants'
  /** Enable API persistence (approve/reject/delete/upload call API) */
  persistToApi?: boolean
}

export function ImageApproval({
  images,
  onApprove,
  onReject,
  onDelete,
  onView,
  onSetHero,
  onUpload,
  loading = false,
  className = '',
  entityId,
  entityType,
  persistToApi = false
}: ImageApprovalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set())
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [uploadAltText, setUploadAltText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageError = (imageId: string) => {
    console.error(`Failed to load image: ${imageId}`)
    setImageErrors(prev => new Set(prev).add(imageId))
    setLoadingImages(prev => {
      const newSet = new Set(prev)
      newSet.delete(imageId)
      return newSet
    })
  }

  const handleImageLoad = (imageId: string) => {
    setImageErrors(prev => {
      const newSet = new Set(prev)
      newSet.delete(imageId)
      return newSet
    })
    setLoadingImages(prev => {
      const newSet = new Set(prev)
      newSet.delete(imageId)
      return newSet
    })
  }

  const handleImageStartLoad = (imageId: string) => {
    setLoadingImages(prev => new Set(prev).add(imageId))
  }

  // API-persisted actions
  const handleApiAction = async (imageId: string, action: 'approve' | 'reject' | 'set_hero' | 'delete', imageUrl?: string) => {
    if (!persistToApi || !entityId || !entityType) {
      // Fallback to local-only handlers
      if (action === 'approve') onApprove(imageId)
      else if (action === 'reject') onReject(imageId)
      else if (action === 'set_hero' && onSetHero) onSetHero(imageId)
      else if (action === 'delete') onDelete(imageId)
      return
    }

    setActionLoading(imageId)
    try {
      if (action === 'delete') {
        // Include imageUrl for fallback images (photos column)
        const params = new URLSearchParams({ imageId })
        if (imageUrl) params.append('imageUrl', imageUrl)

        const response = await fetch(`/api/admin/${entityType}/${entityId}/images?${params.toString()}`, {
          method: 'DELETE'
        })
        if (!response.ok) throw new Error('Failed to delete image')
        onDelete(imageId)
      } else {
        const response = await fetch(`/api/admin/${entityType}/${entityId}/images`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageId, action, imageUrl })
        })
        if (!response.ok) throw new Error(`Failed to ${action} image`)

        if (action === 'approve') onApprove(imageId)
        else if (action === 'reject') onReject(imageId)
        else if (action === 'set_hero' && onSetHero) onSetHero(imageId)
      }
    } catch (error) {
      console.error(`Failed to ${action} image:`, error)
      alert(`Failed to ${action} image. Please try again.`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (!persistToApi || !entityId || !entityType) {
      // Legacy single-file handler for non-API mode
      if (onUpload && files[0]) {
        await onUpload(files[0], uploadAltText)
      }
      return
    }

    setUploading(true)
    setUploadProgress({ current: 0, total: files.length })

    const failedUploads: string[] = []

    const isMultiUpload = files.length >= 3

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress({ current: i + 1, total: files.length })

        try {
          const formData = new FormData()
          formData.append('file', file)
          // Only add alt text to first image, or leave empty for others
          formData.append('altText', i === 0 ? uploadAltText : '')
          // Pass multi-upload context for hybrid AI analysis
          formData.append('isMultiUpload', isMultiUpload.toString())
          formData.append('totalFiles', files.length.toString())

          const response = await fetch(`/api/admin/${entityType}/${entityId}/images`, {
            method: 'POST',
            body: formData
          })

          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || 'Failed to upload')
          }
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error)
          failedUploads.push(file.name)
        }
      }

      // Show results
      if (failedUploads.length > 0) {
        alert(`Uploaded ${files.length - failedUploads.length} of ${files.length} images.\n\nFailed: ${failedUploads.join(', ')}`)
      }

      // Reload the page to show new images
      window.location.reload()
    } catch (error) {
      console.error('Failed to upload images:', error)
      alert('Failed to upload images. Please try again.')
    } finally {
      setUploading(false)
      setUploadProgress(null)
      setUploadAltText('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
    }
  }

  const getQualityColor = (quality?: number) => {
    if (!quality) return 'text-gray-500'
    if (quality >= 80) return 'text-green-600'
    if (quality >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <SectionCard
        title="Image Gallery"
        icon="🖼️"
        defaultCollapsed={false}
      >
        {/* Upload Section */}
        {(persistToApi && entityId && entityType) && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alt Text (optional)
                </label>
                <Input
                  value={uploadAltText}
                  onChange={(e) => setUploadAltText(e.target.value)}
                  placeholder="Describe the image..."
                  className="w-full"
                />
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="whitespace-nowrap"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {uploadProgress
                        ? uploadProgress.total < 3
                          ? `Analyzing & Uploading ${uploadProgress.current}/${uploadProgress.total}...`
                          : `Uploading ${uploadProgress.current}/${uploadProgress.total}...`
                        : 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Images
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : images.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className={`relative aspect-square bg-gray-100 rounded border-2 overflow-hidden group ${
                  image.isHero ? 'border-yellow-400 ring-2 ring-yellow-200' : 'border-gray-200'
                }`}
              >
                {imageErrors.has(image.id) ? (
                  <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-600">
                    <div className="text-center">
                      <div className="text-sm font-medium">Failed to load</div>
                      <div className="text-xs mt-1">{image.url.substring(0, 30)}...</div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={image.url}
                    alt={image.alt || `Image ${image.id}`}
                    className="w-full h-full object-cover"
                    onLoadStart={() => handleImageStartLoad(image.id)}
                    onError={() => handleImageError(image.id)}
                    onLoad={() => handleImageLoad(image.id)}
                  />
                )}

                {/* Loading overlay */}
                {actionLoading === image.id && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}

                {/* Hover Overlay with Actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 flex flex-wrap justify-center gap-2 p-2">
                    <button
                      onClick={() => onView(image.id)}
                      className="h-8 w-8 p-0 rounded bg-white/90 hover:bg-white flex items-center justify-center"
                      title="View"
                    >
                      <Eye className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      onClick={() => handleApiAction(image.id, 'approve', image.url)}
                      className="h-8 w-8 p-0 rounded bg-green-500 hover:bg-green-600 flex items-center justify-center"
                      title="Approve"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => handleApiAction(image.id, 'reject', image.url)}
                      className="h-8 w-8 p-0 rounded bg-red-500 hover:bg-red-600 flex items-center justify-center"
                      title="Reject"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                    {(onSetHero || persistToApi) && !image.isHero && (
                      <button
                        onClick={() => handleApiAction(image.id, 'set_hero', image.url)}
                        className="h-8 w-8 p-0 rounded bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center"
                        title="Set as Hero"
                      >
                        <Star className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {image.isHero && (
                    <Badge className="bg-yellow-500 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Hero
                    </Badge>
                  )}
                  {getStatusBadge(image.status)}
                  {image.quality && (
                    <Badge className="bg-blue-100 text-blue-800">
                      {image.quality}%
                    </Badge>
                  )}
                </div>

                {/* Delete Button */}
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this image?')) {
                        handleApiAction(image.id, 'delete', image.url)
                      }
                    }}
                    className="h-6 w-6 p-0 rounded bg-red-500 hover:bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">No images available</p>
            {(persistToApi && entityId && entityType) && (
              <p className="text-sm">Use the upload section above to add images</p>
            )}
          </div>
        )}
      </SectionCard>

      {/* Image Details */}
      {selectedImage && (
        <SectionCard
          title="Image Details"
          icon="🔍"
          defaultCollapsed={false}
        >
          <div className="space-y-4">
            {(() => {
              const image = images.find(img => img.id === selectedImage)
              if (!image) return null

              return (
                <>
                  <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.alt || `Image ${image.id}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      {getStatusBadge(image.status)}
                    </div>

                    {image.quality && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Quality Score</span>
                        <span className={`text-sm font-medium ${getQualityColor(image.quality)}`}>
                          {image.quality}%
                        </span>
                      </div>
                    )}

                    {image.tags && image.tags.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-600">Tags</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {image.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )
            })()}
          </div>
        </SectionCard>
      )}
    </div>
  )
}

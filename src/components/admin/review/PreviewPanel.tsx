'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ExternalLink,
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw,
  Maximize2,
  X
} from 'lucide-react'

type ViewportSize = 'desktop' | 'tablet' | 'mobile'

interface PreviewPanelProps {
  /** The slug for the public page */
  slug: string
  /** The base path for the public page (e.g., /places-to-visit/attractions) */
  basePath: string
  /** Entity name for display */
  entityName: string
  /** Whether the entity is published/active */
  isActive: boolean
  /** Optional className */
  className?: string
}

const viewportSizes: Record<ViewportSize, { width: string; height: string; label: string }> = {
  desktop: { width: '100%', height: '800px', label: 'Desktop' },
  tablet: { width: '768px', height: '1024px', label: 'Tablet' },
  mobile: { width: '375px', height: '667px', label: 'Mobile' }
}

export function PreviewPanel({
  slug,
  basePath,
  entityName,
  isActive,
  className = ''
}: PreviewPanelProps) {
  const [viewport, setViewport] = useState<ViewportSize>('desktop')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)

  // Construct the preview URL with a special query param to bypass active check
  const previewUrl = `${basePath}/${slug}?preview=true`
  const publicUrl = `${basePath}/${slug}`

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1)
  }

  const handleOpenExternal = () => {
    window.open(publicUrl, '_blank')
  }

  const currentSize = viewportSizes[viewport]

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg w-full h-full max-w-7xl max-h-[95vh] flex flex-col">
          {/* Fullscreen Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <h3 className="font-semibold">Preview: {entityName}</h3>
              {!isActive && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  Draft - Not Published
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Viewport Toggles */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewport === 'desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewport('desktop')}
                  className="h-8 w-8 p-0"
                >
                  <Monitor className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewport === 'tablet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewport('tablet')}
                  className="h-8 w-8 p-0"
                >
                  <Tablet className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewport === 'mobile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewport('mobile')}
                  className="h-8 w-8 p-0"
                >
                  <Smartphone className="w-4 h-4" />
                </Button>
              </div>

              <Button variant="ghost" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4" />
              </Button>

              <Button variant="ghost" size="sm" onClick={handleOpenExternal}>
                <ExternalLink className="w-4 h-4" />
              </Button>

              <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Fullscreen Preview */}
          <div className="flex-1 bg-gray-100 p-4 overflow-auto flex justify-center">
            <div
              className="bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-300"
              style={{
                width: currentSize.width,
                maxWidth: '100%'
              }}
            >
              <iframe
                key={iframeKey}
                src={previewUrl}
                className="w-full border-0"
                style={{ height: 'calc(95vh - 120px)' }}
                title={`Preview of ${entityName}`}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Preview
            {!isActive && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                Draft
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Viewport Toggles */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewport === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewport('desktop')}
                className="h-7 w-7 p-0"
                title="Desktop view"
              >
                <Monitor className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant={viewport === 'tablet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewport('tablet')}
                className="h-7 w-7 p-0"
                title="Tablet view"
              >
                <Tablet className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant={viewport === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewport('mobile')}
                className="h-7 w-7 p-0"
                title="Mobile view"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </Button>
            </div>

            <Button variant="ghost" size="sm" onClick={handleRefresh} title="Refresh preview">
              <RefreshCw className="w-4 h-4" />
            </Button>

            <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(true)} title="Fullscreen">
              <Maximize2 className="w-4 h-4" />
            </Button>

            {isActive && (
              <Button variant="ghost" size="sm" onClick={handleOpenExternal} title="Open in new tab">
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 rounded-lg p-4 overflow-auto">
          <div
            className="bg-white shadow-lg rounded-lg overflow-hidden mx-auto transition-all duration-300"
            style={{
              width: viewport === 'desktop' ? '100%' : currentSize.width,
              maxWidth: '100%'
            }}
          >
            <iframe
              key={iframeKey}
              src={previewUrl}
              className="w-full border-0"
              style={{ height: currentSize.height }}
              title={`Preview of ${entityName}`}
            />
          </div>
        </div>

        {!isActive && (
          <p className="text-sm text-gray-500 mt-3 text-center">
            This is a preview. The page will be publicly visible after publishing.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, XCircle, AlertTriangle, Eye, ExternalLink } from 'lucide-react'

interface RestaurantReviewData {
  id: string
  name: string
  slug: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  verified: boolean
  active: boolean
  quality_score: number
  quality_breakdown: {
    critical: { completed: number; total: number }
    important: { completed: number; total: number }
    optional: { completed: number; total: number }
  }
  address?: string
  area?: string
  phone?: string
  description?: string
  images?: Array<{ approved: boolean; is_hero: boolean }>
  menu_sections?: Array<{ dishes: Array<{ price?: number }> }>
}

interface PublishTabProps {
  restaurant: RestaurantReviewData
  onPublish: () => void
  saving: boolean
}

export function PublishTab({ restaurant, onPublish, saving }: PublishTabProps) {
  const qualityScore = restaurant.quality_score
  const canPublish = restaurant.status === 'completed' && qualityScore >= 50 && !restaurant.verified

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 50) return 'text-orange-600'
    return 'text-red-600'
  }

  const getQualityStatus = (score: number) => {
    if (score >= 90) return { text: 'Excellent', color: 'bg-green-100 text-green-800' }
    if (score >= 70) return { text: 'Good', color: 'bg-yellow-100 text-yellow-800' }
    if (score >= 50) return { text: 'Fair', color: 'bg-orange-100 text-orange-800' }
    return { text: 'Poor', color: 'bg-red-100 text-red-800' }
  }

  const qualityStatus = getQualityStatus(qualityScore)

  const criticalFields = [
    { field: 'Restaurant Name', value: restaurant.name, required: true },
    { field: 'Address', value: restaurant.address, required: true },
    { field: 'Area', value: restaurant.area, required: true },
    { field: 'Description', value: restaurant.description, required: true },
  ]

  const importantFields = [
    { field: 'Phone Number', value: restaurant.phone, required: false },
    { field: 'Hero Image', value: restaurant.images?.some(img => img.is_hero), required: false },
    { field: 'Approved Images', value: restaurant.images?.filter(img => img.approved).length || 0, required: false, min: 1 },
    { field: 'Menu Items', value: restaurant.menu_sections?.reduce((total, section) => total + section.dishes.length, 0) || 0, required: false, min: 5 },
  ]

  const optionalFields = [
    { field: 'Website', value: restaurant.website, required: false },
    { field: 'Operating Hours', value: restaurant.hours, required: false },
    { field: 'Cuisine Tags', value: restaurant.cuisines?.length || 0, required: false },
    { field: 'Feature Tags', value: restaurant.features?.length || 0, required: false },
  ]

  const renderFieldCheck = (field: any) => {
    const hasValue = field.value !== undefined && field.value !== null && field.value !== ''
    const meetsMin = !field.min || (typeof field.value === 'number' ? field.value >= field.min : true)
    const isValid = hasValue && meetsMin

    return (
      <div className="flex items-center gap-2">
        {isValid ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-red-600" />
        )}
        <span className="text-sm">{field.field}</span>
        {field.required && (
          <Badge variant="destructive" className="text-xs">Required</Badge>
        )}
        {field.min && (
          <span className="text-xs text-gray-500">(min {field.min})</span>
        )}
      </div>
    )
  }

  const getPublishStatus = () => {
    if (restaurant.verified && restaurant.active) {
      return {
        text: 'Published',
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="h-4 w-4" />
      }
    }
    if (restaurant.verified && !restaurant.active) {
      return {
        text: 'Verified (Draft)',
        color: 'bg-blue-100 text-blue-800',
        icon: <CheckCircle className="h-4 w-4" />
      }
    }
    if (restaurant.status === 'processing') {
      return {
        text: 'Processing',
        color: 'bg-yellow-100 text-yellow-800',
        icon: <AlertTriangle className="h-4 w-4" />
      }
    }
    if (restaurant.status === 'failed') {
      return {
        text: 'Failed',
        color: 'bg-red-100 text-red-800',
        icon: <XCircle className="h-4 w-4" />
      }
    }
    return {
      text: 'Ready for Review',
      color: 'bg-gray-100 text-gray-800',
      icon: <AlertTriangle className="h-4 w-4" />
    }
  }

  const publishStatus = getPublishStatus()

  return (
    <div className="space-y-6">
      {/* Publish Status */}
      <Card>
        <CardHeader>
          <CardTitle>Publish Status</CardTitle>
          <CardDescription>
            Current status and publishing options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className={publishStatus.color}>
                {publishStatus.icon}
                <span className="ml-1">{publishStatus.text}</span>
              </Badge>
              {restaurant.active && (
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Live Page
                </Button>
              )}
            </div>
            
            {canPublish && (
              <Button
                onClick={onPublish}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {saving ? 'Publishing...' : 'Publish Restaurant'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quality Score */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Score</CardTitle>
          <CardDescription>
            Overall data completeness and quality assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`text-3xl font-bold ${getQualityColor(qualityScore)}`}>
                  {qualityScore}%
                </div>
                <div>
                  <Badge className={qualityStatus.color}>
                    {qualityStatus.text}
                  </Badge>
                  <div className="text-sm text-gray-600 mt-1">
                    {qualityScore >= 50 ? 'Ready to publish' : 'Needs improvement'}
                  </div>
                </div>
              </div>
            </div>
            
            <Progress value={qualityScore} className="h-3" />
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-blue-600">
                  {restaurant.quality_breakdown.critical.completed}/{restaurant.quality_breakdown.critical.total}
                </div>
                <div className="text-xs text-gray-600">Critical</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-yellow-600">
                  {restaurant.quality_breakdown.important.completed}/{restaurant.quality_breakdown.important.total}
                </div>
                <div className="text-xs text-gray-600">Important</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-600">
                  {restaurant.quality_breakdown.optional.completed}/{restaurant.quality_breakdown.optional.total}
                </div>
                <div className="text-xs text-gray-600">Optional</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Field Validation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Critical Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Critical Fields</CardTitle>
            <CardDescription className="text-xs">
              Must be completed to publish
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {criticalFields.map((field, index) => (
              <div key={index}>
                {renderFieldCheck(field)}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Important Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Important Fields</CardTitle>
            <CardDescription className="text-xs">
              Recommended for better quality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {importantFields.map((field, index) => (
              <div key={index}>
                {renderFieldCheck(field)}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Optional Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Optional Fields</CardTitle>
            <CardDescription className="text-xs">
              Nice to have for completeness
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {optionalFields.map((field, index) => (
              <div key={index}>
                {renderFieldCheck(field)}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Publishing Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Pre-Publish Checklist</CardTitle>
          <CardDescription>
            Final checks before making the restaurant live
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">All critical fields completed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Quality score above 50%</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">At least one approved image</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Hero image selected</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Menu items added (if applicable)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">SEO content generated</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Publishing Actions */}
      {canPublish && (
        <Card>
          <CardHeader>
            <CardTitle>Ready to Publish</CardTitle>
            <CardDescription>
              This restaurant meets all requirements and is ready to go live
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">All Requirements Met</h4>
                    <p className="text-sm text-green-700 mt-1">
                      This restaurant has passed all quality checks and is ready to be published to the live site.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={onPublish}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {saving ? 'Publishing...' : 'Publish Now'}
                </Button>
                
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Page
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Publishing Blocked */}
      {!canPublish && qualityScore < 50 && (
        <Card>
          <CardHeader>
            <CardTitle>Publishing Blocked</CardTitle>
            <CardDescription>
              This restaurant needs improvements before it can be published
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900">Quality Score Too Low</h4>
                  <p className="text-sm text-red-700 mt-1">
                    The quality score is {qualityScore}%, which is below the minimum required 50%. 
                    Please complete more fields to improve the quality score.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


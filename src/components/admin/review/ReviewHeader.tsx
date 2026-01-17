'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Save, Eye, AlertCircle, CheckCircle, Clock } from 'lucide-react'

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
}

interface ReviewHeaderProps {
  restaurant: RestaurantReviewData
  onSave: () => void
  onPublish: () => void
  saving: boolean
}

export function ReviewHeader({ restaurant, onSave, onPublish, saving }: ReviewHeaderProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'processing':
        return <Clock className="h-4 w-4 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'failed':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1">
          {getStatusIcon(status)}
          Pending Review
        </Badge>
      case 'processing':
        return <Badge variant="default" className="flex items-center gap-1">
          {getStatusIcon(status)}
          Processing
        </Badge>
      case 'completed':
        return <Badge variant="outline" className="flex items-center gap-1">
          {getStatusIcon(status)}
          Ready for Review
        </Badge>
      case 'failed':
        return <Badge variant="destructive" className="flex items-center gap-1">
          {getStatusIcon(status)}
          Failed
        </Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 50) return 'text-orange-600'
    return 'text-red-600'
  }

  const canPublish = restaurant.status === 'completed' && 
                    restaurant.quality_score >= 50 && 
                    !restaurant.verified

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-xl">{restaurant.name}</CardTitle>
            <CardDescription>
              Restaurant ID: {restaurant.id} • Slug: {restaurant.slug}
            </CardDescription>
            <div className="flex items-center gap-2">
              {getStatusBadge(restaurant.status)}
              {restaurant.verified && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </Badge>
              )}
              {restaurant.active && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Published
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onSave}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            
            {canPublish && (
              <Button
                onClick={onPublish}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {saving ? 'Publishing...' : 'Publish'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quality Score */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Quality Score</h4>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${getQualityColor(restaurant.quality_score)}`}>
                {restaurant.quality_score}%
              </span>
              <div className="text-xs text-gray-500">
                {restaurant.quality_score >= 50 ? 'Publishable' : 'Needs Work'}
              </div>
            </div>
          </div>

          {/* Quality Breakdown */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Completeness</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Critical Fields:</span>
                <span className="font-medium">
                  {restaurant.quality_breakdown.critical.completed}/{restaurant.quality_breakdown.critical.total}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Important Fields:</span>
                <span className="font-medium">
                  {restaurant.quality_breakdown.important.completed}/{restaurant.quality_breakdown.important.total}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Optional Fields:</span>
                <span className="font-medium">
                  {restaurant.quality_breakdown.optional.completed}/{restaurant.quality_breakdown.optional.total}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Quick Actions</h4>
            <div className="space-y-1">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Eye className="h-3 w-3 mr-2" />
                Preview Public Page
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <AlertCircle className="h-3 w-3 mr-2" />
                View Error Logs
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


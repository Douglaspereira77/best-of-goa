'use client'

import { SectionCard } from '../layout/SectionCard'
import { StatusBadge } from '../ui/StatusBadge'
import { ActionButton } from '../ui/ActionButton'
import { Progress } from '@/components/ui/progress'
import { RatingBreakdown } from './RatingBreakdown'
import { HotelRatingBreakdown } from './HotelRatingBreakdown'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface ReviewSidebarProps {
  restaurant: {
    id: string
    name: string
    thumbnail?: string
    status: 'draft' | 'published' | 'pending'
    qualityScore: number
    overall_rating?: number
    rating_breakdown?: {
      // Restaurant rating fields
      food_quality?: number
      service?: number
      ambience?: number
      value_for_money?: number
      accessibility_amenities?: number
      // Hotel rating fields
      room_quality?: number
      cleanliness?: number
      location?: number
      amenities?: number
      // Common fields
      calculated_at?: string
      algorithm_version?: string
    }
    total_reviews_aggregated?: number
    rating_description?: string
    rating_color?: string
    reviewCount?: number
    requiredFields: Array<{
      field: string
      completed: boolean
      required: boolean
    }>
    google_place_id?: string
    entityType?: 'restaurant' | 'hotel'
  }
  onSaveDraft: () => void
  onPublish: () => void
  onDelete: () => void
  onReRunExtraction?: () => void
  isSaving?: boolean
  isPublishing?: boolean
  isReRunningExtraction?: boolean
  extractionProgress?: {
    isRunning: boolean
    currentStep?: string
    progress?: number
  }
  className?: string
}

export function ReviewSidebar({ 
  restaurant, 
  onSaveDraft, 
  onPublish, 
  onDelete, 
  onReRunExtraction,
  isSaving = false,
  isPublishing = false,
  isReRunningExtraction = false,
  extractionProgress,
  className = '' 
}: ReviewSidebarProps) {
  const completedFields = restaurant.requiredFields.filter(f => f.completed).length
  const totalFields = restaurant.requiredFields.length
  const completionPercentage = totalFields > 0 ? (completedFields / totalFields) * 100 : 0

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Restaurant Info */}
      <SectionCard
        title="Restaurant Info"
        icon="🍽️"
        defaultCollapsed={false}
      >
        <div className="space-y-4">
          {restaurant.thumbnail && (
            <div className="aspect-video bg-gray-100 rounded overflow-hidden">
              <img
                src={restaurant.thumbnail}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div>
            <h3 className="font-semibold text-gray-900">{restaurant.name}</h3>
            <p className="text-sm text-gray-600">ID: {restaurant.id}</p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Status:</span>
            <StatusBadge status={restaurant.status} />
          </div>
        </div>
      </SectionCard>

      {/* Quality Score */}
      <SectionCard
        title="Quality Score"
        icon="⭐"
        defaultCollapsed={false}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Overall Score</span>
            <span className="text-lg font-semibold text-gray-900">
              {restaurant.qualityScore}%
            </span>
          </div>

          <Progress value={restaurant.qualityScore} className="h-2" />

          <div className="text-xs text-gray-500">
            {restaurant.qualityScore >= 80 ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                Ready to publish
              </div>
            ) : restaurant.qualityScore >= 60 ? (
              <div className="flex items-center text-yellow-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                Needs improvement
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <XCircle className="w-4 h-4 mr-1" />
                Requires attention
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Reviews Linked */}
      <SectionCard
        title="Reviews Linked"
        icon="💬"
        defaultCollapsed={false}
      >
        <div className="space-y-3">
          {restaurant.reviewCount ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Google Reviews</span>
                <span className="text-lg font-semibold text-gray-900">
                  {restaurant.reviewCount}
                </span>
              </div>

              <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-900">Reviews Linked</p>
                  <p className="text-xs text-green-700">All reviews in database and indexed for LLM</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center p-3 bg-gray-100 rounded-lg border border-gray-200">
              <AlertCircle className="w-5 h-5 text-gray-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">No Reviews Yet</p>
                <p className="text-xs text-gray-700">Run extraction to fetch reviews</p>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Required Fields Checklist */}
      <SectionCard
        title="Required Fields"
        icon="📋"
        defaultCollapsed={false}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Completion</span>
            <span className="font-medium">
              {completedFields}/{totalFields}
            </span>
          </div>
          
          <Progress value={completionPercentage} className="h-2" />
          
          <div className="space-y-2">
            {restaurant.requiredFields.map((field, index) => (
              <div key={index} className="flex items-center space-x-2">
                {field.completed ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm ${field.completed ? 'text-gray-900' : 'text-gray-600'}`}>
                  {field.field}
                </span>
                {field.required && (
                  <span className="text-xs text-red-500">*</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Advanced Rating Breakdown */}
      {restaurant.overall_rating && restaurant.rating_breakdown && (
        restaurant.entityType === 'hotel' ? (
          <HotelRatingBreakdown
            overallRating={restaurant.overall_rating}
            ratingBreakdown={restaurant.rating_breakdown}
            totalReviews={restaurant.total_reviews_aggregated || 0}
            ratingDescription={restaurant.rating_description || 'Unknown'}
            ratingColor={restaurant.rating_color || 'text-gray-600'}
          />
        ) : (
          <RatingBreakdown
            overallRating={restaurant.overall_rating}
            ratingBreakdown={restaurant.rating_breakdown}
            totalReviews={restaurant.total_reviews_aggregated || 0}
            ratingDescription={restaurant.rating_description || 'Unknown'}
            ratingColor={restaurant.rating_color || 'text-gray-600'}
          />
        )
      )}

      {/* Extraction Progress */}
      {extractionProgress?.isRunning && (
        <SectionCard
          title="Re-extraction Progress"
          icon="🔄"
          defaultCollapsed={false}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Current Step</span>
              <span className="font-medium text-blue-600">
                {extractionProgress.currentStep || 'Processing...'}
              </span>
            </div>
            
            <Progress value={extractionProgress.progress || 0} className="h-2" />
            
            <div className="text-xs text-gray-500">
              <div className="flex items-center text-blue-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                Re-extracting data...
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Actions */}
      <SectionCard
        title="Actions"
        icon="⚡"
        defaultCollapsed={false}
      >
        <div className="space-y-3">
          {/* Re-run Extraction - only show if incomplete data */}
          {restaurant.qualityScore < 80 && restaurant.google_place_id && onReRunExtraction && (
            <ActionButton
              onClick={onReRunExtraction}
              disabled={isReRunningExtraction}
              loading={isReRunningExtraction}
              variant="outline"
              className="w-full"
            >
              🔄 Re-run Extraction
            </ActionButton>
          )}
          
          <ActionButton
            onClick={onSaveDraft}
            disabled={isSaving}
            loading={isSaving}
            variant="secondary"
            className="w-full"
          >
            Save Draft
          </ActionButton>
          
          <ActionButton
            onClick={onPublish}
            disabled={isPublishing || restaurant.qualityScore < 80}
            loading={isPublishing}
            variant="primary"
            className="w-full"
          >
            Publish {restaurant.entityType === 'hotel' ? 'Hotel' : 'Restaurant'}
          </ActionButton>

          <ActionButton
            onClick={onDelete}
            variant="destructive"
            className="w-full"
          >
            Delete {restaurant.entityType === 'hotel' ? 'Hotel' : 'Restaurant'}
          </ActionButton>
        </div>
      </SectionCard>
    </div>
  )
}

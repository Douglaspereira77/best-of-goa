'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Star, TrendingUp, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react'

interface RestaurantReviewData {
  id: string
  name: string
  google_rating?: number
  google_review_count?: number
  tripadvisor_rating?: number
  tripadvisor_review_count?: number
  review_sentiment?: string
  overall_rating?: number
  rating_breakdown?: {
    food: number
    service: number
    ambiance: number
    value: number
  }
}

interface ReviewsTabProps {
  restaurant: RestaurantReviewData
}

export function ReviewsTab({ restaurant }: ReviewsTabProps) {
  const renderRatingStars = (rating: number, maxRating: number = 5) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: maxRating }, (_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(rating)
                ? 'text-yellow-400 fill-current'
                : i < rating
                ? 'text-yellow-400 fill-current opacity-50'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    )
  }

  const renderRatingBreakdown = () => {
    if (!restaurant.rating_breakdown) return null

    const breakdown = restaurant.rating_breakdown
    const categories = [
      { key: 'food', label: 'Food Quality', value: breakdown.food },
      { key: 'service', label: 'Service', value: breakdown.service },
      { key: 'ambiance', label: 'Ambiance', value: breakdown.ambiance },
      { key: 'value', label: 'Value for Money', value: breakdown.value }
    ]

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Rating Breakdown</h4>
        {categories.map((category) => (
          <div key={category.key} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{category.label}</span>
              <span className="font-medium">{category.value.toFixed(1)}/10</span>
            </div>
            <Progress value={(category.value / 10) * 100} className="h-2" />
          </div>
        ))}
      </div>
    )
  }

  const getSentimentColor = (sentiment?: string) => {
    if (!sentiment) return 'text-gray-500'
    const lowerSentiment = sentiment.toLowerCase()
    if (lowerSentiment.includes('positive') || lowerSentiment.includes('excellent') || lowerSentiment.includes('great')) {
      return 'text-green-600'
    }
    if (lowerSentiment.includes('negative') || lowerSentiment.includes('poor') || lowerSentiment.includes('bad')) {
      return 'text-red-600'
    }
    return 'text-yellow-600'
  }

  const getSentimentIcon = (sentiment?: string) => {
    if (!sentiment) return <MessageSquare className="h-4 w-4" />
    const lowerSentiment = sentiment.toLowerCase()
    if (lowerSentiment.includes('positive') || lowerSentiment.includes('excellent') || lowerSentiment.includes('great')) {
      return <ThumbsUp className="h-4 w-4" />
    }
    if (lowerSentiment.includes('negative') || lowerSentiment.includes('poor') || lowerSentiment.includes('bad')) {
      return <ThumbsDown className="h-4 w-4" />
    }
    return <MessageSquare className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      {/* Overall Ratings */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Ratings</CardTitle>
          <CardDescription>
            Aggregated ratings from multiple sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Best Goa Rating */}
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {restaurant.overall_rating ? restaurant.overall_rating.toFixed(1) : 'N/A'}
              </div>
              <div className="text-sm text-gray-600 mb-2">Best Goa Rating</div>
              {restaurant.overall_rating && renderRatingStars(restaurant.overall_rating / 2, 5)}
            </div>

            {/* Google Rating */}
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {restaurant.google_rating ? restaurant.google_rating.toFixed(1) : 'N/A'}
              </div>
              <div className="text-sm text-gray-600 mb-2">Google Rating</div>
              {restaurant.google_rating && renderRatingStars(restaurant.google_rating, 5)}
              {restaurant.google_review_count && (
                <div className="text-xs text-gray-500 mt-1">
                  {restaurant.google_review_count.toLocaleString()} reviews
                </div>
              )}
            </div>

            {/* TripAdvisor Rating */}
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {restaurant.tripadvisor_rating ? restaurant.tripadvisor_rating.toFixed(1) : 'N/A'}
              </div>
              <div className="text-sm text-gray-600 mb-2">TripAdvisor Rating</div>
              {restaurant.tripadvisor_rating && renderRatingStars(restaurant.tripadvisor_rating, 5)}
              {restaurant.tripadvisor_review_count && (
                <div className="text-xs text-gray-500 mt-1">
                  {restaurant.tripadvisor_review_count.toLocaleString()} reviews
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rating Breakdown */}
      {restaurant.rating_breakdown && (
        <Card>
          <CardHeader>
            <CardTitle>Rating Breakdown</CardTitle>
            <CardDescription>
              Detailed ratings across different aspects
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderRatingBreakdown()}
          </CardContent>
        </Card>
      )}

      {/* Review Sentiment */}
      <Card>
        <CardHeader>
          <CardTitle>Review Sentiment Analysis</CardTitle>
          <CardDescription>
            AI-generated summary of customer feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          {restaurant.review_sentiment ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className={`mt-1 ${getSentimentColor(restaurant.review_sentiment)}`}>
                  {getSentimentIcon(restaurant.review_sentiment)}
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 leading-relaxed">
                    {restaurant.review_sentiment}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Sentiment Analysis</h3>
              <p className="text-gray-600">Review sentiment analysis will appear here once available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Review Sources</CardTitle>
          <CardDescription>
            Where reviews are collected from
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">G</span>
                </div>
                <div>
                  <div className="font-medium">Google Reviews</div>
                  <div className="text-sm text-gray-600">Google Maps</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {restaurant.google_rating ? `${restaurant.google_rating.toFixed(1)}/5` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">
                  {restaurant.google_review_count ? `${restaurant.google_review_count.toLocaleString()} reviews` : 'No reviews'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold text-sm">T</span>
                </div>
                <div>
                  <div className="font-medium">TripAdvisor</div>
                  <div className="text-sm text-gray-600">TripAdvisor.com</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {restaurant.tripadvisor_rating ? `${restaurant.tripadvisor_rating.toFixed(1)}/5` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">
                  {restaurant.tripadvisor_review_count ? `${restaurant.tripadvisor_review_count.toLocaleString()} reviews` : 'No reviews'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Review Insights</CardTitle>
          <CardDescription>
            Key insights from customer feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Positive Mentions</h4>
              <div className="space-y-2">
                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                  <TrendingUp className="h-3 w-3" />
                  Great Food
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                  <TrendingUp className="h-3 w-3" />
                  Excellent Service
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                  <TrendingUp className="h-3 w-3" />
                  Good Value
                </Badge>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Areas for Improvement</h4>
              <div className="space-y-2">
                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                  <TrendingUp className="h-3 w-3" />
                  Wait Times
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                  <TrendingUp className="h-3 w-3" />
                  Parking
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


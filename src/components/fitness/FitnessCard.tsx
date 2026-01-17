/**
 * Fitness Card Component for Category Pages
 *
 * Displays fitness place preview in grid layout for pages like:
 * - /things-to-do/fitness
 * - /things-to-do/fitness?type=yoga
 * - /things-to-do/fitness?area=salmiya
 */

import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, Dumbbell, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FavoriteButton } from '@/components/user/FavoriteButton'
import { AddToItineraryButton } from '@/components/user/AddToItineraryButton'

interface FitnessCardProps {
  fitnessPlace: {
    id: string
    slug: string
    name: string
    short_description?: string
    area: string
    hero_image?: string
    bok_score?: number
    total_reviews_aggregated?: number
    google_rating?: number
    google_review_count?: number
    fitness_types?: string[]
    gender_policy?: string
    amenities?: Record<string, any>
  }
}

const GENDER_BADGE_COLORS: Record<string, string> = {
  'women-only': 'bg-pink-100 text-pink-700 border-pink-200',
  'men-only': 'bg-blue-100 text-blue-700 border-blue-200',
  'co-ed': 'bg-green-100 text-green-700 border-green-200',
  'separate-hours': 'bg-purple-100 text-purple-700 border-purple-200'
}

const GENDER_LABELS: Record<string, string> = {
  'women-only': 'Women Only',
  'men-only': 'Men Only',
  'co-ed': 'Co-Ed',
  'separate-hours': 'Separate Hours'
}

export function FitnessCard({ fitnessPlace }: FitnessCardProps) {
  const {
    id,
    slug,
    name,
    short_description,
    area,
    hero_image,
    bok_score,
    total_reviews_aggregated,
    google_rating,
    google_review_count,
    fitness_types,
    gender_policy
  } = fitnessPlace

  const badgeColor = GENDER_BADGE_COLORS[gender_policy || 'co-ed'] || GENDER_BADGE_COLORS['co-ed']
  const badgeLabel = GENDER_LABELS[gender_policy || 'co-ed'] || 'Co-Ed'

  return (
    <Link
      href={`/things-to-do/fitness/${slug}`}
      className="group block bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        {hero_image ? (
          <Image
            src={hero_image}
            alt={name}
            title={`${name} - ${area}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200">
            <Dumbbell className="text-gray-400 w-16 h-16" />
          </div>
        )}

        {/* Rating Badge */}
        {bok_score && bok_score > 0 ? (
          <div className="absolute top-3 right-3 bg-blue-600 text-white backdrop-blur-sm rounded-xl px-3 py-2 shadow-2xl group-hover:scale-110 transition-transform duration-300">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-white text-white" />
              <div className="flex flex-col items-end">
                <span className="text-lg font-bold leading-none">
                  {bok_score.toFixed(1)}
                </span>
                <span className="text-[9px] opacity-90 leading-none mt-0.5">
                  BOK
                </span>
              </div>
            </div>
          </div>
        ) : google_rating && google_rating > 0 ? (
          <div className="absolute top-3 right-3 bg-blue-600 text-white backdrop-blur-sm rounded-xl px-3 py-2 shadow-2xl group-hover:scale-110 transition-transform duration-300">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-white text-white" />
              <div className="flex flex-col items-end">
                <span className="text-lg font-bold leading-none">
                  {google_rating.toFixed(1)}
                </span>
                <span className="text-[9px] opacity-90 leading-none mt-0.5">
                  Google
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Gender Policy Badge */}
        {gender_policy && gender_policy !== 'co-ed' && (
          <div className={`absolute top-3 left-3 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg flex items-center gap-1 border ${badgeColor}`}>
            <Users className="w-3 h-3" />
            <span className="text-xs font-semibold">{badgeLabel}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <FavoriteButton
            itemType="fitness"
            itemId={id}
            size="sm"
          />
          <AddToItineraryButton
            itemType="fitness"
            itemId={id}
            itemName={name}
            size="sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Fitness Place Name */}
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
          {name}
        </h3>

        {/* Fitness Types */}
        {fitness_types && fitness_types.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {fitness_types.slice(0, 3).map((type, index) => (
              <span
                key={index}
                className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded capitalize"
              >
                {type.replace('-', ' ')}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {short_description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {short_description}
          </p>
        )}

        {/* Metadata */}
        <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
          {/* Location */}
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{area}</span>
          </div>
        </div>

        {/* Review Count */}
        {total_reviews_aggregated && total_reviews_aggregated > 0 ? (
          <div className="mt-2 text-xs text-gray-500">
            {total_reviews_aggregated.toLocaleString()} {total_reviews_aggregated === 1 ? 'review' : 'reviews'}
          </div>
        ) : google_review_count && google_review_count > 0 ? (
          <div className="mt-2 text-xs text-gray-500">
            {google_review_count.toLocaleString()} Google reviews
          </div>
        ) : null}
      </div>
    </Link>
  )
}

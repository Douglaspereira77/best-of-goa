/**
 * School Card Component for Category Pages
 *
 * Displays school preview in grid layout for pages like:
 * - /places-to-learn
 * - /places-to-learn/british
 * - /places-to-learn/international
 */

import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, GraduationCap, DollarSign } from 'lucide-react';
import { FavoriteButton } from '@/components/user/FavoriteButton';
import { AddToItineraryButton } from '@/components/user/AddToItineraryButton';

interface SchoolCardProps {
  school: {
    id: string;
    slug: string;
    name: string;
    short_description?: string;
    area: string;
    hero_image?: string;
    logo_image?: string;
    bok_score?: number;
    total_reviews_aggregated?: number;
    google_rating?: number;
    parent_rating?: number;
    google_review_count?: number;
    school_type?: string;
    curriculum?: string[];
    grade_levels?: string[];
    tuition_range_min?: number;
    tuition_range_max?: number;
    currency?: string;
    gender_policy?: string;
    categories?: Array<{ name: string }>;
  };
}

export function SchoolCard({ school }: SchoolCardProps) {
  const {
    id,
    slug,
    name,
    short_description,
    area,
    hero_image,
    logo_image,
    bok_score,
    total_reviews_aggregated,
    google_rating,
    parent_rating,
    google_review_count,
    school_type,
    curriculum,
    grade_levels,
    tuition_range_min,
    tuition_range_max,
    currency,
    gender_policy,
    categories,
  } = school;

  // Use total_reviews_aggregated or fall back to google_review_count
  const reviewCount = total_reviews_aggregated || google_review_count;

  // Use bok_score or fall back to google_rating or parent_rating
  const displayRating = bok_score || google_rating || parent_rating;

  // Format tuition range
  const formatTuition = () => {
    if (!tuition_range_min && !tuition_range_max) return null;

    const currencySymbol = currency === 'KWD' ? 'KD' : currency || 'KD';

    if (tuition_range_min && tuition_range_max) {
      return `${currencySymbol} ${tuition_range_min.toLocaleString()}-${tuition_range_max.toLocaleString()}`;
    } else if (tuition_range_min) {
      return `From ${currencySymbol} ${tuition_range_min.toLocaleString()}`;
    } else if (tuition_range_max) {
      return `Up to ${currencySymbol} ${tuition_range_max.toLocaleString()}`;
    }
    return null;
  };

  // Get primary curriculum (first one)
  const primaryCurriculum = curriculum && curriculum.length > 0
    ? curriculum[0].charAt(0).toUpperCase() + curriculum[0].slice(1)
    : null;

  // Format grade range
  const gradeRange = grade_levels && grade_levels.length > 0
    ? grade_levels.length === 1
      ? grade_levels[0].replace(/_/g, ' ')
      : `${grade_levels[0].replace(/_/g, ' ')} - ${grade_levels[grade_levels.length - 1].replace(/_/g, ' ')}`
    : null;

  return (
    <Link
      href={`/places-to-learn/schools/${slug}`}
      className="group block bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        {hero_image ? (
          <Image
            src={hero_image}
            alt={name}
            title={`${name} - ${area || 'Goa'}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200">
            <GraduationCap className="text-gray-400 w-16 h-16" />
          </div>
        )}

        {/* Logo Overlay (if exists) */}
        {logo_image && (
          <div className="absolute bottom-3 left-3 w-16 h-16 bg-white rounded-lg shadow-lg overflow-hidden border-2 border-white">
            <Image
              src={logo_image}
              alt={`${name} logo`}
              title={`${name} school logo`}
              fill
              sizes="64px"
              className="object-contain p-1"
            />
          </div>
        )}

        {/* Rating Badge */}
        {displayRating && displayRating > 0 && (
          <div className="absolute top-3 right-3 bg-blue-600 text-white backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-2xl group-hover:scale-110 transition-transform duration-300">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-white text-white" />
              <div className="flex flex-col items-end">
                <span className="text-xl font-bold leading-none">
                  {displayRating.toFixed(1)}
                </span>
                <span className="text-[10px] opacity-90 leading-none mt-0.5">
                  {bok_score ? 'BOK' : 'out of 5'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* School Type Badge */}
        {school_type && (
          <div className="absolute top-3 left-3 bg-purple-600 text-white backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
            <span className="text-xs font-semibold capitalize">
              {school_type.replace(/_/g, ' ')}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute bottom-3 right-3 flex gap-1.5">
          <FavoriteButton
            itemType="school"
            itemId={id}
            size="sm"
          />
          <AddToItineraryButton
            itemType="school"
            itemId={id}
            itemName={name}
            size="sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* School Name */}
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
          {name}
        </h3>

        {/* Curriculum Badges */}
        {curriculum && curriculum.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {curriculum.slice(0, 2).map((curr, index) => (
              <span
                key={index}
                className="text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-medium"
              >
                {curr.charAt(0).toUpperCase() + curr.slice(1)}
              </span>
            ))}
            {curriculum.length > 2 && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                +{curriculum.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {short_description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {short_description}
          </p>
        )}

        {/* Metadata */}
        <div className="mt-3 space-y-2">
          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{area}</span>
          </div>

          {/* Grade Range */}
          {gradeRange && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <GraduationCap className="w-4 h-4" />
              <span className="line-clamp-1 capitalize">{gradeRange}</span>
            </div>
          )}

          {/* Tuition Range */}
          {formatTuition() && (
            <div className="flex items-center gap-1 text-sm text-gray-700 font-medium">
              <DollarSign className="w-4 h-4" />
              <span>{formatTuition()}</span>
            </div>
          )}
        </div>

        {/* Review Count */}
        {reviewCount && reviewCount > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            {reviewCount.toLocaleString()} reviews
          </div>
        )}

        {/* Gender Policy */}
        {gender_policy && gender_policy !== 'coed' && (
          <div className="mt-2">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded capitalize">
              {gender_policy.replace(/_/g, ' ')}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
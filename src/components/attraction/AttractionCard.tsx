/**
 * Attraction Card Component for Category Pages
 *
 * Displays attraction preview in grid layout for pages like:
 * - /places-to-visit
 * - /places-to-visit/cultural
 * - /places-to-visit/historical
 */

import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Heart } from 'lucide-react';
import { FavoriteButton } from '@/components/user/FavoriteButton';
import { AddToItineraryButton } from '@/components/user/AddToItineraryButton';

interface AttractionCardProps {
  attraction: {
    id: string;
    slug: string;
    name: string;
    short_description?: string;
    area: string;
    hero_image?: string;
    bok_score?: number;
    total_reviews_aggregated?: number;
    google_rating?: number;
    google_review_count?: number;
    age_suitability?: string;
    categories?: Array<{ name: string }>;
  };
}

export function AttractionCard({ attraction }: AttractionCardProps) {
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
    age_suitability,
    categories,
  } = attraction;

  // Use total_reviews_aggregated or fall back to google_review_count
  const reviewCount = total_reviews_aggregated || google_review_count;

  // Check if family-friendly based on age_suitability field
  const isFamilyFriendly = age_suitability && age_suitability.toLowerCase().includes('all');

  return (
    <Link
      href={`/places-to-visit/attractions/${slug}`}
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
            unoptimized={true}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-cyan-200">
            <span className="text-gray-400 text-4xl">🏛️</span>
          </div>
        )}

        {/* Rating Badge */}
        {bok_score && bok_score > 0 ? (
          <div className="absolute top-3 right-3 bg-blue-600 text-white backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-2xl group-hover:scale-110 transition-transform duration-300">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-white text-white" />
              <div className="flex flex-col items-end">
                <span className="text-xl font-bold leading-none">
                  {bok_score.toFixed(1)}
                </span>
                <span className="text-[10px] opacity-90 leading-none mt-0.5">
                  BOK
                </span>
              </div>
            </div>
          </div>
        ) : google_rating && google_rating > 0 ? (
          <div className="absolute top-3 right-3 bg-blue-600 text-white backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-2xl group-hover:scale-110 transition-transform duration-300">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-white text-white" />
              <div className="flex flex-col items-end">
                <span className="text-xl font-bold leading-none">
                  {google_rating.toFixed(1)}
                </span>
                <span className="text-[10px] opacity-90 leading-none mt-0.5">
                  out of 5
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Family-Friendly Badge */}
        {isFamilyFriendly && (
          <div className="absolute top-3 left-3 bg-green-600 text-white backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg flex items-center gap-1">
            <Heart className="w-3 h-3 fill-white" />
            <span className="text-xs font-semibold">Family-Friendly</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <FavoriteButton
            itemType="attraction"
            itemId={id}
            size="sm"
          />
          <AddToItineraryButton
            itemType="attraction"
            itemId={id}
            itemName={name}
            size="sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Attraction Name */}
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
          {name}
        </h3>

        {/* Categories */}
        {categories && categories.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {categories.slice(0, 2).map((category, index) => (
              <span
                key={index}
                className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded"
              >
                {category.name}
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
        {reviewCount && reviewCount > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            {reviewCount.toLocaleString()} reviews
          </div>
        )}
      </div>
    </Link>
  );
}

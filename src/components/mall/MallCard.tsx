/**
 * Mall Card Component for Category Pages
 *
 * Displays mall preview in grid layout for pages like:
 * - /places-to-shop (main hub)
 * - /places-to-shop/luxury-malls
 * - /places-to-shop/family-malls
 */

import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Store, ParkingCircle } from 'lucide-react';
import { FavoriteButton } from '@/components/user/FavoriteButton';
import { AddToItineraryButton } from '@/components/user/AddToItineraryButton';

interface MallCardProps {
  mall: {
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
    total_stores?: number;
    total_parking_spaces?: number;
    retail_tier?: string;
    categories?: Array<{ name: string }>;
  };
}

export function MallCard({ mall }: MallCardProps) {
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
    total_stores,
    total_parking_spaces,
    retail_tier,
    categories,
  } = mall;

  // Display retail tier as badge
  const tierDisplay = retail_tier ? retail_tier.replace('_', ' ').toUpperCase() : '';

  return (
    <Link
      href={`/places-to-shop/malls/${slug}`}
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
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-gray-400 text-4xl">🛍️</span>
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

        {/* Retail Tier Badge */}
        {tierDisplay && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg">
            <span className="text-xs font-semibold text-gray-700">
              {tierDisplay}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <FavoriteButton
            itemType="mall"
            itemId={id}
            size="sm"
          />
          <AddToItineraryButton
            itemType="mall"
            itemId={id}
            itemName={name}
            size="sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Mall Name */}
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

        {/* Mall Stats */}
        <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
          {/* Location */}
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{area}</span>
          </div>

          {/* Store Count */}
          {total_stores && total_stores > 0 && (
            <div className="flex items-center gap-1">
              <Store className="w-4 h-4" />
              <span className="font-medium text-gray-700">{total_stores} stores</span>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          {/* Parking */}
          {total_parking_spaces && total_parking_spaces > 0 && (
            <div className="flex items-center gap-1">
              <ParkingCircle className="w-3 h-3" />
              <span>{total_parking_spaces.toLocaleString()} parking</span>
            </div>
          )}

          {/* Review Count */}
          {total_reviews_aggregated && total_reviews_aggregated > 0 ? (
            <div>
              {total_reviews_aggregated.toLocaleString()} {total_reviews_aggregated === 1 ? 'review' : 'reviews'}
            </div>
          ) : google_review_count && google_review_count > 0 ? (
            <div>
              {google_review_count.toLocaleString()} reviews
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

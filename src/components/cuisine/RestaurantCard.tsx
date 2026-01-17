/**
 * Restaurant Card Component for Cuisine Category Pages
 *
 * Displays restaurant preview in grid layout for pages like:
 * - /places-to-eat/japanese-restaurants-goa
 * - /places-to-eat/best-sushi-goa
 */

import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, DollarSign } from 'lucide-react';
import { FavoriteButton } from '@/components/user/FavoriteButton';
import { AddToItineraryButton } from '@/components/user/AddToItineraryButton';

interface RestaurantCardProps {
  restaurant: {
    id: string;
    slug: string;
    name: string;
    short_description?: string;
    area: string;
    hero_image?: string;
    overall_rating?: number;
    total_reviews_aggregated?: number;
    price_level: number;
    cuisines?: Array<{ name: string }>;
  };
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const {
    id,
    slug,
    name,
    short_description,
    area,
    hero_image,
    overall_rating,
    total_reviews_aggregated,
    price_level,
    cuisines,
  } = restaurant;

  // Generate price range display
  const priceRange = '$'.repeat(Math.max(1, Math.min(4, price_level)));

  return (
    <Link
      href={`/places-to-eat/restaurants/${slug}`}
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
            <span className="text-gray-400 text-4xl">ðŸ½ï¸</span>
          </div>
        )}

        {/* Rating Badge - Enhanced Prominence */}
        {overall_rating && overall_rating > 0 && (
          <div className="absolute top-3 right-3 bg-blue-600 text-white backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-2xl group-hover:scale-110 transition-transform duration-300">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-white text-white" />
              <div className="flex flex-col items-end">
                <span className="text-xl font-bold leading-none">
                  {overall_rating.toFixed(1)}
                </span>
                <span className="text-[10px] opacity-90 leading-none mt-0.5">
                  out of 10
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <FavoriteButton
            itemType="restaurant"
            itemId={id}
            size="sm"
          />
          <AddToItineraryButton
            itemType="restaurant"
            itemId={id}
            itemName={name}
            size="sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Restaurant Name */}
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
          {name}
        </h3>

        {/* Cuisines */}
        {cuisines && cuisines.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {cuisines.slice(0, 2).map((cuisine, index) => (
              <span
                key={index}
                className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded"
              >
                {cuisine.name}
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

          {/* Price Level */}
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            <span className="font-medium text-gray-700">{priceRange}</span>
          </div>
        </div>

        {/* Review Count */}
        {total_reviews_aggregated && total_reviews_aggregated > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            {total_reviews_aggregated.toLocaleString()} reviews
          </div>
        )}
      </div>
    </Link>
  );
}

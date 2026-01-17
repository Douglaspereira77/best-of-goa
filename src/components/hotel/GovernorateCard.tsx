/**
 * Governorate Card Component for Hotels
 *
 * Displays governorate information with hotel count
 */

import Link from 'next/link';
import { MapPin, Building2 } from 'lucide-react';

interface GovernorateCardProps {
  governorate: {
    id: number;
    name: string;
    slug: string;
    description?: string;
    hotelCount: number;
  };
}

export function GovernorateCard({ governorate }: GovernorateCardProps) {
  const { name, slug, description, hotelCount } = governorate;

  return (
    <Link
      href={`/places-to-stay?governorate=${slug}`}
      className="group block bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden p-6 border border-gray-100 hover:border-blue-600"
    >
      {/* Icon */}
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
        <MapPin className="w-6 h-6" />
      </div>

      {/* Content */}
      <div className="mt-4">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
          {name}
        </h3>

        {description && (
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {description}
          </p>
        )}

        {/* Hotel Count */}
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
          <Building2 className="w-4 h-4" />
          <span>
            {hotelCount} {hotelCount === 1 ? 'hotel' : 'hotels'}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <div className="mt-4 flex items-center text-sm font-medium text-blue-600 group-hover:translate-x-1 transition-transform">
        Explore hotels →
      </div>
    </Link>
  );
}

'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';

interface LocationMapProps {
  placeId?: string;
  latitude?: number;
  longitude?: number;
  name: string;
  address: string;
  className?: string;
}

export function LocationMap({
  placeId,
  latitude,
  longitude,
  name,
  address,
  className = 'w-full h-[450px]',
}: LocationMapProps) {
  const [mapError, setMapError] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

  // Generate embed URL based on available data
  const getEmbedUrl = () => {
    // Option 1: Use Place ID (best option - shows business info, reviews, photos)
    if (placeId && apiKey) {
      return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${placeId}`;
    }

    // Option 2: Use coordinates (fallback - shows pin on map)
    if (latitude && longitude) {
      return `https://maps.google.com/maps?q=${latitude},${longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }

    // Option 3: Use name + address as search (last resort)
    const query = encodeURIComponent(`${name}, ${address}`);
    return `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  };

  const embedUrl = getEmbedUrl();

  if (mapError) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`}>
        <div className="text-center p-6">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 font-medium">Unable to load map</p>
          <p className="text-sm text-gray-500 mt-1">{address}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} rounded-lg overflow-hidden shadow-sm border border-gray-200`}>
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={embedUrl}
        onError={() => setMapError(true)}
        title={`Map showing location of ${name}`}
      />
    </div>
  );
}

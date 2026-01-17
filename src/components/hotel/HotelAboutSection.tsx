'use client';

import { useState } from 'react';

interface HotelAboutSectionProps {
  description: string;
}

export function HotelAboutSection({ description }: HotelAboutSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = description.length > 500;
  const displayText = isExpanded || !shouldTruncate
    ? description
    : description.substring(0, 500) + '...';

  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-semibold mb-4">About</h2>
      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
        {displayText}
      </p>
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 text-blue-600 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </section>
  );
}

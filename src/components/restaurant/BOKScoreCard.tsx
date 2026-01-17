'use client';

import { BadgeCheck } from 'lucide-react';

interface BOKScoreCardProps {
  bokScore: number;
  bokScoreBreakdown?: {
    food_quality: number;
    service: number;
    ambience: number;
    value_for_money: number;
    accessibility_amenities: number;
  };
  googleRating?: number;
  googleReviewCount?: number;
  tripadvisorRating?: number;
  tripadvisorReviewCount?: number;
  totalReviews?: number;
}

interface RatingBarProps {
  label: string;
  score: number;
  icon?: string;
}

function RatingBar({ label, score, icon }: RatingBarProps) {
  const percentage = (score / 10) * 100;

  // Color based on score
  const getColor = () => {
    if (score >= 9) return 'bg-green-500';
    if (score >= 8) return 'bg-green-400';
    if (score >= 7) return 'bg-yellow-400';
    if (score >= 6) return 'bg-orange-400';
    return 'bg-red-400';
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-between w-full mb-1">
        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
          {icon && <span>{icon}</span>}
          {label}
        </span>
        <span className="text-sm font-bold text-green-600 min-w-[45px] text-right bg-green-50 px-2 py-0.5 rounded">
          {score.toFixed(1)}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function BOKScoreCard({
  bokScore,
  bokScoreBreakdown,
  googleRating,
  googleReviewCount,
  tripadvisorRating,
  tripadvisorReviewCount,
  totalReviews,
}: BOKScoreCardProps) {
  const getRatingDescription = (score: number): string => {
    if (score >= 9.0) return 'Exceptional';
    if (score >= 8.0) return 'Excellent';
    if (score >= 7.0) return 'Very Good';
    if (score >= 6.0) return 'Good';
    if (score >= 5.0) return 'Average';
    return 'Below Average';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
      {/* Best of Goa Verified Badge */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-2 text-green-600">
          <BadgeCheck className="w-5 h-5" />
          <span className="text-sm font-semibold">Best of Goa Verified</span>
        </div>
      </div>

      {/* Main BOK Score */}
      <div className="mb-6">
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-6xl font-bold text-green-600">{bokScore.toFixed(1)}</span>
          <span className="text-2xl text-gray-400 font-light">/10</span>
        </div>
        <div className="text-lg font-semibold text-gray-700 mb-2">
          {getRatingDescription(bokScore)}
        </div>
        <p className="text-sm text-gray-600">
          Our weighted 10-point scoring system for Goa's fine dining scene prioritises culinary innovation, service excellence, and overall ambience.
        </p>
      </div>

      {/* Component Breakdown */}
      {bokScoreBreakdown && (
        <details className="mb-6 group">
          <summary className="cursor-pointer text-sm font-semibold text-green-600 hover:text-green-700 flex items-center gap-2 list-none">
            <span className="group-open:rotate-90 transition-transform">â–¶</span>
            Show Rating Breakdown
          </summary>
          <div className="mt-4 space-y-3 pl-5">
            <RatingBar
              label="Food Quality"
              score={bokScoreBreakdown.food_quality}
              icon="ðŸ½ï¸"
            />
            <RatingBar
              label="Service"
              score={bokScoreBreakdown.service}
              icon="ðŸ‘¨â€ðŸ³"
            />
            <RatingBar
              label="Ambience"
              score={bokScoreBreakdown.ambience}
              icon="ðŸ®"
            />
            <RatingBar
              label="Value for Money"
              score={bokScoreBreakdown.value_for_money}
              icon="ðŸ’°"
            />
            <RatingBar
              label="Accessibility & Amenities"
              score={bokScoreBreakdown.accessibility_amenities}
              icon="â™¿"
            />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
            <p>
              We consider factors like ingredient quality, menu creativity, and dining experience sophistication.
              Our assessment combines expert critiques, diner feedback, and firsthand evaluations.
            </p>
            <p className="mt-2 italic">
              Scores above 9.00 denote world-class quality, signifying Goa's premier fine dining experiences.
            </p>
          </div>
        </details>
      )}

      {/* Source Ratings */}
      <div className="pt-4 border-t border-gray-200">
        <div className="text-sm font-medium text-gray-700 mb-2">
          Based on {totalReviews || 0} reviews from:
        </div>
        <div className="space-y-2 text-sm">
          {googleRating && googleReviewCount && (
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-600">Google:</span>
              <span className="text-gray-700">
                {googleRating.toFixed(1)}/5
                <span className="text-gray-500 ml-1">({googleReviewCount.toLocaleString()} reviews)</span>
              </span>
            </div>
          )}
          {tripadvisorRating && tripadvisorReviewCount && (
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-600">TripAdvisor:</span>
              <span className="text-gray-700">
                {tripadvisorRating.toFixed(1)}/5
                <span className="text-gray-500 ml-1">({tripadvisorReviewCount.toLocaleString()} reviews)</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

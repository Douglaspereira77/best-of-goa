'use client';

import { BadgeCheck } from 'lucide-react';

interface FitnessBOKScoreCardProps {
  bokScore: number;
  bokScoreBreakdown?: {
    facilities: number;
    equipment: number;
    cleanliness: number;
    staff: number;
    value_for_money: number;
    atmosphere: number;
  };
  googleRating?: number;
  googleReviewCount?: number;
  facebookRating?: number;
  facebookReviewCount?: number;
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
    <div className="space-y-1">
      <div className="flex items-center justify-between">
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

export function FitnessBOKScoreCard({
  bokScore,
  bokScoreBreakdown,
  googleRating,
  googleReviewCount,
  facebookRating,
  facebookReviewCount,
  totalReviews,
}: FitnessBOKScoreCardProps) {
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
          Our weighted 10-point scoring system for Goa&apos;s fitness centers prioritises facilities quality, equipment, cleanliness, staff expertise, and overall value.
        </p>
      </div>

      {/* Component Breakdown */}
      {bokScoreBreakdown && (
        <details className="mb-6 group">
          <summary className="cursor-pointer text-sm font-semibold text-green-600 hover:text-green-700 flex items-center gap-2 list-none">
            <span className="group-open:rotate-90 transition-transform">&#9654;</span>
            Show Rating Breakdown
          </summary>
          <div className="mt-4 space-y-3 pl-5">
            <RatingBar
              label="Facilities"
              score={bokScoreBreakdown.facilities}
              icon="ðŸ¢"
            />
            <RatingBar
              label="Equipment"
              score={bokScoreBreakdown.equipment}
              icon="ðŸ’ª"
            />
            <RatingBar
              label="Cleanliness"
              score={bokScoreBreakdown.cleanliness}
              icon="âœ¨"
            />
            <RatingBar
              label="Staff"
              score={bokScoreBreakdown.staff}
              icon="ðŸ‘¥"
            />
            <RatingBar
              label="Value for Money"
              score={bokScoreBreakdown.value_for_money}
              icon="ðŸ’°"
            />
            <RatingBar
              label="Atmosphere"
              score={bokScoreBreakdown.atmosphere}
              icon="ðŸŒŸ"
            />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
            <p>
              We consider factors like equipment quality, facility cleanliness, staff expertise, member satisfaction, and value for money. Our assessment combines expert evaluations, member feedback, and firsthand inspections.
            </p>
            <p className="mt-2 italic">
              Scores above 9.00 denote exceptional quality, signifying Goa&apos;s premier fitness centers and gyms.
            </p>
          </div>
        </details>
      )}

      {/* Source Ratings */}
      <div className="pt-4 border-t border-gray-200">
        <div className="text-sm font-medium text-gray-700 mb-2">
          Based on {totalReviews?.toLocaleString() || 0} reviews from:
        </div>
        <div className="space-y-2 text-sm">
          {googleRating && googleReviewCount ? (
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-600">Google:</span>
              <span className="text-gray-700">
                {googleRating.toFixed(1)}/5
                <span className="text-gray-500 ml-1">
                  ({googleReviewCount.toLocaleString()} reviews)
                </span>
              </span>
            </div>
          ) : null}
          {facebookRating && facebookReviewCount ? (
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-600">Facebook:</span>
              <span className="text-gray-700">
                {facebookRating.toFixed(1)}/5
                <span className="text-gray-500 ml-1">
                  ({facebookReviewCount.toLocaleString()} reviews)
                </span>
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
































'use client';

import { BadgeCheck } from 'lucide-react';

interface SchoolBOKScoreCardProps {
  bokScore: number;
  bokScoreBreakdown?: {
    academic_excellence: number;
    facilities_quality: number;
    teacher_quality: number;
    programs_activities: number;
    environment_safety: number;
    value_for_money: number;
  };
  googleRating?: number;
  googleReviewCount?: number;
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

export function SchoolBOKScoreCard({
  bokScore,
  bokScoreBreakdown,
  googleRating,
  googleReviewCount,
  totalReviews,
}: SchoolBOKScoreCardProps) {
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
          Our weighted 10-point scoring system for Goa&apos;s schools prioritises academic excellence, facilities quality, teacher expertise, and overall educational environment.
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
              label="Academic Excellence"
              score={bokScoreBreakdown.academic_excellence}
              icon="ðŸ“š"
            />
            <RatingBar
              label="Facilities Quality"
              score={bokScoreBreakdown.facilities_quality}
              icon="ðŸ«"
            />
            <RatingBar
              label="Teacher Quality"
              score={bokScoreBreakdown.teacher_quality}
              icon="ðŸ‘¨â€ðŸ«"
            />
            <RatingBar
              label="Programs & Activities"
              score={bokScoreBreakdown.programs_activities}
              icon="ðŸŽ“"
            />
            <RatingBar
              label="Environment & Safety"
              score={bokScoreBreakdown.environment_safety}
              icon="ðŸ›¡ï¸"
            />
            <RatingBar
              label="Value for Money"
              score={bokScoreBreakdown.value_for_money}
              icon="ðŸ’°"
            />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
            <p>
              We evaluate schools based on curriculum quality, teaching standards, facilities, extracurricular programs, and overall learning environment. Our assessment combines expert evaluations, parent feedback, and firsthand inspections.
            </p>
            <p className="mt-2 italic">
              Scores above 9.00 denote world-class quality, signifying Goa&apos;s premier educational institutions.
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
        </div>
      </div>
    </div>
  );
}

































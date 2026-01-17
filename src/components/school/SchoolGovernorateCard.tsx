import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Star, GraduationCap } from 'lucide-react';

interface Governorate {
  id: string;
  name: string;
  slug: string;
  school_count: number;
  avg_rating: number;
}

interface SchoolGovernorateCardProps {
  governorate: Governorate;
}

export function SchoolGovernorateCard({ governorate }: SchoolGovernorateCardProps) {
  return (
    <Link href={`/places-to-learn?governorate=${governorate.slug}`}>
      <Card className="group hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-purple-400 bg-gradient-to-br from-purple-50 to-slate-50 hover:from-purple-100 hover:to-slate-100">
        <CardContent className="p-6">
          {/* Icon & Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-purple-600 rounded-xl group-hover:bg-purple-700 transition-colors">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors mb-1">
                {governorate.name}
              </h3>
              <p className="text-sm text-gray-600">
                Discover top schools
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-gray-700">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold">
                {governorate.school_count}
              </span>
              <span className="text-xs text-gray-500">
                schools
              </span>
            </div>

            {governorate.avg_rating > 0 && (
              <div className="flex items-center gap-1 text-gray-700">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold">
                  {governorate.avg_rating.toFixed(1)}
                </span>
                <span className="text-xs text-gray-500">
                  avg rating
                </span>
              </div>
            )}
          </div>

          {/* Hover Arrow */}
          <div className="mt-4 flex items-center text-purple-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
            Explore {governorate.name} Schools
            <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

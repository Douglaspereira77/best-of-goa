/**
 * Quick Filter Pills Component for Hotels
 *
 * Navigation pills for quick category access on places-to-stay pages
 */

'use client';

import Link from 'next/link';
import { Star, TrendingUp, DollarSign, Palmtree } from 'lucide-react';

interface QuickFilterPillsProps {
  activeFilter?: string;
}

const filters = [
  {
    label: 'Top Rated',
    value: 'top-rated',
    icon: Star,
    href: '#top-rated',
  },
  {
    label: 'Luxury',
    value: 'luxury',
    icon: TrendingUp,
    href: '#luxury',
  },
  {
    label: 'Budget-Friendly',
    value: 'budget',
    icon: DollarSign,
    href: '#budget-friendly',
  },
  {
    label: 'Resorts',
    value: 'resorts',
    icon: Palmtree,
    href: '/places-to-stay/resort-hotels',
  },
];

export function QuickFilterPills({ activeFilter }: QuickFilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.value;

        return (
          <Link
            key={filter.value}
            href={filter.href}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
              transition-all duration-200
              ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-600 hover:text-blue-600 hover:shadow-md'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span>{filter.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
